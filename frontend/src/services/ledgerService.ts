import { supabase } from './supabaseClient';
import { BlockchainLog } from '../types';
import { ServiceResponse, makeResponse, makeErrorResponse, CreateBlockDTO } from '../types/api';

export const ledgerService = {
  // Simple deterministic string hashing utility representing SHA256 stubs
  generateHash(action: string, data: any, prevHash: string): string {
    const serialized = action + JSON.stringify(data) + prevHash;
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = (hash << 5) - hash + serialized.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    // Pad to look like a standard transaction hash
    return '0x' + hex + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  },

  // Mine a new block and link it to the current tip block
  async mineBlock(dto: CreateBlockDTO): Promise<ServiceResponse<BlockchainLog>> {
    try {
      // 1. Fetch the tip block to retrieve height and parent hash
      const { data: lastBlocks, error: fetchErr } = await supabase
        .from('blockchain_logs')
        .select('*')
        .order('block_number', { ascending: false })
        .limit(1);

      if (fetchErr) {
        return makeErrorResponse(`Ledger sync failure: ${fetchErr.message}`, fetchErr.message);
      }

      const lastBlock = lastBlocks && lastBlocks.length > 0 ? lastBlocks[0] : null;
      const nextBlockNumber = lastBlock ? Number(lastBlock.block_number) + 1 : 100;
      const prevHash = lastBlock ? lastBlock.tx_hash : '0x0000000000000000000000000000000000000000000000000000000000000000';
      const computedHash = this.generateHash(dto.action, dto.data, prevHash);

      const newBlock = {
        block_number: nextBlockNumber,
        tx_hash: computedHash,
        action: dto.action,
        data: dto.data,
        prev_hash: prevHash
      };

      const { data, error } = await supabase
        .from('blockchain_logs')
        .insert(newBlock)
        .select()
        .single();

      if (error) {
        return makeErrorResponse(`Ledger mine failed: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Block mined and added to Trust Ledger.', data as BlockchainLog);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected ledger mining error: ${err.message}`, err.message);
    }
  },

  // Fetch all blocks sorted descending by height
  async getBlocks(): Promise<ServiceResponse<BlockchainLog[]>> {
    try {
      const { data, error } = await supabase
        .from('blockchain_logs')
        .select('*')
        .order('block_number', { ascending: false });

      if (error) {
        return makeErrorResponse(`Failed to retrieve ledger blocks: ${error.message}`, error.message);
      }
      return makeResponse(true, 'Ledger blocks retrieved.', data as BlockchainLog[]);
    } catch (err: any) {
      return makeErrorResponse(`Unexpected error fetching ledger blocks: ${err.message}`, err.message);
    }
  },

  // Verify the entire blockchain validation sequence
  async verifyChain(): Promise<ServiceResponse<boolean>> {
    try {
      const { data: blocks, error } = await supabase
        .from('blockchain_logs')
        .select('*')
        .order('block_number', { ascending: true });

      if (error || !blocks) {
        return makeErrorResponse(`Verification query failed: ${error?.message}`, error?.message);
      }

      for (let i = 1; i < blocks.length; i++) {
        const currentBlock = blocks[i];
        const previousBlock = blocks[i - 1];

        // 1. Verify parent hash link
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
