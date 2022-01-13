export const RelayParams = {
    RECIPIENT_ADDRESS: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    OPERATOR_ADDRESS: '0x0123456789abcdef0123456789abcdefdeadbeef',
    TRANSFER_AMOUNT: 0.001 * (10 ** 18),
    RELAY_URL: 'http://localhost:3000/metaTx',
};

export const ContractParams = {
    weth: {
        RPC_URL: 'https://polygon-rpc.com/',
        domainConstants: {
            name: 'Wrapped Ether',
            chainId: 137,
            version: '1',
            verifyingContract: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        }
    },
    testmtx: {
        RPC_URL: 'https://rpc-mumbai.maticvigil.com',
        domainConstants: {
            name: 'Wrapped Ether',
            chainId: 80001,
            version: '1',
            verifyingContract: '0x804B211faD3cbd72ade8B1e4b8BF3b5946CeEf40',
        }
    }
};