import { Contract, ethers, Wallet } from 'ethers'
import { TransactionRequest, Web3Provider } from 'ethers/providers'
import { createFixtureLoader, deployContract, MockProvider } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/ERC20.json'
import UniswapV2Factory from '../../build/UniswapV2Factory.json'
import UniswapV2Pair from '../../build/UniswapV2Pair.json'
import { SimpleContractJSON } from 'ethereum-waffle/dist/esm/ContractJSON'

interface FactoryFixture {
  factory: Contract
}

const overrides = {
  gasLimit: process.env.MODE === 'OVM' ? undefined : 9999999
}

export async function _deployContract(wallet: Wallet, contractJson: SimpleContractJSON, args: any[], overrideOptions?: TransactionRequest | undefined): Promise<Contract> {
  if (process.env.MODE === 'OVM') {
    const contractFactory = new ethers.ContractFactory(
      contractJson.abi,
      contractJson.bytecode,
      wallet
    )
    const factory = await contractFactory.connect(wallet).deploy(
      ...args
    )
    await factory.deployTransaction.wait()
    return factory
  }
  else {
    const factory = await deployContract(wallet, contractJson, args, overrides)
    return factory
  }
}

export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
  const factory = await _deployContract(wallet, UniswapV2Factory, [wallet.address], overrides)
  return { factory }
}

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
  const { factory } = await factoryFixture(provider, [wallet])
  
  const tokenA = await _deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  const tokenB = await _deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  
  await factory.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(UniswapV2Pair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  return { factory, token0, token1, pair }
}

export async function createFixtures(provider: MockProvider, func, args: any[]) {
  if (process.env.MODE === 'OVM') {
    return await func(provider, args)
  }
  else {
    const loadFixture = createFixtureLoader(provider, args)
    const fixture = await loadFixture(func)
    return fixture
  }
}
