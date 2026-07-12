import { supabase } from './supabaseClient';
import { Order } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateOrderDTO } from '../types/api';

export const orderService = {
  // Create a new order (called automatically upon accepted offer)
  async createOrder(dto: CreateOrderDTO): Promise<ServiceResponse<Order>> {
    try {
      const newOrder = {
        offer_id: dto.offer_id,
        buyer_id: dto.buyer_id,
        farmer_id: dto.farmer_id,
        product_id: dto.product_id,
        total_amount: dto.total_amount,
        status: 'negotiated'
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select('*, product:products(*), buyer:profiles(*), farmer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to initialize order: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Order created successfully.', data as Order);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating order: ${err.message}`, err.message);
    }
  },

  // Update order status fields
  async updateOrder(id: string, updates: Partial<Order>): Promise<ServiceResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select('*, product:products(*), buyer:profiles(*), farmer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to update order: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Order status updated successfully.', data as Order);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected order update error: ${err.message}`, err.message);
    }
  },

  // Farmer starts shipment
  async shipOrder(orderId: string): Promise<ServiceResponse<Order>> {
    return this.updateOrder(orderId, { status: 'shipment_started' });
  },

  // Buyer confirms delivery receipt
  async confirmDelivery(orderId: string): Promise<ServiceResponse<Order>> {
    return this.updateOrder(orderId, { status: 'buyer_confirmed' });
  },

  // Escrow completed and closed
  async completeOrder(orderId: string): Promise<ServiceResponse<Order>> {
    return this.updateOrder(orderId, { status: 'contract_closed' });
  }
};
export default orderService;
