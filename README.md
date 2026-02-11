# Blockchain Mining Demo

## Screenshots

![Blockchain Interface](public/images/image.png)

![Mining in Progress](public/images/image2.png)

## About

An interactive blockchain visualizer built with Next.js that shows how blockchain mining and validation works. Features a real-time mining simulation using SHA-256 hashing.

**Key Features:**
- 3-block blockchain with visual validation (green = valid, red = invalid)
- Interactive mining with adjustable difficulty (1-4 leading zeros)
- Real-time hash computation and nonce discovery
- Chain integrity validation
- Transaction ledger view
- Tampering demonstration

## Tech Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS
- SHA-256

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter data in any block's input field
2. Click "Mine" to find a valid nonce
3. Modify existing block data to see chain invalidation
4. Use "Auto Mine All 3 Blocks" for sequential mining
5. Click "Show Ledger" to view all transactions

## Project Structure

```
src/
├── app/              # Next.js pages
├── components/       # React components
├── lib/              # Utility functions
└── utils/            # Blockchain logic
```