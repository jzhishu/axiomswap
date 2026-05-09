"use client"

import { useBalance, useChainId, useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi"
import { injected } from "wagmi/connectors"
import { sepolia } from "viem/chains"
import { formatUnits } from "viem"

export const ConnectButton = () => {
    const { address, isConnected } = useConnection()
    const { mutate: connect, isPending } = useConnect()
    const chainId = useChainId()
    const { mutate: switchChain } = useSwitchChain()
    const { mutate: disconnect } = useDisconnect()

    const { data: balance, isLoading: isBalanceLoading } = useBalance({
        address, 
        chainId: sepolia.id,
        query: {
            enabled: !!address,
        }
    })

    if(!isConnected) {
        return (
            <button
                disabled={isPending}
                onClick={() => connect({ connector: injected() })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                { isPending ? "Connecting..." : "Connect Wallet" }
            </button>
        )
    }

    if(chainId !== sepolia.id) {
        return (
            <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
                Switch to Sepolia
            </button>
        )
    }

    return (
        <button
            disabled={isBalanceLoading}
            onClick={() => disconnect()}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
            {address?.slice(0, 6) + "..." + address?.slice(-4)} 
            {isBalanceLoading ? "Loading balance..." : formatUnits(balance?.value ?? 0n, balance?.decimals ?? 0)} {balance?.symbol}
        </button>
    )
}