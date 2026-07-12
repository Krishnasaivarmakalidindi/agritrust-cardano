import { supabase } from './supabaseClient';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const storageService = {
  // Common helper for uploading to a specific bucket
  async uploadFile(bucketName: string, userId: string, file: File): Promise<ServiceResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        return makeErrorResponse(`Storage upload failed: ${error.message}`, error.message);
      }

      // Generate the access URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        return makeErrorResponse('Failed to resolve uploaded file path URL.');
      }

      return makeResponse(true, 'File uploaded successfully.', urlData.publicUrl);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected storage error: ${err.message}`, err.message);
    }
  },

  // Upload crop display image
  async uploadProductImage(userId: string, file: File): Promise<ServiceResponse<string>> {
    return this.uploadFile('product-images', userId, file);
  },

  // Upload user avatar image
  async uploadProfileImage(userId: string, file: File): Promise<ServiceResponse<string>> {
    return this.uploadFile('profile-images', userId, file);
  },

  // Upload private documents (e.g. land ownership certificates)
  async uploadVerificationDoc(userId: string, file: File): Promise<ServiceResponse<string>> {
    return this.uploadFile('verification-documents', userId, file);
  }
};
export default storageService;
