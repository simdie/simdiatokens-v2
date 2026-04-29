/**
 * Client-side E2E decryption using Web Crypto API.
 * Must match backend response_crypto.rs exactly:
 * - PBKDF2-HMAC-SHA256, salt="simdia-e2e-v1", iterations=100000, keyLen=32
 * - AES-256-GCM, nonce=12 bytes, tag=16 bytes (appended to ciphertext)
 * - Wire format: base64(nonce || ciphertext || tag)
 * - Encrypted fields are wrapped as: { "__encrypted": "base64..." }
 */

const E2E_SALT = new TextEncoder().encode("simdia-e2e-v1");
const PBKDF2_ITERATIONS = 100_000;
const KEY_LEN_BITS = 256;

/**
 * Derive an AES-GCM key from a passphrase using PBKDF2.
 */
export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: E2E_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LEN_BITS },
    false,
    ["decrypt"]
  );
}

/**
 * Decrypt a single base64-encoded ciphertext blob.
 * Returns null if decryption fails (wrong key, bad format, not encrypted).
 */
export async function decryptField(ciphertextB64: string, key: CryptoKey): Promise<string | null> {
  try {
    // base64 decode
    const blob = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));

    // Minimum: 12 nonce + 1 byte plaintext + 16 tag = 29 bytes
    if (blob.length < 29) return null;

    const nonce = blob.slice(0, 12);
    const ciphertext = blob.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Check if a value looks like an encrypted wrapper object.
 */
export function isEncryptedWrapper(value: unknown): value is { __encrypted: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "__encrypted" in value &&
    typeof (value as Record<string, unknown>).__encrypted === "string"
  );
}

/**
 * Recursively walk a JSON object/array and decrypt any __encrypted wrappers.
 * If no passphrase is provided, replaces __encrypted with a lock placeholder.
 */
export async function decryptObject<T>(
  obj: T,
  passphrase: string | null
): Promise<T> {
  if (!passphrase) {
    return replaceEncryptedWithPlaceholder(obj) as T;
  }

  const key = await deriveKey(passphrase);

  async function walk(value: unknown): Promise<unknown> {
    if (isEncryptedWrapper(value)) {
      const decrypted = await decryptField(value.__encrypted, key);
      return decrypted ?? "🔒 Encrypted — enter passphrase in Settings";
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map((v) => walk(v)));
    }

    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = await walk(v);
      }
      return result;
    }

    return value;
  }

  return walk(obj) as Promise<T>;
}

/**
 * Replace all __encrypted wrappers with a lock placeholder (no passphrase).
 */
function replaceEncryptedWithPlaceholder<T>(obj: T): T {
  function walk(value: unknown): unknown {
    if (isEncryptedWrapper(value)) {
      return "🔒 Encrypted — enter passphrase in Settings";
    }

    if (Array.isArray(value)) {
      return value.map((v) => walk(v));
    }

    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = walk(v);
      }
      return result;
    }

    return value;
  }

  return walk(obj) as T;
}
