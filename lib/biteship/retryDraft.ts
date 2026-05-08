import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createBiteshipDraft } from './createDraft';
import { sendPaymentNotification } from '@/lib/telegram/notify';

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

    // HACK: using paymentMethod field to carry ops alert text
    await sendPaymentNotification({
      orderId,
      orderNumber: order?.order_number ?? 'UNKNOWN',
      customerName: order?.customer_name ?? 'UNKNOWN',
      customerPhone: order?.customer_phone ?? 'UNKNOWN',
      paymentMethod: '⚠️ BITESHIP GAGAL 3x — perlu tindakan manual',
      total: order?.total ?? 0,
      paidAt: new Date().toISOString(),
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

  // HACK: using paymentMethod field to carry ops alert text
  await sendPaymentNotification({
    orderId,
    orderNumber: order?.order_number ?? 'UNKNOWN',
    customerName: order?.customer_name ?? 'UNKNOWN',
    customerPhone: order?.customer_phone ?? 'UNKNOWN',
    paymentMethod: '✅ BITESHIP DRAFT BERHASIL DIBUAT ULANG',
    total: order?.total ?? 0,
    paidAt: new Date().toISOString(),
  }).catch(() => {});
}
