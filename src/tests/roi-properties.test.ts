import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import roiService from '../services/supabase/roi.service';

describe('ROIService Property-Based Testing', () => {
    describe('calculateProjectedReturns', () => {

        // Property 1: Principal Invariance
        // For any positive ROI and duration, the final amount must be >= principal
        it('final amount should be >= principal for positive ROI/duration', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: 0, max: 1000000 }), // principal
                    fc.double({ min: 0, max: 100 }),     // roiRate
                    fc.integer({ min: 1, max: 600 }),    // durationMonths (up to 50 years)
                    fc.constantFrom('monthly', 'quarterly', 'annually' as const),
                    (principal, roiRate, duration, freq) => {
                        const result = roiService.calculateProjectedReturns(principal, roiRate, duration, freq);
                        return result.finalAmount >= principal - 1e-9;
                    }
                )
            );
        });

        // Property 2: Component Consistency
        // totalReturn should equal finalAmount - principal
        it('should maintain component consistency (totalReturn = finalAmount - principal)', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: 0, max: 1000000 }),
                    fc.double({ min: 0, max: 100 }),
                    fc.integer({ min: 1, max: 600 }),
                    fc.constantFrom('monthly', 'quarterly', 'annually' as const),
                    (principal, roiRate, duration, freq) => {
                        const result = roiService.calculateProjectedReturns(principal, roiRate, duration, freq);
                        // Using a small epsilon for floating point comparisons
                        return Math.abs(result.totalReturn - (result.finalAmount - principal)) < 1e-9;
                    }
                )
            );
        });

        // Property 3: ROI Monotonicity
        // Increasing ROI should increase finalAmount (other factors constant)
        it('final amount should increase with higher ROI rate', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: 1, max: 1000000 }), // principal > 0
                    fc.double({ min: 0, max: 99 }),      // lowRate
                    fc.double({ min: 0.1, max: 1 }),     // increment
                    fc.integer({ min: 1, max: 120 }),    // duration 10 years
                    fc.constantFrom('monthly', 'quarterly', 'annually' as const),
                    (principal, lowRate, increment, duration, freq) => {
                        const highRate = lowRate + increment;
                        const lowRes = roiService.calculateProjectedReturns(principal, lowRate, duration, freq);
                        const highRes = roiService.calculateProjectedReturns(principal, highRate, duration, freq);
                        return highRes.finalAmount >= lowRes.finalAmount;
                    }
                )
            );
        });

        // Property 4: Duration Monotonicity
        // Increasing duration should increase finalAmount (other factors constant)
        it('final amount should increase with longer duration', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: 1, max: 1000000 }),
                    fc.double({ min: 1, max: 100 }),      // ROI > 0
                    fc.integer({ min: 1, max: 119 }),
                    fc.integer({ min: 1, max: 10 }),
                    fc.constantFrom('monthly', 'quarterly', 'annually' as const),
                    (principal, roiRate, lowDuration, increment, freq) => {
                        const highDuration = lowDuration + increment;
                        const lowRes = roiService.calculateProjectedReturns(principal, roiRate, lowDuration, freq);
                        const highRes = roiService.calculateProjectedReturns(principal, roiRate, highDuration, freq);

                        // We need to be careful with frequency vs duration. 
                        // If frequency is 'annually' and duration goes from 1 to 2, 
                        // compoundingPeriods might stay 0 if duration < 12.
                        // But finalAmount should never DECREASE.
                        return highRes.finalAmount >= lowRes.finalAmount;
                    }
                )
            );
        });

        // Property 5: Robustness to Malformed Inputs
        // The service should not crash or return NaN for common "bad" numbers
        it('should handle zero or very small inputs gracefully', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(0, 1e-10, -0), // principal
                    fc.constantFrom(0, 1e-10, -1), // roiRate (negative ROI test)
                    fc.constantFrom(0, 1, 12),     // duration
                    (principal, roiRate, duration) => {
                        const result = roiService.calculateProjectedReturns(principal, roiRate, duration, 'monthly');
                        return !isNaN(result.finalAmount) && isFinite(result.finalAmount);
                    }
                )
            );
        });
    });
});
