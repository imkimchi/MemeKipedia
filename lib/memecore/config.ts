/**
 * Memecore Network Configuration
 */

export const MEMECORE_NETWORKS = {
  mainnet: {
    name: 'MemeCore Mainnet',
    chainId: 4352,
    rpcUrl: 'https://rpc.memecore.net/',
    wsUrl: 'wss://ws.memecore.net',
    explorerUrl: 'https://memecorescan.io/',
    symbol: 'M',
  },
  insectarium: {
    name: 'MemeCore Insectarium Testnet',
    chainId: 43522,
    rpcUrl: 'https://rpc.insectarium.memecore.net/',
    wsUrl: 'wss://ws.insectarium.memecore.net',
    explorerUrl: 'https://insectarium.blockscout.memecore.com/',
    faucetUrl: 'https://faucet.memecore.com/insectarium',
    symbol: 'M',
  },
  formicarium: {
    name: 'MemeCore Formicarium Testnet',
    chainId: 43521,
    rpcUrl: 'https://rpc.formicarium.memecore.net/',
    wsUrl: 'wss://ws.formicarium.memecore.net',
    explorerUrl: 'https://formicarium.memecorescan.io/',
    faucetUrl: 'https://faucet.memecore.com/formicarium',
    symbol: 'M',
  },
} as const

export type MemecoreNetwork = keyof typeof MEMECORE_NETWORKS

// Default network for deployment (use testnet by default)
export const DEFAULT_NETWORK: MemecoreNetwork =
  (process.env.MEMECORE_NETWORK as MemecoreNetwork) || 'insectarium'

// Default initial supply for new tokens (1 billion)
export const DEFAULT_INITIAL_SUPPLY = 1_000_000_000

export function getNetworkConfig(network: MemecoreNetwork = DEFAULT_NETWORK) {
  return MEMECORE_NETWORKS[network]
}

export function getExplorerUrl(network: MemecoreNetwork, address: string) {
  const config = getNetworkConfig(network)
  return `${config.explorerUrl}address/${address}`
}

export function getTxExplorerUrl(network: MemecoreNetwork, txHash: string) {
  const config = getNetworkConfig(network)
  return `${config.explorerUrl}tx/${txHash}`
}
