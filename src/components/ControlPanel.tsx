'use client';

interface ControlPanelProps {
  difficulty: number;
  setDifficulty: (difficulty: number) => void;
  isAutoMining: boolean;
  onAutoMine: () => void;
  onShowLedger: () => void;
  numBlocks: number;
}

export default function ControlPanel({
  difficulty,
  setDifficulty,
  isAutoMining,
  onAutoMine,
  onShowLedger,
  numBlocks
}: ControlPanelProps) {
  return (
    <div className="bg-white border-4 border-black p-6 mb-8">
      <h3 className="text-lg font-bold mb-4 text-black uppercase border-b-2 border-black pb-2">
        Controls
      </h3>

      <div className="space-y-4">
        {/* Difficulty Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="w-full px-4 py-3 border-2 border-black focus:outline-none text-black bg-white"
            disabled={isAutoMining}
          >
            <option value={1}>Easy (1 zero)</option>
            <option value={2}>Medium (2 zeros)</option>
            <option value={3}>Hard (3 zeros)</option>
            <option value={4}>Very Hard (4 zeros)</option>
          </select>
          <p className="text-xs text-gray-600 mt-2 border-l-2 border-gray-400 pl-2">
            Hash must start with {difficulty} zero{difficulty > 1 ? 's' : ''}
          </p>
        </div>

        {/* Auto Mine Button */}
        <div className="pt-4 border-t-2 border-gray-300">
          <button
            onClick={onAutoMine}
            className={`w-full px-8 py-4 font-bold text-sm uppercase border-2 ${
              isAutoMining
                ? 'bg-white text-black border-black hover:bg-gray-100'
                : 'bg-black text-white border-black hover:bg-gray-800'
            }`}
          >
            {isAutoMining ? 'Cancel Auto Mining' : `Auto Mine All ${numBlocks} Blocks`}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Automatically mines all {numBlocks} invalid blocks in sequence from top to bottom
          </p>
        </div>

        {/* Show Ledger Button */}
        <div className="pt-4 border-t-2 border-gray-300">
          <button
            onClick={onShowLedger}
            className="w-full px-8 py-4 font-bold text-sm uppercase border-2 bg-gray-800 text-white border-black hover:bg-gray-700"
          >
            Show Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
