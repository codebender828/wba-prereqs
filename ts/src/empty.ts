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
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getComputeUnitEstimateForTransactionMessageFactory,
  prependTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  appendTransactionMessageInstruction,
} from "@solana/web3.js";
import { getTransferSolInstruction } from "@solana-program/system";
import { getSetComputeUnitLimitInstruction } from "@solana-program/compute-budget";
import consola from "consola";

const keypair = await createKeyPairSignerFromBytes(
  new Uint8Array(__keypair),
  true
);

const rpc = createSolanaRpc(devnet(`https://api.devnet.solana.com`));
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet(`wss://api.devnet.solana.com`)
);

const LAMPORTS_PER_SOL = 10 ** 9;

const WBA_ADDRESS = address("GLNyfrHo68bybSkdgvDQ2y8MCVR8k6RMHwfD2HYnm1Ay");

try {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionPayload = pipe(
    createTransactionMessage({ version: 0 }),
    // assign transaction feepayer
    (m) => setTransactionMessageFeePayerSigner(keypair, m),
    // set transaction blockhash
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),

    // append transfer instruction and memo with instruction
    (m) =>
      appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: keypair,
          destination: WBA_ADDRESS,
          amount: 0.1 * LAMPORTS_PER_SOL,
        }),
        m
      )
  );

  const getComputeUnitEstimateForTransactionMessage =
    getComputeUnitEstimateForTransactionMessageFactory({
      rpc,
    });
  // Request an estimate of the actual compute units this message will consume.
  const computeUnitsEstimate =
    await getComputeUnitEstimateForTransactionMessage(transactionPayload, {
      transactionMessage: transactionPayload,
    });

  const transactionMessageWithComputeUnitLimit =
    prependTransactionMessageInstruction(
      getSetComputeUnitLimitInstruction({
        units: computeUnitsEstimate * 1.2 /** Add 20% leeway */,
      }),
      transactionPayload
    );

  const transaction = compileTransaction(
    transactionMessageWithComputeUnitLimit
  );
  const transactionBase64 = getBase64EncodedWireTransaction(transaction);
  consola.info(`Transaction base64: ${transactionBase64}`);

  const { value: fee = 0 } = await rpc
    .getFeeforMessage(transactionBase64)
    .send();

  // consola.info(`Gas fee: ${fee} lamports`);

  // const signedTransaction = await signTransactionMessageWithSigners(
  //   transactionMessageWithComputeUnitLimit
  // );
  // const signature = getSignatureFromTransaction(signedTransaction);
  // console.log(
  //   "Sending transaction https://explorer.solana.com/tx/" +
  //     signature +
  //     "/?cluster=devnet"
  // );
  // const sendTransaction = sendAndConfirmTransactionFactory({
  //   rpc,
  //   rpcSubscriptions,
  // });
  // const result = await sendTransaction(signedTransaction, {
  //   commitment: "confirmed",
  // });

  // console.log("Transaction successful signature", result);
} catch (error) {
  handleError(error);
}
