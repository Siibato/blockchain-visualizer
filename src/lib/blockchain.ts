import { doubleSHA256 } from '@/utils/hash';

export interface BlockType {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;
}

export class Block {
  index: number;
  timestamp: number;
  data: string;
  previousHash: string;
  nonce: number;
  hash: string;

  constructor(index: number, timestamp: number, data: string, previousHash: string = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = '';
  }

  async calculateHash(): Promise<string> {
    return await doubleSHA256(
      this.index.toString() +
      this.previousHash +
      this.timestamp.toString() +
      this.data +
      this.nonce.toString()
    );
  }

  async mineBlock(difficulty: number, onProgress?: (nonce: number) => void): Promise<number> {
    const target = '0'.repeat(difficulty);
    const startTime = Date.now();

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = await this.calculateHash();

      // Call progress callback every 1000 iterations
      if (onProgress && this.nonce % 1000 === 0) {
        onProgress(this.nonce);
      }
    }

    const endTime = Date.now();
    console.log(`Block mined: ${this.hash}`);

    return endTime - startTime; // Return mining time in ms
  }

  toJSON(): BlockType {
    return {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash
    };
  }
}

export class Blockchain {
  chain: Block[];
  difficulty: number;

  constructor(difficulty: number = 2) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
  }

  createGenesisBlock(): Block {
    const genesisBlock = new Block(0, Date.now(), 'Genesis Block', '0');
    // Genesis block starts with hash already calculated
    genesisBlock.hash = '0000000000000000000000000000000000000000000000000000000000000000';
    return genesisBlock;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(data: string, onProgress?: (nonce: number) => void): Promise<number> {
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      data,
      this.getLatestBlock().hash
    );

    const miningTime = await newBlock.mineBlock(this.difficulty, onProgress);
    this.chain.push(newBlock);

    return miningTime;
  }

  async isChainValid(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block's hash is valid
      const calculatedHash = await currentBlock.calculateHash();
      if (currentBlock.hash !== calculatedHash) {
        return false;
      }

      // Check if blocks are properly linked
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Check if hash meets difficulty requirement
      const target = '0'.repeat(this.difficulty);
      if (currentBlock.hash.substring(0, this.difficulty) !== target) {
        return false;
      }
    }
    return true;
  }

  setDifficulty(difficulty: number): void {
    this.difficulty = difficulty;
  }

  toJSON(): BlockType[] {
    return this.chain.map(block => block.toJSON());
  }
}
