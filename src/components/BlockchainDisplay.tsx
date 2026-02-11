'use client';

import MiningBlock, { MiningBlockRef } from './MiningBlock';
import { ArrowDown } from 'lucide-react';

interface BlockchainDisplayProps {
  numBlocks: number;
  difficulty: number;
  blockHashes: string[];
  onHashChange: (index: number, hash: string) => void;
  setBlockRef: (index: number) => (ref: MiningBlockRef | null) => void;
}

export default function BlockchainDisplay({
  numBlocks,
  difficulty,
  blockHashes,
  onHashChange,
  setBlockRef
}: BlockchainDisplayProps) {
  return (
    <div className="bg-white border-4 border-black p-6 mb-8">
      <h2 className="text-2xl font-bold text-black uppercase border-b-2 border-black pb-2 mb-6">
        Blockchain
      </h2>

      <div className="space-y-0 pb-4">
        {Array.from({ length: numBlocks }).map((_, index) => (
          <div key={index}>
            <MiningBlock
              ref={setBlockRef(index)}
              blockNumber={index}
              difficulty={difficulty}
              previousHash={index > 0 ? blockHashes[index - 1] : undefined}
              onHashChange={(hash) => onHashChange(index, hash)}
            />
            {index < numBlocks - 1 && (
              <div className="flex justify-center py-3 bg-white">
                <ArrowDown className="w-6 h-6 text-black" strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
