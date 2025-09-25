import { describe, it, expect } from 'vitest';
import { BiteshipRatesResponseSchema } from '@/lib/types/shipping';

const sampleBiteshipResponse = {
  success: true,
  object: 'courier_pricing',
  message: 'Success to retrieve courier pricing',
  code: 200,
  origin: {
    contact_name: 'Agroastery',
    contact_phone: '08123456789',
    address: 'Jl. Test Origin',
    postal_code: 12440,
  },
  destination: {
    contact_name: 'Customer',
    contact_phone: '08987654321', 
    address: 'Jl. Test Destination',
    postal_code: 12240,
  },
  pricing: [
    {
      company: 'JNE',
      courier_name: 'JNE',
      courier_code: 'jne',
      courier_service_name: 'City to City (CTC)',
      courier_service_code: 'ctc',
      currency: 'IDR',
      description: 'Layanan pengiriman antar kota',
      duration: '2 - 3 days',
      shipment_duration_range: '2-3',
      shipment_duration_unit: 'days',
      service_type: 'standard',
      shipping_type: 'parcel',
      price: 9000,
      available_collection_method: ['pickup'],
      available_for_cash_on_delivery: true,
      available_for_proof_of_delivery: true,
      available_for_instant_waybill_id: false,
      available_for_insurance: true,
      tax_lines: [],
      type: 'parcel',
    },
    {
      company: 'SICEPAT',
      courier_name: 'SiCepat Ekspres',
      courier_code: 'sicepat',
      courier_service_name: 'REGULAR',
      courier_service_code: 'regular',
      currency: 'IDR',
      description: 'Layanan regular SiCepat',
      duration: '1 - 2 days',
      shipment_duration_range: '1-2',
      shipment_duration_unit: 'days',
      service_type: 'standard',
      shipping_type: 'parcel',
      price: 8500,
      available_collection_method: ['pickup'],
      available_for_cash_on_delivery: true,
      available_for_proof_of_delivery: true,
      available_for_instant_waybill_id: false,
      available_for_insurance: true,
      tax_lines: [],
      type: 'parcel',
    }
  ]
};

const malformedResponse = {
  success: true,
  pricing: [
    {
      // Missing required fields
      courier_name: 'JNE',
      // courier_code missing
      // courier_service_name missing
      // courier_service_code missing
      price: 'invalid_price', // wrong type
    }
  ]
};

describe('Biteship Response Schema', () => {
  it('parses valid Biteship response correctly', () => {
    const result = BiteshipRatesResponseSchema.safeParse(sampleBiteshipResponse);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(true);
      expect(result.data.object).toBe('courier_pricing');
      expect(result.data.pricing).toHaveLength(2);
      
      const jneRate = result.data.pricing[0];
      expect(jneRate.courier_code).toBe('jne');
      expect(jneRate.courier_name).toBe('JNE');
      expect(jneRate.courier_service_name).toBe('City to City (CTC)');
      expect(jneRate.courier_service_code).toBe('ctc');
      expect(jneRate.price).toBe(9000);
      expect(jneRate.duration).toBe('2 - 3 days');
      
      const sicepatRate = result.data.pricing[1];
      expect(sicepatRate.courier_code).toBe('sicepat');
      expect(sicepatRate.price).toBe(8500);
    }
  });

  it('handles minimal valid response', () => {
    const minimalResponse = {
      pricing: [
        {
          courier_name: 'JNE',
          courier_code: 'jne',
          courier_service_name: 'REG',
          courier_service_code: 'reg',
          price: 15000,
          currency: 'IDR',
        }
      ]
    };

    const result = BiteshipRatesResponseSchema.safeParse(minimalResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricing).toHaveLength(1);
      expect(result.data.pricing[0].courier_name).toBe('JNE');
    }
  });

  it('fails gracefully on malformed response', () => {
    const result = BiteshipRatesResponseSchema.safeParse(malformedResponse);
    
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten();
      expect(errors.fieldErrors.pricing).toBeDefined();
    }
  });

  it('handles empty pricing array', () => {
    const emptyResponse = {
      success: true,
      message: 'No couriers available',
      pricing: []
    };

    const result = BiteshipRatesResponseSchema.safeParse(emptyResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricing).toHaveLength(0);
    }
  });

  it('validates required pricing fields', () => {
    const invalidPricing = {
      pricing: [
        {
          // Missing courier_name
          courier_code: 'jne',
          courier_service_name: 'REG',
          courier_service_code: 'reg',
          price: 15000,
        }
      ]
    };

    const result = BiteshipRatesResponseSchema.safeParse(invalidPricing);
    expect(result.success).toBe(false);
  });
});
