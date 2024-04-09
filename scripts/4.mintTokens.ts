import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { payer, connection } from '../lib/vars';
import { explorerURL, loadPublicKeysFromFile } from '@/lib/helpers';
import { PublicKey } from '@solana/web3.js';

(async() => {
    console.log("payer's address:", payer.publicKey.toBase58());

    let localKeys = loadPublicKeysFromFile();

    if(!localKeys?.tokenMint)
        return console.warn("no local keys found. please run '3.createTokenWithMetadata.ts'.");

    const tokenMint: PublicKey = await localKeys.tokenMint;

    console.log("--- LocalKeys loaded ---");
    console.log("tokenMint address:", tokenMint.toBase58());
    console.log(explorerURL({ address: tokenMint.toBase58() }));

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        tokenMint,
        payer.publicKey,
    ).then(ata => ata.address);

    console.log("token account address:", tokenAccount.toBase58());

    const amountOfTokenToMint = 1_000;

    console.log("minting tokens to the ata...")
    const mintSig = await mintTo(
        connection,
        payer,
        tokenMint,
        tokenAccount,
        payer,
        amountOfTokenToMint,
    );

    console.log(explorerURL({ txSignature: mintSig }));
})();