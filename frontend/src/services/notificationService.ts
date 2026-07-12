import { supabase } from './supabaseClient';
import { Notification } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse } from '../types/api';

export const notificationService = {
  // Create a new notification alert
  async notify(userId: string, message: string, type: 'offer' | 'shipment' | 'escrow' | 'payment' | 'verification'): Promise<ServiceResponse<Notification>> {
    try {
      const newNotification = {
        user_id: userId,
        message,
        type,
        read: false
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to distribute notification: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Notification sent.', data as Notification);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected notification dispatch error: ${err.message}`, err.message);
    }
  },

  // Mark an alert as read
  async markAsRead(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        return makeErrorResponse(`Failed to mark read: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Notification read.', true);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected notification update error: ${err.message}`, err.message);
    }
  },

  // Retrieve notifications for a user
  async getNotifications(userId: string): Promise<ServiceResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return makeErrorResponse(`Failed to fetch alerts: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Notifications retrieved.', data as Notification[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching alerts: ${err.message}`, err.message);
    }
  },

  // Realtime subscription mapping for notifications table updates
  subscribeNotifications(userId: string, onUpdate: (payload: any) => void): () => void {
    const channel = supabase
      .channel(`notifications_realtime:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
export default notificationService;
