import { Node as BlockchainNode } from '@/types/blockchain';
import { doubleSHA256 } from '@/utils/hash';

/**
 * Syncs all nodes to the majority VALID blockchain state
 */
export async function syncToMajority(
  nodes: BlockchainNode[], 
  difficulty: number
): Promise<BlockchainNode[]> {
  const targetPrefix = '0'.repeat(difficulty);
  
  // Count occurrences of each VALID blockchain state
  const stateMap = new Map<string, { state: BlockchainNode['blocks'], count: number }>();
  
  for (const node of nodes) {
    // Check if this node's blockchain is valid
    const isValid = await isChainValid(node.blocks, difficulty, targetPrefix);
    
    if (isValid) {
      const stateKey = JSON.stringify(node.blocks);
      const existing = stateMap.get(stateKey);
      
      if (existing) {
        existing.count++;
      } else {
        stateMap.set(stateKey, { 
          state: node.blocks, 
          count: 1 
        });
      }
    }
  }
  
  // If no valid chains exist, return nodes unchanged
  if (stateMap.size === 0) {
    return nodes;
  }
  
  // Find the majority valid state
  let majorityBlocks = nodes[0].blocks;
  let maxCount = 0;
  
  stateMap.forEach(({ state, count }) => {
    if (count > maxCount) {
      maxCount = count;
      majorityBlocks = state;
    }
  });
  
  // Update all nodes to majority valid state (deep clone)
  return nodes.map(node => ({
    ...node,
    blocks: JSON.parse(JSON.stringify(majorityBlocks)),
  }));
}

/**
 * NEW: Syncs all nodes to the LONGEST valid blockchain
 */
export async function syncToLongestChain(
  nodes: BlockchainNode[],
  difficulty: number
): Promise<BlockchainNode[]> {
  const targetPrefix = '0'.repeat(difficulty);
  
  let longestValidChain: BlockchainNode['blocks'] = [];
  let maxLength = 0;
  
  // Find the longest valid chain among all nodes
  for (const node of nodes) {
    const isValid = await isChainValid(node.blocks, difficulty, targetPrefix);
    
    if (isValid && node.blocks.length > maxLength) {
      maxLength = node.blocks.length;
      longestValidChain = node.blocks;
    }
  }
  
  // If no valid chains exist, return nodes unchanged
  if (maxLength === 0) {
    return nodes;
  }
  
  // Update all nodes to the longest valid chain (deep clone)
  return nodes.map(node => ({
    ...node,
    blocks: JSON.parse(JSON.stringify(longestValidChain)),
  }));
}

/**
 * Validates an entire blockchain
 */
async function isChainValid(
  blocks: BlockchainNode['blocks'], 
  difficulty: number,
  targetPrefix: string
): Promise<boolean> {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Check if hash meets difficulty requirement
    if (!block.hash || !block.hash.startsWith(targetPrefix)) {
      return false;
    }
    
    // Verify hash is correct
    const previousHash = i > 0 ? blocks[i - 1].hash : '';
    const dataToHash = previousHash ? `${previousHash}${block.data}${block.nonce}` : `${block.data}${block.nonce}`;
    const computedHash = await doubleSHA256(dataToHash);
    
    if (computedHash !== block.hash) {
      return false;
    }
  }
  
  return true;
}

/**
 * Resolves conflicts by choosing the longest valid chain
 */
export async function resolveLongestChain(
  nodes: BlockchainNode[], 
  difficulty: number
): Promise<{ winnerIndex: number; validLength: number }> {
  let longestValidChain = 0;
  let winnerIndex = 0;
  
  // Find the node with the longest valid chain
  for (let i = 0; i < nodes.length; i++) {
    const validLength = await countValidBlocks(nodes[i].blocks, difficulty);
    
    if (validLength > longestValidChain) {
      longestValidChain = validLength;
      winnerIndex = i;
    }
  }
  
  return { winnerIndex, validLength: longestValidChain };
}

/**
 * Count how many blocks in a chain are valid (have correct hash with difficulty)
 */
async function countValidBlocks(
  blocks: BlockchainNode['blocks'], 
  difficulty: number
): Promise<number> {
  let validCount = 0;
  const targetPrefix = '0'.repeat(difficulty);
  
  for (const block of blocks) {
    if (block.hash && block.hash.startsWith(targetPrefix)) {
      validCount++;
    } else {
      // Stop counting at first invalid block
      break;
    }
  }
  
  return validCount;
}