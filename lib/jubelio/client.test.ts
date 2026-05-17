import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Jubelio Client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.JUBELIO_EMAIL = 'test@example.com';
    process.env.JUBELIO_PASSWORD = 'test-password';
    process.env.JUBELIO_MOCK = 'false';
  });

  describe('fetchJubelioItemBySku', () => {
    it('returns the exact SKU match', async () => {
      const { fetchJubelioItemBySku } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              { item_id: 100, item_code: 'PS-BK-001', item_name: 'Kopi Arabika' },
              { item_id: 101, item_code: 'PS-BK-002', item_name: 'Kopi Robusta' },
            ],
          }),
        });
      });

      const result = await fetchJubelioItemBySku('PS-BK-002');
      expect(result).toEqual({ item_id: 101, item_code: 'PS-BK-002', item_name: 'Kopi Robusta' });
    });

    it('returns null when SKU is not found', async () => {
      const { fetchJubelioItemBySku } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ item_id: 1, item_code: 'OTHER', item_name: 'Other' }] }),
        });
      });

      const result = await fetchJubelioItemBySku('PS-BK-999');
      expect(result).toBeNull();
    });

    it('returns null on API error', async () => {
      const { fetchJubelioItemBySku } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: false, status: 500 });
      });

      const result = await fetchJubelioItemBySku('PS-BK-001');
      expect(result).toBeNull();
    });
  });

  describe('createJubelioSalesOrder', () => {
    it('returns salesorder_id on success', async () => {
      const { createJubelioSalesOrder } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 12345 }) });
      });

      const id = await createJubelioSalesOrder({
        salesorder_id: 0,
        salesorder_no: '[auto]',
        contact_id: 0,
        customer_name: 'Test',
        transaction_date: '2024-01-01T00:00:00',
        sub_total: 100000,
        total_disc: 0,
        total_tax: 0,
        grand_total: 100000,
        location_id: -1,
        source: 524289,
        add_fee: 0,
        add_disc: 0,
        service_fee: 0,
        items: [],
      });

      expect(id).toBe(12345);
    });

    it('throws on API error with body', async () => {
      const { createJubelioSalesOrder } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid data' }),
          text: () => Promise.resolve('Invalid data'),
        });
      });

      await expect(
        createJubelioSalesOrder({
          salesorder_id: 0,
          salesorder_no: '[auto]',
          contact_id: 0,
          customer_name: 'Test',
          transaction_date: '2024-01-01T00:00:00',
          sub_total: 100000,
          total_disc: 0,
          total_tax: 0,
          grand_total: 100000,
          location_id: -1,
          source: 524289,
          add_fee: 0,
          add_disc: 0,
          service_fee: 0,
          items: [],
        })
      ).rejects.toThrow('Jubelio createSalesOrder failed: 400');
    });

    it('throws when response lacks id', async () => {
      const { createJubelioSalesOrder } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      });

      await expect(
        createJubelioSalesOrder({
          salesorder_id: 0,
          salesorder_no: '[auto]',
          contact_id: 0,
          customer_name: 'Test',
          transaction_date: '2024-01-01T00:00:00',
          sub_total: 100000,
          total_disc: 0,
          total_tax: 0,
          grand_total: 100000,
          location_id: -1,
          source: 524289,
          add_fee: 0,
          add_disc: 0,
          service_fee: 0,
          items: [],
        })
      ).rejects.toThrow('Jubelio createSalesOrder: no id in response');
    });
  });

  describe('convertJubelioToInvoicePayment', () => {
    it('returns invoice number on success', async () => {
      const { convertJubelioToInvoicePayment } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ invoice_no: 'INV-000001' }) });
      });

      const result = await convertJubelioToInvoicePayment(12345);
      expect(result).toBe('INV-000001');
    });

    it('falls back to id when invoice_no is missing', async () => {
      const { convertJubelioToInvoicePayment } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 999 }) });
      });

      const result = await convertJubelioToInvoicePayment(12345);
      expect(result).toBe('999');
    });

    it('throws when response lacks invoice_no and id', async () => {
      const { convertJubelioToInvoicePayment } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
      });

      await expect(convertJubelioToInvoicePayment(12345)).rejects.toThrow(
        'Jubelio convertToInvoicePayment: no invoice_no or id in response'
      );
    });

    it('throws on API error', async () => {
      const { convertJubelioToInvoicePayment } = await import('@/lib/jubelio/client');
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/login')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'test-token' }) });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve('Internal Server Error'),
        });
      });

      await expect(convertJubelioToInvoicePayment(12345)).rejects.toThrow(
        'Jubelio convertToInvoicePayment failed: 500'
      );
    });
  });
});
