# Meta-Transaction Demo
*If you're already familiar with what meta-transactions are, and just want to see an implementation for WETH on Polygon's PoS, skip to* **Demo Overview**.

## A brief explainer of meta-transactions

Meta-transactions, as enshrined by the [EIP-712 standard](https://eips.ethereum.org/EIPS/eip-712), are key to making the most of L2 networks like Polygon's PoS network. These networks have native tokens, but many end-users won't have them, and therefore won't be able to pay for gas. That said, many users do have value on the network in the form of an ERC-20, like WETH. Taking payment in WETH is often the best solution for developers on L2.

Unfortunately, this adds some complexity. For starters, native transaction mechanisms with `msg.value` are unavailable. Instead, you need to use meta-transactions. A meta-transaction is essentially a piece of data that, along with the user's signature, allows you to spend your own gas submitting a transaction that is processed as if it was submitted by the user themself.

How does that work? First of all, meta-transactions themselves aren't native to EVM-compatible blockchains; instead, they are a protocol (see EIP-712) that must be implemented by the token-contract you want payment from. In that sense, there's nothing special about meta-transactions – in short, they're just a function that (1) takes a piece of data and a signature, (2) checks that the data was signed by a given user and if so (3) processes said data as if it came in a transaction submitted by said user. As such, if you want to use meta-transactions with a given token, first make sure that token has support for meta-transactions!

So, how would one go about using meta-transactions in their own smart contract? In general...
 1. Specify the user (who is sending you the tokens), the token address, the amount, and some additional metadata that is required to prevent cheating (e.g. re-use of a user's signature)
 2. Have the user sign the specified data
 3. Send the data and the signature to your backend
 4. Send the data and signature to your smart contract in a transaction from your own account.
 5. When your smart contract receives the data and signature, it will pass them along in call to the appropriate function of the token-contract.
 6. If that call succeeds, that means (generally, though it depends on the implementation) that the transaction succeeded, and the payment has gone through!

## Demo Overview
Meta-transactions are simple concepts with fairly verbose implementations; as such, I'm going to give a brief overview of the code, which should fill in the remaining details itself (by example). Note that this implementation is specific to WETH on Polygon's PoS, though the general concepts are broadly applicable to any EIP-712 implementation.

Steps 1-3 as described above must occur on the frontend, i.e. on the user's browser or device. These steps are implemented by `src/wethMetaTx.js`. Once we have the user's address, we generate input specific to the WETH contract with `getSignableInput()`. Then `signInput()` passes this data along to MetaMask, which the user then signs. Lastly, we send this input to our server, in `src/relayServer.js`.

Normally, your server would pass this data along to your smart contract which could then pass it along to the WETH contract. For the sake of simplicity, this demo just sends it directly to the WETH contract. First, we verify the signature is legitimate with `verifyMetaTxSignature()`, and then we validate that the data represents the transaction we expect with `validateInputValues()` (without this step, the user could simply specify a different transaction amount). Lastly, we encode a function call to `WETH.executeMetaTransaction` and send it in `sendTx()`.

I would highly recommend reading the EIP-712 spec if you haven't already, as it will fill in the reset of the details - a lot goes into making sure the user's signature cannot be re-used, either in the same contract (via the `nonce`), a different contract (via the `verifyingContract`) or an identical implementation on a different chain (via `chainId`).

I hope this helps, and good luck!