import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Memecore Networks
    memecoreMainnet: {
      url: "https://rpc.memecore.net/",
      chainId: 4352,
      accounts: process.env.MEMECORE_PRIVATE_KEY ? [process.env.MEMECORE_PRIVATE_KEY] : [],
    },
    memecoreInsectarium: {
      url: "https://rpc.insectarium.memecore.net/",
      chainId: 43522,
      accounts: process.env.MEMECORE_PRIVATE_KEY ? [process.env.MEMECORE_PRIVATE_KEY] : [],
    },
    memecoreFormicarium: {
      url: "https://rpc.formicarium.memecore.net/",
      chainId: 43521,
      accounts: process.env.MEMECORE_PRIVATE_KEY ? [process.env.MEMECORE_PRIVATE_KEY] : [],
    },
  },
};

export default config;
