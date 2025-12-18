// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  alfajores: {
    assignments: "0x1039Dbb7e9C6dE92E3510696daa95B5a74BCfB2D", // MotusAssignmentsV2 - supports user self-registration
    assignmentsV1: "0x34326F546Ede186fA74F1E1A39195b7A905a8c5E", // Original contract (kept for reference)
    certificates: "0xD3FDF200dCF80a67992f4fA20E02E0991374bc3E",
    evaluations: "0xDaD8E782F578478e9126baD44480e39c56BaA83b",
  },
  celo: {
    assignments: "",
    certificates: "",
    evaluations: "",
  },
  localhost: {
    assignments: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    certificates: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    evaluations: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  },
} as const;

// Network configuration
export const NETWORKS = {
  alfajores: {
    chainId: 44787,
    name: "Celo Alfajores Testnet",
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
  },
  celo: {
    chainId: 42220,
    name: "Celo Mainnet",
    rpcUrl: "https://forno.celo.org",
    blockExplorer: "https://celoscan.io",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18,
    },
  },
  localhost: {
    chainId: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: "http://localhost:8545",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
} as const;

export type NetworkName = keyof typeof CONTRACT_ADDRESSES;

// Get contract addresses for current environment
export function getContractAddresses(network: NetworkName = "alfajores") {
  return CONTRACT_ADDRESSES[network];
}

// Get network config
export function getNetworkConfig(network: NetworkName = "alfajores") {
  if (network in NETWORKS) {
    return NETWORKS[network as keyof typeof NETWORKS];
  }
  return NETWORKS.alfajores;
}
