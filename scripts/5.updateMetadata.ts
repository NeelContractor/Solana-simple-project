import { PublicKey } from '@solana/web3.js';
import { payer, connection } from '../lib/vars';
import { buildTransaction, explorerURL, extractSignatureFromFailedTransaction, loadPublicKeysFromFile, printConsoleSeparator } from '@/lib/helpers';
import { PROGRAM_ID as METADATA_PROGRAM_ID, createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";

(async() => {
    console.log("payer's address:", payer.publicKey.toBase58());

    let localKeys = loadPublicKeysFromFile();

    if(!localKeys?.tokenMint)
     return console.warn("no local keys were found. Please run '3.createTokenWithMetadata.ts'.");

    const tokenMint: PublicKey = await localKeys.tokenMint;

    console.log("--- LocalKeys loaded ---");
    console.log("tokenMint address:", tokenMint.toBase58());
    console.log(explorerURL({ address: tokenMint.toBase58() }));

    const tokenConfig = {
        name: "New Super Sweet Token",
        symbol: "nSST",
        uri: "https://thisisnot.arealurl/new.json",
    };

    const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
        METADATA_PROGRAM_ID,
    )[0];

    console.log("Metadata account:", metadataAccount.toBase58());

    const updateMetadataInstruction = await createUpdateMetadataAccountV2Instruction(
        {
            metadata: metadataAccount,
            updateAuthority: payer.publicKey,
        }, 
        {
            updateMetadataAccountArgsV2: {
                data: {
                    creators: null,
                    name: tokenConfig.name,
                    symbol: tokenConfig.symbol,
                    uri: tokenConfig.uri,
                    sellerFeeBasisPoints: 0,
                    collection: null,
                    uses: null
                },
                isMutable: true,
                primarySaleHappened: null,
                updateAuthority: payer.publicKey,

            }
        }
    )

    const tx = await buildTransaction({
        connection,
        payer: payer.publicKey,
        signers: [payer],
        instructions: [updateMetadataInstruction],
    });

    printConsoleSeparator();

    try {
        console.log("transaction completed.");
        const sig = await connection.sendTransaction(tx);
        console.log(explorerURL({ txSignature: sig }));
    } catch (err) {
        console.error("transaction failed.");

        const failedSig = await extractSignatureFromFailedTransaction(connection , err);
        console.log("failed transaction:", explorerURL({ txSignature: failedSig }));

        throw err;
    }

})();