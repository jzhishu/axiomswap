import { createConfig, http } from "wagmi"
import { sepolia, hardhat } from "wagmi/chains"
import { cookieStorage, createStorage } from "wagmi"

// 自定义 Anvil 本地链（fork 主网）
const anvilLocal = {
    ...hardhat,
    id: 31337,
    name: "Anvil Local",
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:8545"],
        },
    },
} as const

export const wagmiConfig = createConfig({
    chains: [anvilLocal, sepolia],
    transports: {
        [anvilLocal.id]: http("http://127.0.0.1:8545"),
        [sepolia.id]: http(),
    },
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
})