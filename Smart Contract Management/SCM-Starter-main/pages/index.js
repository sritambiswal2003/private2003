// DApp Configuration
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let abi = null;
let bankContract = null;
let isConnected = false;

// DOM Elements
const content = document.getElementById("content");
const connectBtn = document.getElementById("connect-btn");
const address = document.getElementById("account");
const accountName = document.getElementById("account-name");
const accountBalance = document.getElementById("balance");
const reciever = document.getElementById("reciever");
const amount = document.getElementById("amount");
const confirmTransferBtn = document.getElementById("confirm-transfer-btn");
const nameInput = document.getElementById("input-name");
const confirmNameButton = document.getElementById("confirm-name-btn");

// Event Listeners
confirmTransferBtn.addEventListener("click", transfer);
confirmNameButton.addEventListener("click", updateName);

// Initialize DApp
initDApp();

// DApp Initialization
function initDApp() {
  if (!isConnected) {
    hideContent();
    fetchABI();
    tryConnection();
  } else {
    displayError("Connect To MetaMask", true);
  }
}

// Try connecting to MetaMask
function tryConnection() {
  if (window.ethereum && window.ethereum.isMetaMask) {
    isConnected = true;
    connectBtn.addEventListener("click", connectWallet);
  } else {
    displayError("Please install MetaMask!", true);
  }
}

// Connect Wallet
async function connectWallet() {
  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    bankContract = getBankContract();
    updateContent(accounts[0]);
  } catch (error) {
    displayError("Could not connect to MetaMask", true, error);
  }
}

// Get Bank Contract
function getBankContract() {
  if (window.ethereum && window.ethereum.isMetaMask) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    return contract;
  }
}

// Update Content with Account Information
async function updateContent(account) {
  address.innerHTML = account;
  try {
    let balance = await bankContract.getBalance();
    let name = await bankContract.getAccountName();
    accountBalance.innerHTML = ethers.utils.formatEther(balance);
    accountName.innerHTML = name || "User";
    displayContent();
  } catch (error) {
    displayError("Cannot access contract, try later!", true, error);
  }
}

// Display Error Message
function displayError(message = null, show, error = null) {
  console.log(error || message);
  isConnected = false;
  content.innerHTML = show ? message : "Something went wrong, try again later!";
  displayContent();
}

// Display DApp Content
function displayContent() {
  content.classList.remove("hide");
  connectBtn.classList.add("disable");
  connectBtn.innerHTML = "Connected";
  connectBtn.disabled = true;
  if (window.ethereum) {
    window.ethereum.on("transactionHash", (hash) => {
      updateContent(address.innerText);
    });
    window.ethereum.on("accountsChanged", (accounts) => {
      window.location.reload();
    });
    window.ethereum.on("chainChanged", (chainId) => {
      window.location.reload();
    });
  }
}

// Hide DApp Content
function hideContent() {
  content.classList.add("hide");
  connectBtn.classList.remove("disable");
  connectBtn.innerHTML = "Connect Wallet";
  connectBtn.disabled = false;
}

// Fetch Contract ABI
function fetchABI() {
  fetch("http://localhost:3000/artifacts/contracts/Bank.sol/Bank.json")
    .then((response) => response.json())
    .then((data) => {
      abi = data.abi;
    })
    .catch((error) => {
      displayError("Cannot fetch ABI", false, error);
    });
}

// Transfer Funds
async function transfer() {
  let receiverAddress = reciever.value.trim();
  let amountValue = ethers.utils.parseEther(amount.value.trim());

  if (receiverAddress && amountValue) {
    try {
      const contract = getBankContract();
      const tx = await contract.transferFunds(receiverAddress, {
        value: amountValue,
      });
      console.log(tx);
      contract.on("Transfer", (value) => {
        updateContent(address.innerText);
        console.log("Tx successful with amount:", value);
      });
    } catch (error) {
      displayError("Cannot transfer", true, error);
    }
  } else {
    displayError("Please fill all fields", true);
  }
  hideModal();
}

// Update Account Name
async function updateName() {
  let newName = nameInput.value.trim();
  if (newName && newName.length) {
    try {
      const contract = getBankContract();
      await contract.setAccountName(newName);
      contract.on("NameUpdate", (value) => {
        updateContent(address.innerText);
      });
    } catch (error) {
      displayError(
        "New name is same as old name! Kindly Refresh",
        true,
        error
      );
    }
  } else {
    displayError("Please Enter a name", true);
  }
  hideModal();
}

// Hide Modal
function hideModal() {
  document.getElementById("closeTransfer").click();
  document.getElementById("closeName").click();
}
