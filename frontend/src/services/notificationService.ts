import { dbService } from './dbService';
import { Notification } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const notificationService = {
  // Create a new notification alert
  async notify(userId: string, message: string, type: 'offer' | 'shipment' | 'escrow' | 'payment' | 'verification'): Promise<ServiceResponse<Notification>> {
    try {
      const data = await dbService.createNotification({
        user_id: userId,
        message,
        type
      });
      return makeResponse(true, 'Notification sent.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected notification dispatch error: ${err.message}`, err.message);
    }
  },

  // Mark an alert as read
  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await dbService.markNotificationRead(id);
      return makeResponse(true, 'Notification read.', true);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected notification update error: ${err.message}`, err.message);
    }
  },

  // Retrieve notifications for a user
  async getNotifications(userId: string): Promise<ServiceResponse<Notification[]>> {
    try {
      const data = await dbService.getNotifications(userId);
      return makeResponse(true, 'Notifications retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching alerts: ${err.message}`, err.message);
    }
  },

  // Realtime subscription mapping
  subscribeNotifications(userId: string, onUpdate: (payload: any) => void): () => void {
    // Return mock unsubscriber
    return () => {};
  }
};
export default notificationService;
