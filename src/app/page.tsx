"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { MiningBlockRef } from "@/components/MiningBlock";
import ValidationIndicator from "@/components/ValidationIndicator";
import ControlPanel from "@/components/ControlPanel";
import BlockchainDisplay from "@/components/BlockchainDisplay";
import LedgerModal from "@/components/LedgerModal";

const NUM_BLOCKS = 3;

export default function Home() {
  const blockRefsMap = useRef<Map<number, MiningBlockRef>>(new Map());
  const shouldCancelRef = useRef(false);

  const [difficulty, setDifficulty] = useState(2);
  const [blockHashes, setBlockHashes] = useState<string[]>(Array(NUM_BLOCKS).fill(''));
  const [isAutoMining, setIsAutoMining] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [isChainValid, setIsChainValid] = useState(true);
  const [ledgerData, setLedgerData] = useState<Array<{
    data: string;
    timestamp: number;
    hash: string;
    nonce: string;
  }>>([]);

  const setBlockRef = useCallback((index: number) => (ref: MiningBlockRef | null) => {
    if (ref) {
      blockRefsMap.current.set(index, ref);
    } else {
      blockRefsMap.current.delete(index);
    }
  }, []);

  const handleHashChange = useCallback((index: number, hash: string) => {
    setBlockHashes(prev => {
      const newHashes = [...prev];
      newHashes[index] = hash;
      return newHashes;
    });
  }, []);

  // Validate chain whenever hashes change
  useEffect(() => {
    const validateChain = () => {
      let valid = true;
      for (let i = 0; i < NUM_BLOCKS; i++) {
        const blockRef = blockRefsMap.current.get(i);
        if (blockRef && !blockRef.isValid()) {
          valid = false;
          break;
        }
      }
      setIsChainValid(prev => {
        // Only update if validity actually changed to prevent unnecessary re-renders
        if (prev !== valid) {
          return valid;
        }
        return prev;
      });
    };
    validateChain();
  }, [blockHashes]);

  const handleAutoMineClick = () => {
    if (isAutoMining) {
      shouldCancelRef.current = true;
      for (let i = 0; i < NUM_BLOCKS; i++) {
        const blockRef = blockRefsMap.current.get(i);
        if (blockRef) {
          blockRef.cancel();
        }
      }
      setIsAutoMining(false);
    } else {
      handleAutoMine();
    }
  };

  const handleAutoMine = async () => {
    setIsAutoMining(true);
    shouldCancelRef.current = false;

    for (let i = 0; i < NUM_BLOCKS; i++) {
      if (shouldCancelRef.current) break;

      const blockRef = blockRefsMap.current.get(i);

      if (blockRef && !blockRef.isValid()) {
        if (i > 0) {
          const prevRef = blockRefsMap.current.get(i - 1);
          let waitAttempts = 0;
          const MAX_WAIT = 100;

          while (prevRef && !prevRef.isValid() && waitAttempts < MAX_WAIT && !shouldCancelRef.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitAttempts++;
          }

          if (waitAttempts >= MAX_WAIT) {
            console.warn(`Timeout waiting for Block ${i} predecessor to be valid`);
            break;
          }
        }

        if (shouldCancelRef.current) break;

        await blockRef.mine();

        if (shouldCancelRef.current) break;

        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsAutoMining(false);
  };

  const handleShowLedger = () => {
    const data = [];
    for (let i = 0; i < NUM_BLOCKS; i++) {
      const blockRef = blockRefsMap.current.get(i);
      if (blockRef) {
        data.push(blockRef.getData());
      }
    }
    setLedgerData(data);
    setShowLedger(true);
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-4 border-black p-6">
          <h1 className="text-4xl font-bold text-black mb-2 uppercase tracking-tight">
            Blockchain Mining Demo
          </h1>
          <p className="text-gray-600">
            Modify data in any block and observe how it invalidates subsequent blocks. Mine each block to restore chain integrity.
          </p>
        </div>

        <ValidationIndicator isValid={isChainValid} />

        <ControlPanel
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          isAutoMining={isAutoMining}
          onAutoMine={handleAutoMineClick}
          onShowLedger={handleShowLedger}
          numBlocks={NUM_BLOCKS}
        />

        <BlockchainDisplay
          numBlocks={NUM_BLOCKS}
          difficulty={difficulty}
          blockHashes={blockHashes}
          onHashChange={handleHashChange}
          setBlockRef={setBlockRef}
        />

        {/* Info Section */}
        <div className="bg-white border-4 border-black p-6">
          <h3 className="text-lg font-bold mb-4 text-black uppercase border-b-2 border-black pb-2">
            How It Works
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <span className="font-bold text-green-600">✓ Green Border:</span> Block is valid (hash meets difficulty requirement)
            </p>
            <p>
              <span className="font-bold text-red-600">✗ Red Border:</span> Block is invalid and needs to be mined
            </p>
            <p>
              Each block&apos;s hash becomes the &quot;Previous Block Hash&quot; for the next block, creating an immutable chain.
            </p>
            <p>
              Modifying data in any block breaks the chain - that block and all subsequent blocks become invalid.
            </p>
          </div>
        </div>

        <LedgerModal
          isOpen={showLedger}
          onClose={() => setShowLedger(false)}
          ledgerData={ledgerData}
        />
      </div>
    </div>
  );
}
