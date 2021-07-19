import { MockProvider } from 'ethereum-waffle'
import { bigNumberify } from 'ethers/utils'
import { ethers } from 'ethers'

const config = {
  l2Url: process.env.L2_URL || 'http://127.0.0.1:8545',
  l1Url: process.env.L1_URL || 'http://127.0.0.1:9545',
  useL2: process.env.TARGET === 'OVM',
  privateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  otherPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
}

const getProvider = async () => {
  if (process.env.MODE === 'OVM') {
    const provider = new ethers.providers.JsonRpcProvider(config.l2Url)
    provider.getGasPrice = async () => bigNumberify(0)
    //@ts-ignore
    provider.getWallets = () => {
      return [
        new ethers.Wallet(config.privateKey).connect(provider),
        new ethers.Wallet(config.otherPrivateKey).connect(provider) 
      ]
    }
    return provider
  }

  const providerOpts: any = {
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999,
    allowUnlimitedContractSize: true
  }
  const provider: any = new MockProvider(providerOpts)
  return provider
}

export { getProvider }
