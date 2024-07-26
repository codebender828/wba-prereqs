import consola from "consola";
import { generateKeyPair } from "@solana/web3.js";

const logger = consola.withTag("keypair");

const keypair = await generateKeyPair();
logger.info("keypair secret key", keypair.privateKey);
logger.info("keypair address", keypair.publicKey);
