'use client';

import { Modal } from '@/components/ui/modal';

interface LedgerData {
  data: string;
  timestamp: number;
  hash: string;
  nonce: string;
}

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerData: LedgerData[];
}

export default function LedgerModal({ isOpen, onClose, ledgerData }: LedgerModalProps) {
  return (
    <Modal
      title="Transaction Ledger"
      description="Complete history of all blocks in the blockchain"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-h-[60vh] overflow-y-auto space-y-2">
        {ledgerData.map((blockData, index) => (
          <div key={index} className="border-2 border-gray-400 p-3 text-gray-900">
            <span className="font-bold">Block {index}:</span> {blockData.data || '(empty)'}
          </div>
        ))}
      </div>
    </Modal>
  );
}
