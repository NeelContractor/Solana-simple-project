import { explorerURL, loadPublicKeysFromFile, printConsoleSeparator } from "@/lib/helpers";
import { connection, payer } from "../lib/vars";
import { PublicKey } from "@solana/web3.js";
import { Metaplex, bundlrStorage, keypairIdentity } from "@metaplex-foundation/js";

(async() => {
    console.log("payer's address:", payer.publicKey.toBase58());

    let localKeys = loadPublicKeysFromFile();

    if(!localKeys?.tokenMint)
        return console.warn("didn't found localkeys. Please run '3.createTokenWithMetadata.ts'.");

    const tokenMint: PublicKey = await localKeys.tokenMint;

    console.log("--- LocalKeys loaded ---");
    console.log("TokenMint address:", tokenMint.toBase58());
    console.log(explorerURL({ address: tokenMint.toBase58() }));

    const metadata = {
        name: "The Gradient Pearl",
        symbol: "SHIP",
        description: "The Gradient Pearl is a legendary Pirate ship that sails the Seven Seas. Captain Rajovenko leads with a drink can in his hand. ",
        image: "https://bafybeic75qqhfytc6xxoze2lo5af2lfhmo2kh4mhirelni2wota633dgqu.ipfs.nftstorage.link/",
    };

    const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
        bundlrStorage({
            address: "https://devnet.bundlr.network",
            providerUrl: "https://api.devnet.solana.com",
            timeout: 60000,
        })
    );

    console.log("Uploading metadata...");

    const { uri } = await metaplex.nfts().uploadMetadata(metadata);

    console.log("Metadata uploaded:", uri);

    printConsoleSeparator("NFT details");

    console.log("Creating NFT using Metaplex...");

    const { nft, response } = await metaplex.nfts().create({
        uri,
        name: metadata.name,
        symbol: metadata.symbol,
        sellerFeeBasisPoints: 500,
        isMutable: true,
    });

    console.log(nft);

    printConsoleSeparator("NFT created:");
    console.log(explorerURL({ txSignature: response.signature }))

    return;

    printConsoleSeparator("Find by Mint");

    const mintInfo = await metaplex.nfts().findByMint({
        mintAddress: tokenMint,
    });
    console.log(mintInfo);
})