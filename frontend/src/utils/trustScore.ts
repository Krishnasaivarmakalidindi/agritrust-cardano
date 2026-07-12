import { Profile } from '../types';

/**
 * Calculates a profile's Trust Score dynamically using the formula:
 * - Verification Status (40%)
 * - Completed Trades (30%) (2% per completed trade, capped at 30%)
 * - Ratings & Dispute History (20%) (simulated baseline 20%)
 * - Cardano Wallet Connection (10%)
 */
export const calculateTrustScore = (profile: Partial<Profile>, hasWallet = true): number => {
  const verificationScore = profile.is_verified ? 40 : 0;
  
  const tradesCount = profile.trades_completed || 0;
  const tradesScore = Math.min(30, tradesCount * 2.5); // 12 completed trades = 30% full score

  const ratingsScore = 20; // Default rating score contribution

  const walletScore = hasWallet ? 10 : 0;

  return Math.min(100, Math.round(verificationScore + tradesScore + ratingsScore + walletScore));
};
