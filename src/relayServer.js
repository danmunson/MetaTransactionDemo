import express from 'express';
import Web3 from 'web3';
import cors from 'cors';
import * as sigUtil from '@metamask/eth-sig-util';
import fs from 'fs';
import {fileURLToPath} from 'url';
import path from 'path';
import {ContractParams, RelayParams} from './shared/params.js';
import {getSignatureParameters, getTypedData} from './shared/maticHelpers.js';

const OPERATOR_PK = process.env.OperatorPrk;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wethAbi = JSON.parse(fs.readFileSync(path.resolve(__dirname, './shared/wethAbi.json')));

const {OPERATOR_ADDRESS, RECIPIENT_ADDRESS, TRANSFER_AMOUNT} = RelayParams;
const contractDetails = ContractParams.weth;
const {RPC_URL, domainConstants} = contractDetails;

const web3 = new Web3(RPC_URL);
const polyWeth = new web3.eth.Contract(wethAbi, domainConstants.verifyingContract);
const expectedFsig = polyWeth.methods.transfer(RECIPIENT_ADDRESS, TRANSFER_AMOUNT.toString()).encodeABI();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
const port = 3000;

async function sendTx(user, fsig, r, s, v) {
    const transaction = polyWeth.methods.executeMetaTransaction(user, fsig, r, s, v);
    const options = {
        to      : transaction._parent._address,
        data    : transaction.encodeABI(),
        gas     : await transaction.estimateGas({from: OPERATOR_ADDRESS}),
        gasPrice: 100 * (10 ** 9)
    };
    const signed  = await web3.eth.accounts.signTransaction(options, OPERATOR_PK);
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    return receipt;
}

async function sendMetaTx(signature, user, fsig) {
    const {r, s, v} = getSignatureParameters(signature);
    return await sendTx(user, fsig, r, s, v);
}

function verifyMetaTxSignature(typedData, signature, expectedFrom) {
    const signerAddress = sigUtil.recoverTypedSignature({
        data: typedData,
        signature: signature,
        version: sigUtil.SignTypedDataVersion.V3,
    });
    if (signerAddress.toLowerCase() === expectedFrom.toLowerCase()) return true;
    else {
        console.log(`signer ${signerAddress.toLowerCase()} does not match user ${expectedFrom.toLowerCase()}`);
        return false;
    }
}

// verify that typed data includes the expected values
async function validateInputValues(typedData) {
    // get user data
    const userAddress = typedData.message.from;
    const userBalance = await polyWeth.methods.balanceOf(userAddress).call();
    if (userBalance < TRANSFER_AMOUNT) {
        throwValidationError('insufficient funds', TRANSFER_AMOUNT, userBalance);
    }

    const userNonce = await polyWeth.methods.getNonce(userAddress).call();
    const expectedInput = getTypedData({
        ...contractDetails.domainConstants,
        nonce: parseInt(userNonce),
        from: userAddress,
        functionSignature: expectedFsig,
    });

    const expectedStr = JSON.stringify(expectedInput);
    const givenStr = JSON.stringify(typedData);

    if (expectedStr !== givenStr) {
        console.log('Validation error: expected input does not match given input');
        console.log('---- Expected Input ----');
        console.log(expectedStr);
        console.log('---- Given Input ----');
        console.log(givenStr);
        return false;
    }

    return true;
}

app.post('/metaTx', async (req, res) => {
    console.log(req.body);
    const {input, signature} = req.body;
    const {from, functionSignature} = input.message;

    const verifiedSignature = verifyMetaTxSignature(input, signature, from);
    if (!verifiedSignature) {
        throw new Error('Invalid signature');
    } else {
        const validInput = await validateInputValues(input);
        if (!validInput) {
            throw new Error('Invalid input values');
        }
    }

    const response = await sendMetaTx(signature, from, functionSignature);

    console.log(response);
    res.send('Success!')
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
});