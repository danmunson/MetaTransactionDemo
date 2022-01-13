import * as Web3 from 'web3';
import wethAbi from './shared/wethAbi.json';
import {getTypedData} from './shared/maticHelpers';
import {ContractParams, RelayParams} from './shared/params';

const {RECIPIENT_ADDRESS, TRANSFER_AMOUNT, RELAY_URL} = RelayParams;
const {RPC_URL, domainConstants} = ContractParams.weth;

const web3 = new Web3(RPC_URL);
const polyWeth = new web3.eth.Contract(wethAbi, domainConstants.verifyingContract);

async function getNonce(userAddress) {
    return parseInt(
        await polyWeth.methods.getNonce(userAddress).call()
    );
}

function getFunctionSig(recipientAddress, amount) {
    return polyWeth.methods.transfer(recipientAddress, amount.toString()).encodeABI();
}

async function getUserAccount() {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) throw new Error('No accounts');
    return accounts[0];
}

async function getSignableInput(userAddress) {
    const from = userAddress;
    const functionSignature = getFunctionSig(RECIPIENT_ADDRESS, TRANSFER_AMOUNT);
    const nonce = await getNonce(userAddress);
    return getTypedData({...domainConstants, from, functionSignature, nonce});
}

async function signInput(from, input) {
    const method = 'eth_signTypedData_v3';
    const params = [from, JSON.stringify(input)];
    try {
        const result = await ethereum.request({method, params});
        return result;
    } catch(err) {
        alert('Unable to sign data, see console for error.');
        console.log(err);
        throw new Error('Could not sign data');
    }
}

async function sendMetaTx() {
    const from = await getUserAccount();
    const input = await getSignableInput(from);
    const signature = await signInput(from, input);
    const body = {input, signature};
    const response = await fetch(RELAY_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
    return response;
}

async function runMetaTx() {
    const response = await sendMetaTx();
    alert('Success');
    console.log(response);
}

window.getMessage = () => `Transfer ${TRANSFER_AMOUNT / (10 ** 18)} WETH to ${RECIPIENT_ADDRESS}`;
window.runMetaTx = runMetaTx;