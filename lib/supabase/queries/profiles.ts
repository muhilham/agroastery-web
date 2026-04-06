import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  data: { full_name?: string; phone?: string }
): Promise<void> {
  await supabase
    .from('profiles')
    .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
}
