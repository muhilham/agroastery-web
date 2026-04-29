import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type Address = Database['public']['Tables']['addresses']['Row'];

export async function getAddresses(
  supabase: SupabaseClient,
  userId: string
): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Address[];
}

export async function getAddressById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data as Address;
}
