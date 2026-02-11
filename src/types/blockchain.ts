// Core blockchain data types
export interface BlockData {
  data: string;
  nonce: string;
  hash: string;
}

export interface Node {
  id: number;
  name: string;
  blocks: BlockData[];
}

// React Flow custom node data
export interface BlockchainNodeData {
  name: string;
  isInConsensus: boolean;
  isValid: boolean;
  blockCount: number;
  nodeIndex: number;
}

// Consensus resolution result
export interface ConsensusResolution {
  nodeIndex: number;
  validChainLength: number;
  node: Node;
}
