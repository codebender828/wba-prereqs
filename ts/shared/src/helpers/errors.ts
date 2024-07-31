import {
  SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE,
  isSolanaError,
} from "@solana/errors";
import type { SolanaError } from "@solana/web3.js";

export function handleError(e: unknown) {
  if (
    isSolanaError(e, SOLANA_ERROR__TRANSACTION_ERROR__MISSING_SIGNATURE_FOR_FEE)
  ) {
    const error = e as SolanaError;
    console.error("Solana Error", error.message);
  }
  throw e;
}
