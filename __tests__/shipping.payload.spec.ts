import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShippingCalculator } from '@/lib/hooks/useShippingCalculator';
import { BiteshipRatesResponseSchema } from '@/lib/types/shipping';
import { renderHook, act } from '@testing-library/react';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Shipping Payload Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('builds a complete payload with all required fields', async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        object: 'courier_pricing',
        message: 'Success to retrieve courier pricing',
        pricing: [
          {
            company: 'JNE',
            courier_name: 'JNE',
            courier_code: 'jne',
            courier_service_name: 'REG',
            courier_service_code: 'reg',
            currency: 'IDR',
            description: 'Regular Service',
            duration: '2-3 hari',
            shipment_duration_range: '2-3',
            shipment_duration_unit: 'days',
            service_type: 'standard',
            shipping_type: 'parcel',
            price: 15000,
            available_collection_method: [],
            available_for_cash_on_delivery: false,
            available_for_proof_of_delivery: false,
            available_for_instant_waybill_id: false,
            available_for_insurance: false,
            tax_lines: [],
            type: 'parcel',
          }
        ]
      })
    });

    const { result } = renderHook(() => useShippingCalculator());

    await act(async () => {
      await result.current.calculateShipping({
        originPostalCode: '12440',
        destinationPostalCode: '12240',
        couriers: 'anteraja,jne,sicepat',
        name: 'Biji Kopi STRAWBERRIJEN',
        description: 'Premium strawberry-infused coffee',
        price: 140000,
        quantity: 2,
        weightGrams: 220,
        length: 20,
        width: 15,
        height: 10,
      });
    });

    // Verify fetch was called with correct payload
    expect(mockFetch).toHaveBeenCalledWith('/api/shipping/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin_postal_code: 12440,
        destination_postal_code: 12240,
        couriers: 'anteraja,jne,sicepat',
        items: [
          {
            name: 'Biji Kopi STRAWBERRIJEN',
            description: 'Premium strawberry-infused coffee',
            value: 140000,
            length: 20,
            width: 15,
            height: 10,
            weight: 220,
            quantity: 2,
          },
        ],
      }),
    });

    // Verify response was processed correctly
    expect(result.current.shippingRates).toHaveLength(1);
    expect(result.current.shippingRates[0]).toEqual({
      carrier: 'JNE',
      code: 'jne-reg',
      service: 'REG',
      eta: '2-3 hari',
      price: 15000,
      raw: expect.objectContaining({
        courier_name: 'JNE',
        courier_code: 'jne',
        price: 15000,
      }),
    });
    // Location is no longer available in Biteship response
    expect(result.current.location).toBeNull();
  });

  it('accepts string postal codes and converts them to numbers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, pricing: [] })
    });

    const { result } = renderHook(() => useShippingCalculator());

    await act(async () => {
      await result.current.calculateShipping({
        originPostalCode: '12440', // string
        destinationPostalCode: '12240', // string
        name: 'Test Product',
        price: 100000,
        quantity: 1,
        weightGrams: 150,
      });
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/shipping/rates', expect.objectContaining({
      body: expect.stringContaining('"origin_postal_code":12440'),
    }));
  });

  it('throws error for invalid postal codes', async () => {
    const { result } = renderHook(() => useShippingCalculator());

    await act(async () => {
      await expect(result.current.calculateShipping({
        originPostalCode: 'invalid',
        destinationPostalCode: '12240',
        name: 'Test Product',
        price: 100000,
        quantity: 1,
        weightGrams: 150,
      })).rejects.toThrow('originPostalCode must be a number-like value');
    });
  });

  it('throws error for missing required fields', async () => {
    const { result } = renderHook(() => useShippingCalculator());

    await act(async () => {
      await expect(result.current.calculateShipping({
        originPostalCode: '12440',
        destinationPostalCode: '12240',
        name: '', // empty name
        price: 100000,
        quantity: 1,
        weightGrams: 150,
      })).rejects.toThrow('name is required');
    });

    await act(async () => {
      await expect(result.current.calculateShipping({
        originPostalCode: '12440',
        destinationPostalCode: '12240',
        name: 'Test Product',
        price: 100000,
        quantity: 0, // invalid quantity
        weightGrams: 150,
      })).rejects.toThrow('quantity must be > 0');
    });

    await act(async () => {
      await expect(result.current.calculateShipping({
        originPostalCode: '12440',
        destinationPostalCode: '12240',
        name: 'Test Product',
        price: 100000,
        quantity: 1,
        weightGrams: 0, // invalid weight
      })).rejects.toThrow('weightGrams must be > 0');
    });
  });
});
