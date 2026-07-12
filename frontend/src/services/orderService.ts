import { dbService } from './dbService';
import { Order } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateOrderDTO } from '../types/api';

export const orderService = {
  // Create a new order (called automatically upon accepted offer)
  async createOrder(dto: CreateOrderDTO): Promise<ServiceResponse<Order>> {
    try {
      const newOrder: Order = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        offer_id: dto.offer_id,
        buyer_id: dto.buyer_id,
        farmer_id: dto.farmer_id,
        product_id: dto.product_id,
        total_amount: dto.total_amount,
        status: 'negotiated',
        created_at: new Date().toISOString()
      };

      const data = await dbService.createOrder(newOrder);
      return makeResponse(true, 'Order created successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating order: ${err.message}`, err.message);
    }
  },

  // Update order status fields
  async updateOrder(id: string, updates: Partial<Order>): Promise<ServiceResponse<Order>> {
    try {
      const data = await dbService.updateOrder(id, updates);
      if (!data) return makeErrorResponse('Order not found for updates.');
      return makeResponse(true, 'Order status updated successfully.', data);
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
  },

  // Retrieve orders for a farmer or buyer user
  async getOrders(userId: string): Promise<ServiceResponse<Order[]>> {
    try {
      const data = await dbService.getOrders(userId);
      return makeResponse(true, 'Orders retrieved successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected order fetch error: ${err.message}`, err.message);
    }
  },

  // Retrieve a single order by UUID
  async getOrderById(id: string): Promise<ServiceResponse<Order>> {
    try {
      const data = await dbService.getOrder(id);
      if (!data) return makeErrorResponse('Order not found.');
      return makeResponse(true, 'Order retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected order retrieval error: ${err.message}`, err.message);
    }
  }
};
export default orderService;
