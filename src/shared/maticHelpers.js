/*
Source: https://github.com/maticnetwork/pos-portal/blob/master/test/helpers/meta-tx.js
*/
export const getTypedData = ({ name, version, chainId, verifyingContract, nonce, from, functionSignature }) => {
    return {
      types: {
        EIP712Domain: [{
          name: 'name',
          type: 'string'
        }, {
          name: 'version',
          type: 'string'
        }, {
          name: 'verifyingContract',
          type: 'address'
        }, {
          name: 'salt',
          type: 'bytes32'
        }],
        MetaTransaction: [{
          name: 'nonce',
          type: 'uint256'
        }, {
          name: 'from',
          type: 'address'
        }, {
          name: 'functionSignature',
          type: 'bytes'
        }]
      },
      domain: {
        name,
        version,
        verifyingContract,
        salt: '0x' + (chainId.toString(16).padStart(64, '0'))
      },
      primaryType: 'MetaTransaction',
      message: {
        nonce,
        from,
        functionSignature
      }
    }
};

/*
Source: https://github.com/maticnetwork/pos-portal/blob/master/test/helpers/utils.js
*/
export const getSignatureParameters = (signature) => {
  const r = signature.slice(0, 66)
  const s = '0x'.concat(signature.slice(66, 130))
  const _v = '0x'.concat(signature.slice(130, 132))
  let v = parseInt(_v)
  if (![27, 28].includes(v)) v += 27
  return { r, s, v }
}