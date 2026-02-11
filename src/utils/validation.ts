import { Node, BlockData } from '@/types/blockchain';
import { doubleSHA256 } from './hash';

/**
 * Validates if a single block's hash is correct
 */
export async function isBlockHashValid(
  block: BlockData,
  previousHash?: string
): Promise<boolean> {
  const dataToHash = previousHash
    ? `${previousHash}${block.data}${block.nonce}`
    : `${block.data}${block.nonce}`;

  const calculatedHash = await doubleSHA256(dataToHash);
  return calculatedHash === block.hash;
}

/**
 * Validates if a block's hash meets the difficulty requirement
 */
export function isBlockHashDifficultySufficient(
  hash: string,
  difficulty: number
): boolean {
  const requiredPrefix = '0'.repeat(difficulty);
  return hash.startsWith(requiredPrefix);
}

/**
 * Validates an entire blockchain for a node
 * Returns true if all blocks have correct hashes and meet difficulty
 */
export async function validateNodeBlockchain(
  node: Node,
  difficulty: number
): Promise<boolean> {
  for (let i = 0; i < node.blocks.length; i++) {
    const block = node.blocks[i];
    const previousHash = i > 0 ? node.blocks[i - 1].hash : undefined;

    // Check if hash is correctly calculated
    const isHashCorrect = await isBlockHashValid(block, previousHash);
    if (!isHashCorrect) {
      return false;
    }

    // Check if hash meets difficulty requirement
    const meetsDifficulty = isBlockHashDifficultySufficient(block.hash, difficulty);
    if (!meetsDifficulty) {
      return false;
    }
  }

  return true;
}

/**
 * Validates all nodes and returns array of validity statuses
 */
export async function validateAllNodes(
  nodes: Node[],
  difficulty: number
): Promise<boolean[]> {
  const validationPromises = nodes.map(node =>
    validateNodeBlockchain(node, difficulty)
  );

  return Promise.all(validationPromises);
}
