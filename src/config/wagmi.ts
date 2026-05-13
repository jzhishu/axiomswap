import { createConfig, http } from "wagmi"
import { sepolia } from "wagmi/chains"
import { cookieStorage, createStorage } from "wagmi"

export const wagmiConfig = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(),
    },
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
})