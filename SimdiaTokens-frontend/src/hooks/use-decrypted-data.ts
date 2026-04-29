"use client";

import { useState, useEffect, useRef } from "react";
import { decryptObject, isEncryptedWrapper } from "@/lib/crypto";

interface UseDecryptedDataResult<T> {
  data: T | null;
  loading: boolean;
  hasPassphrase: boolean;
  encryptedCount: number;
}

function countEncryptedFields(obj: unknown): number {
  let count = 0;

  function walk(value: unknown) {
    if (isEncryptedWrapper(value)) {
      count++;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value !== null && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  }

  walk(obj);
  return count;
}

/**
 * React hook that manages client-side decryption of API responses.
 * Reads passphrase from sessionStorage (key: "simdia_passphrase").
 * Recursively walks the data object and decrypts any { __encrypted: "..." } wrappers.
 * If no passphrase exists, replaces encrypted values with a lock placeholder.
 */
export function useDecryptedData<T>(encryptedData: T | null | undefined): UseDecryptedDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [encryptedCount, setEncryptedCount] = useState(0);

  const passphrase =
    typeof window !== "undefined" ? sessionStorage.getItem("simdia_passphrase") : null;

  const hasPassphrase = !!passphrase;
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    if (!encryptedData) {
      setData(null);
      setEncryptedCount(0);
      return;
    }

    const json = JSON.stringify(encryptedData);
    if (json === prevDataRef.current) return;
    prevDataRef.current = json;

    const count = countEncryptedFields(encryptedData);
    setEncryptedCount(count);

    if (count === 0) {
      // Nothing to decrypt
      setData(encryptedData);
      return;
    }

    setLoading(true);
    decryptObject(encryptedData, passphrase)
      .then((decrypted) => {
        setData(decrypted);
      })
      .catch(() => {
        // Fallback: show placeholders
        setData(encryptedData);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [encryptedData, passphrase]);

  return {
    data: data ?? (encryptedData as T | null),
    loading,
    hasPassphrase,
    encryptedCount,
  };
}
