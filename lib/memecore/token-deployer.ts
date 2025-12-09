/**
 * Token Deployment Service for Memecore Network
 * Deploys MRC-20 tokens when wikis are created
 */

import { createWalletClient, createPublicClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getNetworkConfig, DEFAULT_NETWORK, DEFAULT_INITIAL_SUPPLY, type MemecoreNetwork } from './config'
import { sanitizeTokenSymbol, generateTokenDescription } from './utils'

// MRC-20 Token Contract ABI (only deployment constructor)
const MRC20_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
      { name: '_logoURI', type: 'string' },
      { name: '_description', type: 'string' },
      { name: 'initialOwner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
] as const

// MRC-20 Token Bytecode (you'll need to compile and paste this)
// Get this by running: cd contracts && npx hardhat compile
// Then copy from: contracts/artifacts/contracts/MRC20Token.sol/MRC20Token.json
const MRC20_BYTECODE = process.env.MRC20_BYTECODE || '0x'

// NativeBondingCurve Contract Bytecode (uses native M)
const NATIVE_BONDING_CURVE_BYTECODE = process.env.NATIVE_BONDING_CURVE_BYTECODE || '0x'

// NativeBondingCurve ABI (constructor) - NO M token address needed!
const NATIVE_BONDING_CURVE_ABI = [
  {
    inputs: [
      { name: '_wikiToken', type: 'address' },
      { name: '_basePrice', type: 'uint256' },
      { name: '_slope', type: 'uint256' },
      { name: 'initialOwner', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
] as const

// ERC20 Transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export interface TokenDeploymentParams {
  name: string
  symbol?: string // Auto-generated from name if not provided
  initialSupply?: number // Default: 1 billion
  logoURI: string
  description?: string // Auto-generated if not provided
  category?: string // Used in description generation
  network?: MemecoreNetwork
}

export interface TokenDeploymentResult {
  tokenAddress: string
  transactionHash: string
  tokenName: string
  tokenSymbol: string
  initialSupply: string
  network: MemecoreNetwork
  explorerUrl: string
  bondingCurveAddress?: string // Optional bonding curve address
  bondingCurveTxHash?: string // Optional bonding curve deployment tx
}

/**
 * Deploy MRC-20 token to Memecore network
 */
export async function deployMRC20Token(
  params: TokenDeploymentParams
): Promise<TokenDeploymentResult> {
  const network = params.network || DEFAULT_NETWORK
  const networkConfig = getNetworkConfig(network)

  // Validate private key
  const privateKey = process.env.MEMECORE_PRIVATE_KEY
  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('MEMECORE_PRIVATE_KEY not configured in environment variables')
  }

  // Validate bytecode
  if (!MRC20_BYTECODE || MRC20_BYTECODE === '0x') {
    throw new Error(
      'MRC20_BYTECODE not configured. Please compile contracts and set the bytecode in environment variables.'
    )
  }

  // Prepare deployment parameters
  const tokenName = params.name
  const tokenSymbol = params.symbol || sanitizeTokenSymbol(params.name)
  const initialSupply = BigInt(params.initialSupply || DEFAULT_INITIAL_SUPPLY)
  const logoURI = params.logoURI
  const description = params.description || generateTokenDescription(params.name, params.category || 'General')

  // Create viem chain config for Memecore
  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: networkConfig.explorerUrl,
      },
    },
  })

  // Setup account and clients
  const account = privateKeyToAccount(privateKey as `0x${string}`)

  const walletClient = createWalletClient({
    account,
    chain: memecoreChain,
    transport: http(),
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  try {
    console.log(`Deploying MRC-20 token: ${tokenName} (${tokenSymbol})`)
    console.log(`Network: ${networkConfig.name}`)
    console.log(`Deployer: ${account.address}`)

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address })
    console.log(`Balance: ${balance.toString()} wei`)

    if (balance === 0n) {
      const faucetInfo = 'faucetUrl' in networkConfig ? ` from: ${networkConfig.faucetUrl}` : ''
      throw new Error(
        `Insufficient balance. Please fund your wallet with testnet M tokens${faucetInfo}`
      )
    }

    // Deploy contract
    const hash = await walletClient.deployContract({
      abi: MRC20_ABI,
      bytecode: MRC20_BYTECODE as `0x${string}`,
      args: [tokenName, tokenSymbol, initialSupply, logoURI, description, account.address],
    })

    console.log(`Transaction hash: ${hash}`)
    console.log('Waiting for confirmation...')

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status !== 'success') {
      throw new Error('Token deployment transaction failed')
    }

    const tokenAddress = receipt.contractAddress
    if (!tokenAddress) {
      throw new Error('Contract address not found in receipt')
    }

    console.log(`Token deployed at: ${tokenAddress}`)

    return {
      tokenAddress,
      transactionHash: hash,
      tokenName,
      tokenSymbol,
      initialSupply: initialSupply.toString(),
      network,
      explorerUrl: `${networkConfig.explorerUrl}address/${tokenAddress}`,
    }
  } catch (error) {
    console.error('Token deployment failed:', error)
    throw error
  }
}

/**
 * Deploy MRC-20 token WITH bonding curve (like pump.fun)
 * This enables instant trading without liquidity pools
 */
export async function deployTokenWithBondingCurve(
  params: TokenDeploymentParams
): Promise<TokenDeploymentResult> {
  const network = params.network || DEFAULT_NETWORK
  const networkConfig = getNetworkConfig(network)

  // Validate private key
  const privateKey = process.env.MEMECORE_PRIVATE_KEY
  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('MEMECORE_PRIVATE_KEY not configured in environment variables')
  }

  // Validate bytecodes
  if (!MRC20_BYTECODE || MRC20_BYTECODE === '0x') {
    throw new Error('MRC20_BYTECODE not configured')
  }
  if (!NATIVE_BONDING_CURVE_BYTECODE || NATIVE_BONDING_CURVE_BYTECODE === '0x') {
    throw new Error('NATIVE_BONDING_CURVE_BYTECODE not configured')
  }

  // Prepare deployment parameters
  const tokenName = params.name
  const tokenSymbol = params.symbol || sanitizeTokenSymbol(params.name)
  const initialSupply = BigInt(params.initialSupply || DEFAULT_INITIAL_SUPPLY)
  const logoURI = params.logoURI
  const description = params.description || generateTokenDescription(params.name, params.category || 'General')

  // Create viem chain config
  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: networkConfig.explorerUrl,
      },
    },
  })

  // Setup account and clients
  const account = privateKeyToAccount(privateKey as `0x${string}`)

  const walletClient = createWalletClient({
    account,
    chain: memecoreChain,
    transport: http(),
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  try {
    console.log(`Deploying token with bonding curve: ${tokenName} (${tokenSymbol})`)
    console.log(`Network: ${networkConfig.name}`)
    console.log(`Deployer: ${account.address}`)

    // Step 1: Deploy token
    console.log('\n1️⃣ Deploying MRC-20 token...')
    const tokenHash = await walletClient.deployContract({
      abi: MRC20_ABI,
      bytecode: MRC20_BYTECODE as `0x${string}`,
      args: [tokenName, tokenSymbol, initialSupply, logoURI, description, account.address],
    })

    console.log(`Token tx: ${tokenHash}`)
    const tokenReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenHash })

    if (tokenReceipt.status !== 'success') {
      throw new Error('Token deployment failed')
    }

    const tokenAddress = tokenReceipt.contractAddress
    if (!tokenAddress) {
      throw new Error('Token address not found')
    }

    console.log(`✅ Token deployed: ${tokenAddress}`)

    // Step 2: Deploy NATIVE bonding curve (uses native M token)
    console.log('\n2️⃣ Deploying native bonding curve (uses native M)...')

    // Bonding curve parameters
    const BASE_PRICE = BigInt('10000000000') // 0.00000001 M per token (very cheap start)
    const SLOPE = BigInt('1000000000') // Increase per token

    const curveHash = await walletClient.deployContract({
      abi: NATIVE_BONDING_CURVE_ABI,
      bytecode: NATIVE_BONDING_CURVE_BYTECODE as `0x${string}`,
      args: [tokenAddress, BASE_PRICE, SLOPE, account.address], // No M token address!
    })

    console.log(`Bonding curve tx: ${curveHash}`)
    const curveReceipt = await publicClient.waitForTransactionReceipt({ hash: curveHash })

    if (curveReceipt.status !== 'success') {
      throw new Error('Bonding curve deployment failed')
    }

    const bondingCurveAddress = curveReceipt.contractAddress
    if (!bondingCurveAddress) {
      throw new Error('Bonding curve address not found')
    }

    console.log(`✅ Bonding curve deployed: ${bondingCurveAddress}`)

    // Step 3: Transfer all tokens to bonding curve
    console.log('\n3️⃣ Transferring tokens to bonding curve...')

    // Get actual token balance (in wei) from contract
    // The contract has already converted initialSupply to wei, so we need to get the real balance
    const tokenBalance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    }) as bigint

    console.log(`Deployer balance: ${tokenBalance.toString()} wei`)

    const transferHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [bondingCurveAddress, tokenBalance], // Transfer actual balance, not initialSupply!
    })

    console.log(`Transfer tx: ${transferHash}`)
    await publicClient.waitForTransactionReceipt({ hash: transferHash })

    console.log(`✅ Tokens transferred to bonding curve`)
    console.log(`\n🎉 Trading is now enabled!`)

    return {
      tokenAddress,
      transactionHash: tokenHash,
      tokenName,
      tokenSymbol,
      initialSupply: initialSupply.toString(),
      network,
      explorerUrl: `${networkConfig.explorerUrl}address/${tokenAddress}`,
      bondingCurveAddress,
      bondingCurveTxHash: curveHash,
    }
  } catch (error) {
    console.error('Deployment failed:', error)
    throw error
  }
}

/**
 * Get token info from deployed contract
 */
export async function getTokenInfo(tokenAddress: string, network: MemecoreNetwork = DEFAULT_NETWORK) {
  const networkConfig = getNetworkConfig(network)

  const memecoreChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: {
      name: 'Memecore',
      symbol: networkConfig.symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
  })

  const publicClient = createPublicClient({
    chain: memecoreChain,
    transport: http(),
  })

  const TOKEN_READ_ABI = [
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
  ] as const

  const [name, symbol, totalSupply, decimals] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: TOKEN_READ_ABI,
      functionName: 'name',
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: TOKEN_READ_ABI,
      functionName: 'symbol',
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: TOKEN_READ_ABI,
      functionName: 'totalSupply',
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: TOKEN_READ_ABI,
      functionName: 'decimals',
    }),
  ])

  return {
    name,
    symbol,
    totalSupply: totalSupply.toString(),
    decimals,
    address: tokenAddress,
  }
}
