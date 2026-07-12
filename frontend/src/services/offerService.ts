import { supabase } from './supabaseClient';
import { Offer } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateOfferDTO } from '../types/api';

export const offerService = {
  // Submit a negotiation bid on a crop listing
  async createOffer(buyerId: string, dto: CreateOfferDTO): Promise<ServiceResponse<Offer>> {
    try {
      const newOffer = {
        product_id: dto.product_id,
        buyer_id: buyerId,
        offer_price: dto.offer_price,
        quantity: dto.quantity,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('offers')
        .insert(newOffer)
        .select('*, product:products(*), buyer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to submit offer: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Offer submitted successfully.', data as Offer);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error creating offer: ${err.message}`, err.message);
    }
  },

  // Farmer counters the offer price
  async counterOffer(offerId: string, counterPrice: number): Promise<ServiceResponse<Offer>> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({
          status: 'countered',
          counter_price: counterPrice
        })
        .eq('id', offerId)
        .select('*, product:products(*), buyer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Counter offer failed: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Counter offer submitted to buyer.', data as Offer);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected counter offer error: ${err.message}`, err.message);
    }
  },

  // Accept a bid
  async acceptOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)
        .select('*, product:products(*), buyer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to accept offer: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Offer accepted.', data as Offer);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error accepting offer: ${err.message}`, err.message);
    }
  },

  // Decline a bid
  async rejectOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({ status: 'declined' })
        .eq('id', offerId)
        .select('*, product:products(*), buyer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to decline offer: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Offer declined.', data as Offer);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected decline offer error: ${err.message}`, err.message);
    }
  },

  // Cancel a bid (Buyer)
  async cancelOffer(offerId: string): Promise<ServiceResponse<Offer>> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({ status: 'cancelled' })
        .eq('id', offerId)
        .select('*, product:products(*), buyer:profiles(*)')
        .single();

      if (error) {
        return makeErrorResponse(`Failed to cancel offer: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Offer cancelled.', data as Offer);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected cancel offer error: ${err.message}`, err.message);
    }
  },

  // Retrieve incoming/outgoing offers matching the user profile
  async getOffers(userId: string): Promise<ServiceResponse<Offer[]>> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*, product:products(*, farmer:profiles(*)), buyer:profiles(*)')
        .or(`buyer_id.eq.${userId},product.farmer_id.eq.${userId}`);

      if (error) {
        return makeErrorResponse(`Failed to retrieve offers: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Offers retrieved successfully.', data as unknown as Offer[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching offers: ${err.message}`, err.message);
    }
  },

  // Realtime subscription mapping for the offer negotiations table changes
  subscribeOffers(userId: string, onUpdate: (payload: any) => void): () => void {
    const channel = supabase
      .channel(`offers_realtime:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers'
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
export default offerService;
