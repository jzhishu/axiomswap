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
                className="inline-flex items-center h-7 px-2 text-sm font-medium rounded-[6px] bg-ink text-white hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
                { isPending ? "Connecting..." : "Connect Wallet" }
            </button>
        )
    }

    if(chainId !== sepolia.id) {
        return (
            <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                className="inline-flex items-center h-7 px-2 text-sm font-medium rounded-[6px] bg-error text-white hover:bg-error-deep transition-colors"
            >
                Switch to Sepolia
            </button>
        )
    }

    return (
        <button
            disabled={isBalanceLoading}
            onClick={() => disconnect()}
            className="inline-flex items-center gap-1.5 h-7 px-2 text-sm font-medium rounded-[6px] bg-canvas text-ink border border-hairline hover:bg-canvas-soft transition-colors"
        >
            <span className="tabular-nums">
                {address?.slice(0, 6) + "..." + address?.slice(-4)}
            </span>
            <span className="text-mute tabular-nums">
                {isBalanceLoading ? "..." : `${Number(formatUnits(balance?.value ?? 0n, balance?.decimals ?? 0)).toFixed(4)} ${balance?.symbol}`}
            </span>
        </button>
    )
}
