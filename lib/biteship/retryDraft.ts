import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createBiteshipDraft } from './createDraft';
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
  attemptNumber?: number
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
  const { data: existing, error: guardErr } = await supabase
    .from('ecom_orders')
    .select('biteship_draft_id')
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

  if (attempt >= MAX_RETRIES) {
    const { data: order } = await supabase
      .from('ecom_orders')
      .select('order_number, customer_name, customer_phone, total')
      .eq('id', orderId)
      .single();

    // Conditional write doubles as a concurrent-chain dedupe: if a parallel
    // chain (e.g. admin endpoint invoked mid-backoff) already flagged this
    // order, this UPDATE matches 0 rows and we skip the second GAGAL-3x
    // alert. When the write errors for any other reason (e.g. the live
    // CHECK constraint still rejects 'requires_attention' until agr-ops
    // migration 051 is applied), we still alert — the terminal failure must
    // never go silent (issue #199 AC3).
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

    if (!statusErr && (flaggedRows?.length ?? 0) === 0) {
      console.warn(
        `[retryBiteshipDraft] Order ${orderId} already flagged requires_attention by a concurrent chain — skipping duplicate alert`
      );
      return;
    }

    await sendOpsAlert({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      issue: 'BITESHIP GAGAL 3x — perlu tindakan manual',
      action: 'Cek Biteship dashboard atau gunakan endpoint retry manual',
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
    await retryBiteshipDraft(orderId, attempt + 1);
    return;
  }

  // Non-retryable: status update and notification
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
