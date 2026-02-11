export class MiningManager {
  private miningOperations: Map<string, {
    shouldCancel: boolean;
    isActive: boolean;
    promise: Promise<void> | null;
  }> = new Map();

  async startMining(
    nodeId: number,
    blockIndex: number,
    mineFunction: () => Promise<void>
  ): Promise<void> {
    const key = `${nodeId}-${blockIndex}`;
    
    if (this.miningOperations.get(key)?.isActive) {
      console.log(`Already mining ${key}`);
      return;
    }

    // ✅ RESET the shouldCancel flag when starting new mining
    this.miningOperations.set(key, {
      shouldCancel: false,
      isActive: true,
      promise: null
    });

    const operation = this.miningOperations.get(key)!;

    try {
      operation.promise = mineFunction();
      await operation.promise;
    } finally {
      operation.isActive = false;
      // ✅ Clean up immediately after completion
      if (!operation.shouldCancel) {
        this.miningOperations.delete(key);
      }
    }
  }

  cancelMining(nodeId: number, blockIndex: number): void {
    const key = `${nodeId}-${blockIndex}`;
    const operation = this.miningOperations.get(key);
    
    if (operation) {
      operation.shouldCancel = true;
      operation.isActive = false;
    }
  }

  // ✅ Add method to reset a specific block's state
  resetBlock(nodeId: number, blockIndex: number): void {
    const key = `${nodeId}-${blockIndex}`;
    this.miningOperations.delete(key);
  }

  // ✅ Add method to reset all blocks for a node
  resetNode(nodeId: number): void {
    Array.from(this.miningOperations.keys())
      .filter(key => key.startsWith(`${nodeId}-`))
      .forEach(key => this.miningOperations.delete(key));
  }

  cancelAllForNode(nodeId: number): void {
    Array.from(this.miningOperations.keys())
      .filter(key => key.startsWith(`${nodeId}-`))
      .forEach(key => {
        const operation = this.miningOperations.get(key);
        if (operation) {
          operation.shouldCancel = true;
          operation.isActive = false;
        }
      });
  }

  shouldCancel(nodeId: number, blockIndex: number): boolean {
    const key = `${nodeId}-${blockIndex}`;
    return this.miningOperations.get(key)?.shouldCancel ?? false;
  }

  isMining(nodeId: number, blockIndex: number): boolean {
    const key = `${nodeId}-${blockIndex}`;
    return this.miningOperations.get(key)?.isActive ?? false;
  }

  cleanup(): void {
    Array.from(this.miningOperations.entries())
      .filter(([_, op]) => !op.isActive)
      .forEach(([key]) => this.miningOperations.delete(key));
  }
}

export const miningManager = new MiningManager();