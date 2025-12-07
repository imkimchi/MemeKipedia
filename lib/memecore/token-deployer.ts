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
      throw new Error(
        `Insufficient balance. Please fund your wallet with testnet M tokens from: ${networkConfig.faucetUrl}`
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
