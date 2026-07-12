import { dbService } from './dbService';
import { Contract } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateContractDTO } from '../types/api';

export const contractService = {
  // Register a Plutus validator smart contract record
  async createContract(dto: CreateContractDTO): Promise<ServiceResponse<Contract>> {
    try {
      const newContract: Contract = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        order_id: dto.order_id,
        contract_address: dto.contract_address,
        status: 'active',
        tx_hash: dto.tx_hash || `0x${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString()
      };

      const data = await dbService.createContract(newContract);
      return makeResponse(true, 'Plutus contract registered successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error registering contract: ${err.message}`, err.message);
    }
  },

  // Activate contract validator
  async activateContract(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const data = await dbService.updateContract(contractId, { status: 'active' });
      if (!data) return makeErrorResponse('Contract not found.');
      return makeResponse(true, 'Contract activated.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected contract activation error: ${err.message}`, err.message);
    }
  },

  // Update status to funded
  async lockEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const data = await dbService.updateContract(contractId, { status: 'funded' });
      if (!data) return makeErrorResponse('Contract not found.');
      return makeResponse(true, 'Escrow script state set to funded.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected lock escrow error: ${err.message}`, err.message);
    }
  },

  // Update status to released
  async releaseEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const data = await dbService.updateContract(contractId, { status: 'released' });
      if (!data) return makeErrorResponse('Contract not found.');
      return makeResponse(true, 'Escrow script released successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected release escrow error: ${err.message}`, err.message);
    }
  },

  // Update status to refunded (Buyer cancel before shipping)
  async refundEscrow(contractId: string): Promise<ServiceResponse<Contract>> {
    try {
      const data = await dbService.updateContract(contractId, { status: 'refunded' });
      if (!data) return makeErrorResponse('Contract not found.');
      return makeResponse(true, 'Escrow script refunded successfully.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected refund escrow error: ${err.message}`, err.message);
    }
  },

  // Retrieve Plutus contract by order ID
  async getContractByOrderId(orderId: string): Promise<ServiceResponse<Contract>> {
    try {
      const data = await dbService.getContractForOrder(orderId);
      if (!data) return makeErrorResponse('Contract not found.');
      return makeResponse(true, 'Contract retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected contract fetch error: ${err.message}`, err.message);
    }
  }
};
export default contractService;
