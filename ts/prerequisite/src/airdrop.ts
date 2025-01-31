import { handleError } from "../../shared/src/helpers/errors";
import __keypair from "./keypair.json";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  devnet,
  airdropFactory,
  lamports,
} from "@solana/web3.js";

const keypair = await createKeyPairSignerFromBytes(new Uint8Array(__keypair));

const LAMPORTS_PER_SOL = 10 ** 9;

const rpc = createSolanaRpc(devnet(`https://api.devnet.solana.com`));
const rpcSubscriptions = createSolanaRpcSubscriptions(
  devnet(`wss://api.devnet.solana.com`)
);
try {
  const balance =
    Number((await rpc.getBalance(keypair.address).send()).value) /
    LAMPORTS_PER_SOL;

  console.log("Balance", keypair.address, balance, "SOL");
  console.log("Requesting airdrop for address", keypair.address);
  const airdrop = airdropFactory({ rpc, rpcSubscriptions });

  const result = await airdrop({
    lamports: lamports(BigInt(5 * LAMPORTS_PER_SOL)),
    commitment: "confirmed",
    recipientAddress: keypair.address,
  });

  console.log("airdrop successful signature", result);
} catch (error) {
  handleError(error);
}
