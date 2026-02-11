// utils/crypto.ts
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';

// Configure secp256k1 to use the hash functions from @noble/hashes
// In v2+, use 'hashes' object
secp256k1.hashes.sha256 = sha256;
secp256k1.hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
secp256k1.hashes.sha256Async = async (msg) => sha256(msg);
secp256k1.hashes.hmacSha256Async = async (key, msg) => hmac(sha256, key, msg);

/**
 * Double SHA-256 (for consistency with blockchain hashing)
 */
function doubleSHA256Bytes(data: Uint8Array): Uint8Array {
  const firstHash = sha256(data);
  const secondHash = sha256(firstHash);
  return secondHash;
}

/**
 * Double SHA-256 for strings
 */
async function doubleSHA256String(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBytes = doubleSHA256Bytes(data);
  return bytesToHex(hashBytes);
}

/**
 * Normalize any input to a valid 32-byte private key
 */
async function normalizePrivateKey(input: string): Promise<Uint8Array> {
  // If input is exactly 64 hex chars, try to use it directly
  if (/^[0-9a-fA-F]{64}$/.test(input)) {
    try {
      const bytes = hexToBytes(input);
      // Validate it's a valid private key using v2+ API
      if (secp256k1.utils.isValidSecretKey(bytes)) {
        return bytes;
      }
    } catch {
      // If invalid, fall through to hashing
    }
  }
  
  // Hash the input to get a valid 32-byte key
  const hash = await doubleSHA256String(input);
  return hexToBytes(hash);
}

/**
 * Generates a public key from a private key using secp256k1
 */
export async function generatePublicKey(privateKeyInput: string): Promise<string> {
  try {
    const privateKeyBytes = await normalizePrivateKey(privateKeyInput);
    
    // Generate the public key using secp256k1 (uncompressed = 65 bytes)
    const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
    
    return bytesToHex(publicKeyBytes);
  } catch (error) {
    console.error('Public key generation error:', error);
    throw new Error('Failed to generate public key');
  }
}

/**
 * Signs transaction data with a private key using ECDSA
 */
export async function signTransaction(
  transactionData: string,
  privateKeyInput: string
): Promise<string> {
  try {
    const privateKeyBytes = await normalizePrivateKey(privateKeyInput);
    
    // Hash the transaction data (this is what we actually sign)
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(transactionData);
    const messageHashBytes = doubleSHA256Bytes(dataBytes);
    
    // Sign the hash using secp256k1 ECDSA
    // Use signAsync which uses the hashes we configured
    const signature = await secp256k1.signAsync(messageHashBytes, privateKeyBytes, {
      prehash: false // We already hashed the message
    });
    
    // Return signature as hex string (64 bytes: 32-byte r + 32-byte s)
    return bytesToHex(signature);
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Verifies a signature using a public key
 */
export async function verifySignature(
  transactionData: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!signatureHex || !publicKeyHex || !transactionData) {
      return false;
    }
    
    // Convert hex strings to bytes
    const signatureBytes = hexToBytes(signatureHex);
    const publicKeyBytes = hexToBytes(publicKeyHex);
    
    // Hash the transaction data (same as when signing)
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(transactionData);
    const messageHashBytes = doubleSHA256Bytes(dataBytes);
    
    // Verify the signature using secp256k1
    const isValid = await secp256k1.verifyAsync(signatureBytes, messageHashBytes, publicKeyBytes, {
      prehash: false // We already hashed the message
    });
    
    return isValid;
  } catch (_) {
    return false;
  }
}

// Helper functions
function hexToBytes(hex: string): Uint8Array {
  // Remove any spaces or special characters
  hex = hex.replace(/[^0-9a-fA-F]/g, '');
  
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}