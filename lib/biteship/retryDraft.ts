import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createBiteshipDraft } from './createDraft';
import { attemptCourierFallback, formatCandidatesForAlert } from './courierFallback';
import { sendOpsAlert } from '@/lib/telegram/opsAlert';

const MAX_RETRIES = 3;

/**
 * In-process backoff before each create attempt (issue #199): attempt 0
 * fires immediately, then 60s and 300s — enough to ride out a minutes-long
 * courier blip like the AGR-20260928-97YXK5 incident (lane serviceable ~2
 * minutes later). Requires a long-lived process; a deploy/restart mid-chain
 * loses the remaining attempts silently (documented, accepted — the admin
 * retry endpoint remains the manual recovery path).
 */
const RETRY_DELAYS_MS = [0, 60_000, 300_000];

/**
 * Non-retryable throws from createBiteshipDraft — data/config bugs where a
 * retry can only produce the same failure (or, for the Reference-ID case,
 * mint a duplicate draft under a fresh reference). Everything else (Biteship
 * API errors with the payload embedded in the message, network failures) is
 * transient. Prefix list is the complete contract — do NOT add code-based
 * rules (see the taxonomy note in issue #199).
 */
const NON_RETRYABLE_PREFIXES = [
  '[createBiteshipDraft] Order not found',
  '[createBiteshipDraft] No order items found',
  '[createBiteshipDraft] Missing BITESHIP_API_KEY',
  '[createBiteshipDraft] Reference ID',
];

export function isRetryableDraftError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return !NON_RETRYABLE_PREFIXES.some((prefix) => message.startsWith(prefix));
}

export async function retryBiteshipDraft(
  orderId: string,
  attemptNumber?: number,
  flaggedAtEntry?: boolean
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const attempt = attemptNumber ?? 0;

  // Duplicate-draft guard (issue #199) — runs on EVERY entry, including the
  // attempt >= MAX_RETRIES re-entry: if a concurrent chain (e.g. the admin
  // endpoint) succeeded mid-backoff and stored a draft id, this chain must
  // not fire the exhaustion alert or overwrite status below it.
  // Retries use unique reference_ids, which bypasses createDraft's
  // 42211015 same-reference idempotency recovery — if a draft id is already
  // stored, re-drafting risks a second server-side draft, so short-circuit.
  // This also makes admin-endpoint re-invocation safe. Known edge (courier_
  // not_found): if the webhook's nulling update failed, its clearError log
  // fired but the flow continued; we deliberately short-circuit here because
  // the stale non-null id means a draft exists and re-drafting is riskier.
  // Best-effort: two chains already in flight before either stores a draft
  // id can still both create (read-then-act TOCTOU) — covered by #199's
  // accepted cost (unconfirmed drafts are harmless until confirmed).
  const { data: existing, error: guardErr } = await supabase
    .from('ecom_orders')
    .select('biteship_draft_id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (guardErr) {
    // Contract pins behavior only for a non-null draft id; on a read failure
    // the state is unknown. Proceed with the retry (a transient DB glitch
    // must not silently kill the whole chain) but leave a trace.
    console.warn(
      `[retryBiteshipDraft] Guard read failed for ${orderId}: ${guardErr.message} — proceeding (draft-id state unknown)`
    );
  }

  if (existing?.biteship_draft_id) {
    console.warn(
      `[retryBiteshipDraft] Order ${orderId} already has biteship_draft_id=${existing.biteship_draft_id} — skipping retry to avoid a duplicate draft`
    );
    return;
  }

  // Stale-vs-concurrent discriminator for the exhaustion dedupe below,
  // pinned ONCE at true chain entry (attempt 0) and carried through the
  // recursion: mid-chain guard re-reads must NOT re-pin it, or a concurrent
  // chain's fresh flag would be mislabeled 'stale' and double-alert.
  const wasAlreadyFlagged =
    flaggedAtEntry ?? (existing?.status === 'requires_attention');

  if (attempt >= MAX_RETRIES) {
    const { data: order } = await supabase
      .from('ecom_orders')
      .select('order_number, customer_name, customer_phone, total')
      .eq('id', orderId)
      .single();

    // Conditional write doubles as a dedupe. Three terminal states (issue #199 AC3):
    // - write errors (e.g. the live CHECK constraint still rejects
    //   'requires_attention' until agr-ops migration 051 is applied):
    //   console.error AND still alert — a terminal failure never goes silent.
    // - write matched 0 rows AND the order was NOT flagged when this chain
    //   entered: a parallel chain flagged it mid-backoff (genuinely
    //   concurrent) — suppress the duplicate GAGAL-3x alert.
    // - write matched 0 rows BUT this chain saw status='requires_attention'
    //   at entry (stale flag from a previous failed chain; admin re-retry):
    //   that is a NEW terminal failure event, not a duplicate — alert anyway
    //   so ops hears about the re-exhaustion instead of silence behind a 200.
    const { error: statusErr, data: flaggedRows } = await supabase
      .from('ecom_orders')
      .update({ status: 'requires_attention' })
      .eq('id', orderId)
      .neq('status', 'requires_attention')
      .select('id');

    if (statusErr) {
      console.error(
        `[retryBiteshipDraft] requires_attention write failed for ${orderId}: ${statusErr.message} (expected until agr-ops migration 051 is applied to prod)`
      );
    }

    const flaggedByOtherChain =
      !statusErr && (flaggedRows?.length ?? 0) === 0 && !wasAlreadyFlagged;
    if (flaggedByOtherChain) {
      console.warn(
        `[retryBiteshipDraft] Order ${orderId} flagged requires_attention by a concurrent chain during this retry — skipping duplicate alert`
      );
      return;
    }

    // Fallback before declaring terminal failure (issue #200): re-quote the
    // lane and book the best in-budget alternative. A successful fallback
    // means the order is drafted — mirror the success path (processing + the
    // FALLBACK KURIR alert attemptCourierFallback already sent) instead of
    // alerting GAGAL 3x. Only when nothing applies does the order stay
    // requires_attention, and the alert then carries the RANKED alternatives
    // so a human decides in seconds.
    // Runs AFTER the concurrent-flag dedupe: if another chain just flagged
    // this order, that chain owns its own fallback pass — we must not race a
    // second re-quote/swap against it.
    const fallback = await attemptCourierFallback(orderId).catch((err: unknown) => {
      console.error(`[retryBiteshipDraft] fallback errored for order ${orderId}:`, err);
      return null;
    });

    if (fallback?.kind === 'applied') {
      await supabase
        .from('ecom_orders')
        .update({ status: 'processing' })
        .eq('id', orderId)
        .then(() => {});
      console.log(
        `[retryBiteshipDraft] Fallback applied for order ${orderId} via ${fallback.applied.rate.courier_code}/${fallback.applied.rate.courier_service_code}`
      );
      return;
    }

    const rankedList = fallback
      ? formatCandidatesForAlert(fallback.ranked)
      : '(re-quote tidak berjalan)';
    await sendOpsAlert({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      issue: 'BITESHIP GAGAL 3x — perlu tindakan manual',
      action: `Cek Biteship dashboard atau gunakan endpoint retry manual.\nAlternatif re-quote lane (terbaik dulu):\n${rankedList}`,
    }).catch(() => {});

    console.error(`[retryBiteshipDraft] Max retries (${MAX_RETRIES}) reached for order ${orderId}`);
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));

  const referenceId = `${orderId}--retry-${Date.now()}-${attempt}`;

  try {
    await createBiteshipDraft(orderId, referenceId);
    console.log(`[retryBiteshipDraft] Retry ${attempt + 1} succeeded for order ${orderId} with ref ${referenceId}`);
  } catch (err) {
    console.error(`[retryBiteshipDraft] Retry ${attempt + 1} failed for order ${orderId}:`, err);
    await retryBiteshipDraft(orderId, attempt + 1, wasAlreadyFlagged);
    return;
  }

  // Success path: persist processing status and send the recovery alert
  const { data: order } = await supabase
    .from('ecom_orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .select('order_number, customer_name, customer_phone, total')
    .single();

  await sendOpsAlert({
    orderId,
    orderNumber: order?.order_number ?? 'UNKNOWN',
    issue: 'BITESHIP DRAFT BERHASIL DIBUAT ULANG',
  }).catch(() => {});
}
