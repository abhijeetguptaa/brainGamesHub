import { registerPlugin } from '@capacitor/core';

export interface AgeSignalResult {
  status: string;
  ageLower: number;
  ageUpper: number | null;
  // Legacy fields for backward compatibility
  ageSignal?: string; 
  isVerified?: boolean;
}

export interface AgeVerificationPlugin {
  getAgeSignal(): Promise<AgeSignalResult>;
}

const AgeVerification = registerPlugin<AgeVerificationPlugin>('AgeVerification');

/**
 * Checks the Google Play Age Signals API for the current user.
 * This is primarily used for compliance with Texas SB 2420.
 */
export const getPlayStoreAgeSignal = async (): Promise<AgeSignalResult | null> => {
  try {
    const result = await AgeVerification.getAgeSignal();
    return result;
  } catch (error) {
    console.error('Age Verification Error:', error);
    return null;
  }
};

/**
 * Determines if the user is a minor based on the age signal.
 * In Texas SB 2420, a minor is typically under 18.
 */
export const isKnownMinor = (result: AgeSignalResult): boolean => {
  // If the status is SUPERVISED, it's a child account
  if (result.status === 'SUPERVISED') return true;
  
  // If ageUpper is set and is less than 18, they are a minor
  if (result.ageUpper !== null && result.ageUpper < 18) return true;
  
  // Fallback: if ageLower is very low and status is UNKNOWN or DECLARED
  // we might want to be conservative, but usually ageUpper is the key.
  
  return false;
};
