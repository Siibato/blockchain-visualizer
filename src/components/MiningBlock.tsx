'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SHA256 } from '@/utils/hash';

interface MiningBlockProps {
  blockNumber: number;
  difficulty: number;
  previousHash?: string;
  onHashChange?: (hash: string) => void;
}

export interface MiningBlockRef {
  mine: () => Promise<void>;
  cancel: () => void;
  isValid: () => boolean;
  isMining: () => boolean;
  getData: () => { data: string; timestamp: number; hash: string; nonce: string };
}

const MiningBlock = forwardRef<MiningBlockRef, MiningBlockProps>(({
  blockNumber,
  difficulty,
  previousHash,
  onHashChange
}, ref) => {
  const [data, setData] = useState('');
  const [nonce, setNonce] = useState('0');
  const [hash, setHash] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const shouldCancelRef = useRef(false);
  const timestampRef = useRef(Date.now());
  const startTimeRef = useRef(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousHashRef = useRef<string | undefined>(previousHash);
  const lastComputedHashRef = useRef<string>('');

  const requiredPrefix = '0'.repeat(difficulty);

  useEffect(() => {
    previousHashRef.current = previousHash;
  }, [previousHash]);

  useEffect(() => {
    const computeHash = async () => {
      const dataToHash = previousHashRef.current
        ? `${blockNumber}${previousHashRef.current}${timestampRef.current}${data}${nonce}`
        : `${blockNumber}${timestampRef.current}${data}${nonce}`;
      const newHash = await SHA256(dataToHash);

      // Only update if hash actually changed to prevent infinite loops
      if (newHash !== lastComputedHashRef.current) {
        lastComputedHashRef.current = newHash;
        setHash(newHash);
        if (onHashChange) {
          onHashChange(newHash);
        }
      }
    };

    computeHash();
  }, [data, nonce, blockNumber, onHashChange]);

  const isValidHash = hash.startsWith(requiredPrefix);

  const mine = async () => {
    shouldCancelRef.current = false;
    setIsMining(true);
    setAttempts(0);
    setElapsedTime(0);

    startTimeRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 10);

    let currentNonce = 0;
    let currentAttempts = 0;
    let found = false;

    while (!found && !shouldCancelRef.current) {
      currentAttempts++;
      const dataToHash = previousHashRef.current
        ? `${blockNumber}${previousHashRef.current}${timestampRef.current}${data}${currentNonce}`
        : `${blockNumber}${timestampRef.current}${data}${currentNonce}`;
      const newHash = await SHA256(dataToHash);

      // Only update UI every 10 attempts to reduce re-renders
      if (currentAttempts % 10 === 0) {
        setNonce(currentNonce.toString());
        setHash(newHash);
        setAttempts(currentAttempts);
        if (onHashChange) {
          onHashChange(newHash);
        }
      }

      if (newHash.startsWith(requiredPrefix)) {
        found = true;
        // Update final values
        setNonce(currentNonce.toString());
        setHash(newHash);
        setAttempts(currentAttempts);
        if (onHashChange) {
          onHashChange(newHash);
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setIsMining(false);
      } else {
        currentNonce++;

        // Yield to browser more frequently to prevent UI blocking
        if (currentAttempts % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    if (shouldCancelRef.current) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsMining(false);
    }
  };

  const handleMineClick = () => {
    if (isMining) {
      shouldCancelRef.current = true;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsMining(false);
    } else {
      mine();
    }
  };

  useImperativeHandle(ref, () => ({
    mine: async () => {
      if (!isMining) {
        await mine();
      }
    },
    cancel: () => {
      if (isMining) {
        shouldCancelRef.current = true;
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setIsMining(false);
      }
    },
    isValid: () => isValidHash,
    isMining: () => isMining,
    getData: () => ({ data, timestamp: timestampRef.current, hash, nonce }),
  }));

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const formatHash = (hash: string) => {
    if (!hash || hash.length <= 10) return hash;
    return `${hash.substring(0, 10)}...`;
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const timestamp = timestampRef.current;
  const displayTimestamp = isMounted ? formatTimestamp(timestamp) : 'Loading...';

  return (
    <div className={`bg-white border-4 transition-all ${
      isValidHash ? 'border-green-600' : 'border-red-600'
    }`}>
      <div className={`px-6 py-4 border-b-4 ${
        isValidHash ? 'bg-black text-white border-green-600' : 'bg-white text-black border-red-600'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Block {blockNumber}
          </h3>
          <span className="text-xs font-bold uppercase">
            {isValidHash ? '✓ Valid' : '✗ Invalid'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Timestamp
          </div>
          <div className="font-mono text-xs p-3 border-2 border-gray-400 bg-gray-100 suppressHydrationWarning">
            {displayTimestamp}
          </div>
        </div>

        {previousHash && (
          <div>
            <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Previous Block Hash
            </div>
            <div className="font-mono text-xs break-all p-3 border-2 border-gray-400 bg-gray-100">
              {previousHash}
            </div>
          </div>
        )}

        <div>
          <label htmlFor={`data-${blockNumber}`} className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Data
          </label>
          <input
            id={`data-${blockNumber}`}
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:border-gray-600 text-black disabled:bg-gray-200 disabled:text-gray-500"
            placeholder="Enter data (e.g., Alice pays Bob 10)"
            disabled={isMining}
          />
        </div>

        <div>
          <label htmlFor={`nonce-${blockNumber}`} className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Nonce
          </label>
          <input
            id={`nonce-${blockNumber}`}
            type="text"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:border-gray-600 text-black disabled:bg-gray-200 disabled:text-gray-500"
            disabled={isMining}
          />
        </div>

        <div>
          <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Hash
          </div>
          <div className={`font-mono text-xs break-all p-3 border-2 ${
            isValidHash
              ? 'bg-black text-white border-black'
              : 'bg-gray-100 border-gray-400 text-gray-600'
          }`}>
            {hash || 'No hash yet'}
          </div>
        </div>

        <div className="pt-4 border-t-2 border-gray-400">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleMineClick}
              className={`px-6 py-3 font-bold text-xs uppercase border-2 ${
                isMining
                  ? 'bg-white text-black border-black hover:bg-gray-100'
                  : 'bg-black text-white border-black hover:bg-gray-800'
              }`}
            >
              {isMining ? 'Cancel' : 'Mine'}
            </button>
            <div className="text-xs text-gray-600 flex items-center gap-4">
              <div>
                <span className="font-bold">Attempts:</span> <span className="font-mono">{attempts.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-bold">Time:</span> <span className="font-mono">{(elapsedTime / 1000).toFixed(2)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MiningBlock.displayName = 'MiningBlock';

export default MiningBlock;
