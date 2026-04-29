import { describe, it, expect, vi } from 'vitest';
import { getProfile, upsertProfile } from './profiles';
import { getAddresses, getAddressById } from './addresses';

// ─── getProfile ───────────────────────────────────────────────────────────────

describe('getProfile', () => {
  it('returns null when profile not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eq = { single };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getProfile(supabase as any, 'user-1');
    expect(result).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('returns profile data when found', async () => {
    const profile = { id: 'user-1', full_name: 'Budi', phone: '081234567890', default_address_id: null, created_at: '', updated_at: '' };
    const single = vi.fn().mockResolvedValue({ data: profile, error: null });
    const eq = { single };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getProfile(supabase as any, 'user-1');
    expect(result).toEqual(profile);
  });
});

// ─── upsertProfile ────────────────────────────────────────────────────────────

describe('upsertProfile', () => {
  it('calls upsert on profiles table with userId and data', async () => {
    const upsertFn = vi.fn().mockResolvedValue({ error: null });
    const from = { upsert: upsertFn };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    await upsertProfile(supabase as any, 'user-1', { full_name: 'Budi', phone: '081234' });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(upsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', full_name: 'Budi', phone: '081234' })
    );
  });

  it('throws when Supabase returns an error', async () => {
    const upsertFn = vi.fn().mockResolvedValue({ error: { message: 'DB error' } });
    const from = { upsert: upsertFn };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    await expect(
      upsertProfile(supabase as any, 'user-1', { full_name: 'Budi' })
    ).rejects.toThrow('DB error');
  });
});

// ─── getAddresses ─────────────────────────────────────────────────────────────

describe('getAddresses', () => {
  it('returns addresses ordered by is_default DESC then created_at ASC', async () => {
    const addresses = [
      { id: 'addr-1', user_id: 'user-1', is_default: true },
      { id: 'addr-2', user_id: 'user-1', is_default: false },
    ];
    const finalOrder = vi.fn().mockResolvedValue({ data: addresses, error: null });
    const firstOrder = { order: finalOrder };
    const eq = { order: vi.fn().mockReturnValue(firstOrder) };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddresses(supabase as any, 'user-1');

    expect(result).toEqual(addresses);
    expect(supabase.from).toHaveBeenCalledWith('addresses');
    expect(eq.order).toHaveBeenCalledWith('is_default', { ascending: false });
    expect(finalOrder).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('throws on Supabase error', async () => {
    const finalOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const firstOrder = { order: finalOrder };
    const eq = { order: vi.fn().mockReturnValue(firstOrder) };
    const select = { eq: vi.fn().mockReturnValue(eq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    await expect(getAddresses(supabase as any, 'user-1')).rejects.toThrow('DB error');
  });
});

// ─── getAddressById ───────────────────────────────────────────────────────────

describe('getAddressById', () => {
  it('returns null when address not found', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const secondEq = { single };
    const firstEq = { eq: vi.fn().mockReturnValue(secondEq) };
    const select = { eq: vi.fn().mockReturnValue(firstEq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddressById(supabase as any, 'addr-1', 'user-1');
    expect(result).toBeNull();
  });

  it('returns address when found and owned by user', async () => {
    const address = { id: 'addr-1', user_id: 'user-1', recipient_name: 'Budi' };
    const single = vi.fn().mockResolvedValue({ data: address, error: null });
    const secondEq = { single };
    const firstEq = { eq: vi.fn().mockReturnValue(secondEq) };
    const select = { eq: vi.fn().mockReturnValue(firstEq) };
    const from = { select: vi.fn().mockReturnValue(select) };
    const supabase = { from: vi.fn().mockReturnValue(from) };

    const result = await getAddressById(supabase as any, 'addr-1', 'user-1');
    expect(result).toEqual(address);
    expect(firstEq.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});
