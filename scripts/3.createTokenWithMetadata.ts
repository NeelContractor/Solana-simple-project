import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { payer, connection, testWallet } from "../lib/vars";
import { buildTransaction, explorerURL, extractSignatureFromFailedTransaction, printConsoleSeparator, savePublicKeyToFile } from "@/lib/helpers";
import { MINT_SIZE, createInitializeMint2Instruction } from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";
import { PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

(async () => {
    console.log("payer's address:", payer.publicKey.toBase58());
    console.log("test wallet address:", testWallet.publicKey.toBase58());

    const mintKeypair = Keypair.generate();

    console.log("Mint address:", mintKeypair.publicKey.toBase58());

    const tokenConfig = {
        decimals: 2,
        name: "Seven Seas Gold",
        symbol: "GOLD",
        uri: "https://thisisnot.arealurl/info.json",
    }

    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: SystemProgram.programId,
    });

    const initializeMintInstruction = createInitializeMint2Instruction(
        mintKeypair.publicKey,
        tokenConfig.decimals,
        payer.publicKey,
        payer.publicKey,
    );

    const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
        METADATA_PROGRAM_ID,
    )[0];

    console.log("Metadata address:", metadataAccount.toBase58());

    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: metadataAccount,
            mint: mintKeypair.publicKey,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey,
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    creators: null,
                    name: tokenConfig.name,
                    symbol: tokenConfig.symbol,
                    uri: tokenConfig.uri,
                    sellerFeeBasisPoints: 0,
                    collection: null,
                    uses: null,
                },
                collectionDetails: null,
                isMutable: true,
            }
        }
    )

    const tx = await buildTransaction({
        connection,
        payer: payer.publicKey,
        signers: [payer, mintKeypair],
        instructions: [
            createMintAccountInstruction,
            initializeMintInstruction,
            createMetadataInstruction,
        ],
    });

    printConsoleSeparator();

    try {
        const sig = await connection.sendTransaction(tx);
        console.log("Transaction Completed.");
        console.log(explorerURL({ txSignature: sig }));

        savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
    } catch (err) {
        console.error("Failed to send transaction");
        console.log(tx);

        const failedSig = await extractSignatureFromFailedTransaction(connection, err);
        if (failedSig) console.log("transaction failed", explorerURL({ txSignature: failedSig }));

        throw err
    }
})();