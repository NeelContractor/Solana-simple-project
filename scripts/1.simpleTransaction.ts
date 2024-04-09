import { payer, connection } from "../lib/vars";
import { explorerURL, printConsoleSeparator } from "../lib/helpers";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

(async () => {
    console.log("payer's address:", payer.publicKey.toBase58());

    const currentBalance = await connection.getBalance(payer.publicKey);
    console.log("Current balance of Payer (in lamports):", currentBalance);
    console.log("Current balance of payer (in SOL):", currentBalance / LAMPORTS_PER_SOL);

    if (currentBalance <= LAMPORTS_PER_SOL) {
        console.log("Not enough SOL requesting...");
        await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    }

    const keypair = Keypair.generate();

    console.log("New keypair generated:", keypair.publicKey.toBase58());

    const space = 0;

    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    console.log("Total lamports:", lamports);

    const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: keypair.publicKey,
        lamports,
        space,
        programId: SystemProgram.programId
    });

    let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: [createAccountIx]
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    tx.sign([payer, keypair]);

    console.log("Transaction after signing:", tx);

    const sig = await connection.sendTransaction(tx);

    printConsoleSeparator();

    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));
})();