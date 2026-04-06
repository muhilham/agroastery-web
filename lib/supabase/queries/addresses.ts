import type { SupabaseClient } from '@supabase/supabase-js';

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  address_line: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
};

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

  if (error) return [];
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
