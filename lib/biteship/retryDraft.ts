import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createBiteshipDraft } from './createDraft';
import { sendOpsAlert } from '@/lib/telegram/opsAlert';

const MAX_RETRIES = 3;

export async function retryBiteshipDraft(
  orderId: string,
  attemptNumber?: number
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const attempt = attemptNumber ?? 0;

  if (attempt >= MAX_RETRIES) {
    const { data: order } = await supabase
      .from('ecom_orders')
      .select('order_number, customer_name, customer_phone, total')
      .eq('id', orderId)
      .single();

    await supabase
      .from('ecom_orders')
      .update({ status: 'requires_attention' })
      .eq('id', orderId);

    await sendOpsAlert({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      issue: 'BITESHIP GAGAL 3x — perlu tindakan manual',
      action: 'Cek Biteship dashboard atau gunakan endpoint retry manual',
    }).catch(() => {});

    console.error(`[retryBiteshipDraft] Max retries (${MAX_RETRIES}) reached for order ${orderId}`);
    return;
  }

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
