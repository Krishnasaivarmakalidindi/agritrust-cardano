import { supabase } from './supabaseClient';
import { Contract } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateContractDTO } from '../types/api';

export const contractService = {
  // Register a Plutus validator smart contract record
  async createContract(dto: CreateContractDTO): Promise<ServiceResponse<Contract>> {
    try {
      const newContract = {
        order_id: dto.order_id,
        contract_address: dto.contract_address,
        status: 'active',
        tx_hash: dto.tx_hash
      };

      const { data, error } = await supabase
        .from('contracts')
        .insert(newContract)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to register contract: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Plutus contract registered successfully.', data as Contract);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error registering contract: ${err.message}`, err.message);
    }
  },

  // Activate contract validator
  async activateContract(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to activate contract: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Contract activated.', data as Contract);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected contract activation error: ${err.message}`, err.message);
    }
  },

  // Update status to funded
  async lockEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'funded' })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to lock escrow: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Escrow script state set to funded.', data as Contract);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected lock escrow error: ${err.message}`, err.message);
    }
  },

  // Update status to released
  async releaseEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'released' })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to release escrow: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Escrow script released successfully.', data as Contract);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected release escrow error: ${err.message}`, err.message);
    }
  },

  // Update status to refunded (Buyer cancel before shipping)
  async refundEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({ status: 'refunded' })
        .eq('id', contractId)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Failed to refund escrow: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Escrow script refunded successfully.', data as Contract);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected refund escrow error: ${err.message}`, err.message);
    }
  }
};
export default contractService;
