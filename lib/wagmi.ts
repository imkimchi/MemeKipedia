import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'
import { defineChain } from 'viem'

// Define MemeCore Insectarium Testnet
const memecoreInsectarium = defineChain({
  id: 43522,
  name: 'MemeCore Insectarium Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'M',
    symbol: 'M',
  },
  rpcUrls: {
    default: { http: ['https://rpc.insectarium.memecore.net/'] },
    public: { http: ['https://rpc.insectarium.memecore.net/'] },
  },
  blockExplorers: {
    default: {
      name: 'MemeCore Explorer',
      url: 'https://insectarium.blockscout.memecore.com'
    },
  },
  testnet: true,
})
import {
  argentWallet,
  bitgetWallet,
  braveWallet,
  coinbaseWallet,
  coin98Wallet,
  enkryptWallet,
  foxWallet,
  frameWallet,
  frontierWallet,
  imTokenWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  mewWallet,
  okxWallet,
  omniWallet,
  oneInchWallet,
  phantomWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
  safepalWallet,
  tahoWallet,
  talismanWallet,
  tokenPocketWallet,
  trustWallet,
  uniswapWallet,
  walletConnectWallet,
  xdefiWallet,
  zerionWallet,
} from '@rainbow-me/rainbowkit/wallets'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        rainbowWallet,
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        trustWallet,
        ledgerWallet,
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        argentWallet,
        bitgetWallet,
        braveWallet,
        coin98Wallet,
        enkryptWallet,
        foxWallet,
        frameWallet,
        frontierWallet,
        imTokenWallet,
        mewWallet,
        okxWallet,
        omniWallet,
        oneInchWallet,
        phantomWallet,
        rabbyWallet,
        safeWallet,
        safepalWallet,
        tahoWallet,
        talismanWallet,
        tokenPocketWallet,
        uniswapWallet,
        xdefiWallet,
        zerionWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'Memekipedia',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  }
)

export const config = createConfig({
  connectors,
  chains: [memecoreInsectarium, mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [memecoreInsectarium.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
})
