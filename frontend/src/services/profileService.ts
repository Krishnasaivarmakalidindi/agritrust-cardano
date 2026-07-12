import { dbService } from './dbService';
import { Profile } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const profileService = {
  // Create a profile record
  async createProfile(profile: Profile): Promise<ServiceResponse<Profile>> {
    try {
      const data = await dbService.createProfile(profile);
      return makeResponse(true, 'Profile created successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected profile creation error: ${err.message}`, err.message);
    }
  },

  // Update profile details
  async updateProfile(id: string, updates: Partial<Profile>): Promise<ServiceResponse<Profile>> {
    try {
      const data = await dbService.updateProfile(id, updates);
      if (!data) return makeErrorResponse('Profile not found for updates');
      return makeResponse(true, 'Profile updated successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected profile update error: ${err.message}`, err.message);
    }
  },

  // Mark a farmer profile as verified
  async verifyFarmer(id: string): Promise<ServiceResponse<Profile>> {
    return this.updateProfile(id, { is_verified: true });
  },

  // Mark a buyer profile as verified
  async verifyBuyer(id: string): Promise<ServiceResponse<Profile>> {
    return this.updateProfile(id, { is_verified: true });
  },

  // Retrieve a profile by UUID
  async getProfileById(id: string): Promise<ServiceResponse<Profile>> {
    try {
      const data = await dbService.getProfile(id);
      if (!data) return makeErrorResponse('Profile not found.');
      return makeResponse(true, 'Profile retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching profile: ${err.message}`, err.message);
    }
  },

  // Calculate and retrieve profile trust score analytics
  async getTrustScore(id: string): Promise<ServiceResponse<number>> {
    try {
      const data = await dbService.getProfile(id);
      if (!data) return makeErrorResponse('Profile not found.');
      return makeResponse(true, 'Trust score retrieved.', Number(data.trust_score));
    } catch (err: any) {
      return makeErrorResponse(`Error fetching trust score: ${err.message}`, err.message);
    }
  }
};
export default profileService;
