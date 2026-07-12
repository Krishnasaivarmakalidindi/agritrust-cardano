import { dbService } from './dbService';
import { Offer } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateOfferDTO } from '../types/api';

export const offerService = {
  // Submit a negotiation bid on a crop listing
  async createOffer(buyerId: string, dto: CreateOfferDTO): Promise<ServiceResponse<Offer>> {
    try {
      const newOffer: Offer = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        product_id: dto.product_id,
        buyer_id: buyerId,
        offer_price: dto.offer_price,
        quantity: dto.quantity,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const data = await dbService.createOffer(newOffer);
      return makeResponse(true, 'Offer submitted successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating offer: ${err.message}`, err.message);
    }
  },

  // Farmer counters the offer price
  async counterOffer(offerId: string, counterPrice: number): Promise<ServiceResponse<Offer>> {
    try {
      const data = await dbService.updateOffer(offerId, {
        status: 'countered',
        counter_price: counterPrice
      });
      if (!data) return makeErrorResponse('Offer not found for counter.');
      return makeResponse(true, 'Counter offer submitted to buyer.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected counter offer error: ${err.message}`, err.message);
    }
  },

  // Accept a bid
  async acceptOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const data = await dbService.updateOffer(offerId, { status: 'accepted' });
      if (!data) return makeErrorResponse('Offer not found.');
      return makeResponse(true, 'Offer accepted.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error accepting offer: ${err.message}`, err.message);
    }
  },

  // Decline a bid
  async rejectOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const data = await dbService.updateOffer(offerId, { status: 'declined' });
      if (!data) return makeErrorResponse('Offer not found.');
      return makeResponse(true, 'Offer declined.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected decline offer error: ${err.message}`, err.message);
    }
  },

  // Cancel a bid (Buyer)
  async cancelOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const data = await dbService.updateOffer(offerId, { status: 'declined' });
      if (!data) return makeErrorResponse('Offer not found.');
      return makeResponse(true, 'Offer cancelled.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected cancel offer error: ${err.message}`, err.message);
    }
  },

  // Retrieve incoming/outgoing offers matching the user profile
  async getOffers(userId: string): Promise<ServiceResponse<Offer[]>> {
    try {
      const data = await dbService.getOffers(userId);
      return makeResponse(true, 'Offers retrieved successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching offers: ${err.message}`, err.message);
    }
  },

  // Realtime subscription mapping
  subscribeOffers(userId: string, onUpdate: (payload: any) => void): () => void {
    // Return mock unsubscriber
    return () => {};
  }
};
export default offerService;
