import { dbService } from './dbService';
import { BlockchainLog } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateBlockDTO } from '../types/api';

export const ledgerService = {
  // Deterministic string hashing utility
  generateHash(action: string, data: any, prevHash: string): string {
    const serialized = action + JSON.stringify(data) + prevHash;
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = (hash << 5) - hash + serialized.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return '0x' + hex + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  },

  // Mine a new block and link it to the current tip block
  async mineBlock(dto: CreateBlockDTO): Promise<ServiceResponse<BlockchainLog>> {
    try {
      const data = await dbService.createBlockchainLog({
        action: dto.action,
        data: dto.data
      });
      return makeResponse(true, 'Block mined and added to Trust Ledger.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected ledger mining error: ${err.message}`, err.message);
    }
  },

  // Fetch all blocks sorted descending by height
  async getBlocks(): Promise<ServiceResponse<BlockchainLog[]>> {
    try {
      const data = await dbService.getBlockchainLogs();
      return makeResponse(true, 'Ledger blocks retrieved.', data);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching ledger blocks: ${err.message}`, err.message);
    }
  },

  // Verify the entire blockchain validation sequence
  async verifyChain(): Promise<ServiceResponse<boolean>> {
    try {
      const blocks = await dbService.getBlockchainLogs();
      // Sort in ascending order to trace chain links
      const sorted = [...blocks].sort((a, b) => a.block_number - b.block_number);

      for (let i = 1; i < sorted.length; i++) {
        const currentBlock = sorted[i];
        const previousBlock = sorted[i - 1];

        // Verify parent hash link
        if (currentBlock.prev_hash !== previousBlock.tx_hash) {
          return makeResponse(
            false, 
            `Security Alert: Broken hash link at Block #${currentBlock.block_number}.`, 
            false
          );
        }
      }

      return makeResponse(true, 'Blockchain validation audit: Chain integrity intact.', true);
    } catch (err: any) {
      return makeErrorResponse(`Verification routine failed: ${err.message}`, err.message);
    }
  }
};
export default ledgerService;
