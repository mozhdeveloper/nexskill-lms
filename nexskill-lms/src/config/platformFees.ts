/**
 * Platform fee configuration.
 * The platform takes a percentage cut from every course purchase and coaching session.
 * Coaches receive (1 - PLATFORM_FEE_PERCENT/100) of each transaction.
 */

export const PLATFORM_FEE_PERCENT = 20; // 20% platform cut

export function computeFees(amount: number) {
  const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const coachEarnings = Math.round((amount - platformFee) * 100) / 100;
  return { platformFee, coachEarnings };
}
