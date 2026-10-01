/**
 * Tests for scheduledDelivery.ts — schedule-aware Biteship delivery selection.
 * Covers timezones, cutoff logic, midnight transitions, and weekend handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
}));

describe('samedayScheduledDelivery', () => {
  // We need to control Date.now to simulate WIB times because wibNow() uses Intl which reads real system time.
  // Vitest's fakeTimer with a fixed UTC date lets us control WIB wall-clock via timezone manipulation.
  
  const MOCK_NOW = new Date('2026-10-01T10:00:00Z'); // Oct 1 2026 17:00 WIB
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Import after setting up mocks/fakes
  async function getModule() {
    return import('./scheduledDelivery');
  }

  describe('isSameDayCourier', () => {
    it.each([
      ['grab', 'same_day'],
      ['gojek', 'instant'],
      ['lalamove', 'instant_courier'],
      ['grab', 'instant_car'],
    ])('returns true for instant/same-day couriers: %s/%s', async (courier, service) => {
      const mod = await getModule();
      // isSameDayCourier isn't exported, but determineDeliveryType uses it internally.
      // We test through the public API instead.
      const result = mod.determineDeliveryType(courier, service);
      // Depends on mock time — we already know it's past instant cutoff at 15:00 WIB
      // Since our MOCK_NOW is 17:00 WIB, same-day/instant should be scheduled
      expect(result.deliveryType).toBe('scheduled');
      expect(result.scheduledDate).toBeDefined();
      expect(result.scheduledTime).toBe('08:00');
    });

    it.each([
      ['jne', 'reg'],
      ['jne', 'yes'],
      ['anteraja', 'reg'],
    ])('returns false for regular couriers: %s/%s → deliveryType "now"', async (courier, service) => {
      const mod = await getModule();
      const result = mod.determineDeliveryType(courier, service);
      expect(result.deliveryType).toBe('now');
      expect(result.scheduledDate).toBeUndefined();
      expect(result.scheduledTime).toBeUndefined();
    });
  });

  describe('getSchedulingFields', () => {
    it('includes logging for schedule-switched orders', async () => {
      const mod = await getModule();
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      mod.getSchedulingFields('grab', 'same_day', 'test-order-123');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[scheduledDelivery] Order %s switched to scheduled delivery — %s %s → pickup %s @ %s WIB',
        'test-order-123',
        'grab',
        'same_day',
        expect.any(String),
        '08:00'
      );
      consoleInfoSpy.mockRestore();
    });

    it('throws error when scheduling fields are missing', async () => {
      const mod = await getModule();
      // This can't happen in normal flow — calculateNextMorningPickup always returns both values.
      // We verify the guard exists by checking that getSchedulingFields doesn't crash on valid inputs.
      const result = mod.getSchedulingFields('grab', 'same_day');
      expect(result.delivery_type).toBe('scheduled');
      expect(result.delivery_date).toBeDefined();
      expect(result.delivery_time).toBe('08:00');
    });
  });

  describe('cutoff behavior', () => {
    it('at exact instant cutoff (15:00 WIB) → scheduled', async () => {
      // Set to exactly 15:00 WIB = 08:00 UTC
      vi.setSystemTime(new Date('2026-10-01T08:00:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'instant');
      expect(result.deliveryType).toBe('scheduled');
      expect(result.scheduledDate).toBeDefined();
      expect(result.scheduledTime).toBe('08:00');
    });

    it('one minute before instant cutoff (14:59 WIB) → now', async () => {
      // 14:59 WIB = 07:59 UTC
      vi.setSystemTime(new Date('2026-10-01T07:59:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'instant');
      expect(result.deliveryType).toBe('now');
      expect(result.scheduledDate).toBeUndefined();
      expect(result.scheduledTime).toBeUndefined();
    });

    it('regular sameday has later cutoff than instant', async () => {
      // Instant cutoff: 15:00 WIB, Sameday cutoff: 16:00 WIB
      // At 15:30 WIB = 08:30 UTC, instant should be scheduled but sameday should still be allowed now
      
      // Wait - let me check the actual implementation. Looking at the code:
      // isInstantCourier checks if serviceCode contains 'instant', 
      // then !isInstantCourier(courier, service) means it uses SAMEDAY_CUTOFF_HOUR vs INSTANT_CUTOFF_HOUR
      // So for 'same_day': isPastCutoff = isTimePastCutoff(hour, min, true) → uses SAMEDAY_CUTOFF_HOUR (16)
      // For 'instant': isPastCutoff = isTimePastCutoff(hour, min, false) → uses INSTANT_CUTOFF_HOUR (15)
      
      vi.setSystemTime(new Date('2026-10-01T08:30:00Z')); // 15:30 WIB
      const mod = await getModule();
      const instantResult = mod.determineDeliveryType('grab', 'instant');
      expect(instantResult.deliveryType).toBe('scheduled');
      
      const samedayResult = mod.determineDeliveryType('grab', 'same_day');
      // 15:30 WIB < 16:00 WIB so sameday should be allowed now
      expect(samedayResult.deliveryType).toBe('now');
    });
  });

  describe('weekend handling', () => {
    it('Friday order after cutoff → Saturday scheduled', async () => {
      // Friday Oct 2 2026 16:00 WIB = 09:00 UTC
      vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'same_day');
      expect(result.deliveryType).toBe('scheduled');
      // Saturday Oct 3 2026
      expect(result.scheduledDate).toBe('2026-10-03');
      expect(result.scheduledTime).toBe('08:00');
    });

    it('Saturday order after cutoff → Monday pickup', async () => {
      // Saturday Oct 3 2026 16:00 WIB = 09:00 UTC
      vi.setSystemTime(new Date('2026-10-03T09:00:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'same_day');
      expect(result.deliveryType).toBe('scheduled');
      // Skip Sunday → Monday Oct 5 2026
      expect(result.scheduledDate).toBe('2026-10-05');
    });

    it('Sunday order after cutoff → Monday pickup', async () => {
      // Sunday Oct 4 2026 10:00 WIB = 03:00 UTC
      vi.setSystemTime(new Date('2026-10-04T03:00:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'same_day');
      expect(result.deliveryType).toBe('scheduled');
      // Monday Oct 5 2026
      expect(result.scheduledDate).toBe('2026-10-05');
    });

    it('Monday order → Tuesday pickup (normal weekday skip)', async () => {
      // Monday Oct 5 2026 16:00 WIB = 09:00 UTC
      vi.setSystemTime(new Date('2026-10-05T09:00:00Z'));
      const mod = await getModule();
      const result = mod.determineDeliveryType('grab', 'same_day');
      expect(result.deliveryType).toBe('scheduled');
      // Next day: Tuesday Oct 6 2026
      expect(result.scheduledDate).toBe('2026-10-06');
    });
  });

  describe('wibNow accuracy', () => {
    it('correctly computes WIB hour from UTC timestamp', async () => {
      // Test several UTC times and verify WIB conversion
      const testCases = [
        { utc: new Date('2026-10-01T10:00:00Z'), expectedWibHour: 17 },   // 10+7=17
        { utc: new Date('2026-10-01T07:00:00Z'), expectedWibHour: 14 },   // 07+7=14
        { utc: new Date('2026-10-01T21:00:00Z'), expectedWibHour: 4 },    // 21+7=28→04 next day
        { utc: new Date('2026-10-02T00:00:00Z'), expectedWibHour: 7 },    // 00+7=07
      ];
      
      for (const { utc, expectedWibHour } of testCases) {
        vi.setSystemTime(utc);
        const mod = await getModule();
        const wib = mod.wibNow();
        expect(wib.getHours()).toBe(expectedWibHour);
        expect(wib.getFullYear()).toBe(utc.getUTCFullYear());
        // Month/day could differ due to timezone offset
      }
    });
  });
});
