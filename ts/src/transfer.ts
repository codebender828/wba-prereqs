import { handleError } from "./errors";
import __keypair from "./keypair.json";
import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  getSignatureFromTransaction,
  pipe,
  prependTransactionMessageInstructions,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayer,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransaction,
  signTransactionMessageWithSigners,
} from "@solana/web3.js";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";
import { getAddMemoInstruction } from "@solana-program/memo";

const keypair = await createKeyPairSignerFromBytes(
  new Uint8Array(__keypair),
  true
);

const rpc = createSolanaRpc(
  devnet(`https://alecia-grud54-fast-devnet.helius-rpc.com`)
);
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet(`wss://alecia-grud54-fast-devnet.helius-rpc.com`)
);

const LAMPORTS_PER_SOL = 10 ** 9;

const WBA_ADDRESS = address("GLNyfrHo68bybSkdgvDQ2y8MCVR8k6RMHwfD2HYnm1Ay");

try {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferMessage = "Transfer 1 SOL to WBA Wallet with @tp3";

  const transaction = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(keypair, m),
    // assign transaction feepayer
    (m) => setTransactionMessageFeePayer(keypair.address, m),
    // set transaction blockhash
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    // prepend compute budget instructions
    (m) =>
      prependTransactionMessageInstructions(
        [
          getSetComputeUnitLimitInstruction({ units: 200000 }),
          getSetComputeUnitPriceInstruction({ microLamports: 5000n }),
        ],
        m
      ),

    // append transfer instruction and memo with instruction
    (m) =>
      appendTransactionMessageInstructions(
        [
          getTransferSolInstruction({
            source: keypair,
            destination: WBA_ADDRESS,
            amount: 1 * LAMPORTS_PER_SOL,
          }),

          // Add Memo to instruction
          getAddMemoInstruction({
            memo: transferMessage,
          }),
        ],
        m
      )
  );

  const signedTransaction = await signTransactionMessageWithSigners(
    transaction
  );
  const signature = getSignatureFromTransaction(signedTransaction);
  console.log(
    "Sending transaction https://explorer.solana.com/tx/" +
      signature +
      "/?cluster=devnet"
  );
  const sendTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  const result = await sendTransaction(signedTransaction, {
    commitment: "confirmed",
  });

  console.log("Transaction successful signature", result);
} catch (error) {
  handleError(error);
}
