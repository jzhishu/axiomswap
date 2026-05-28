"use client"

import { useBalance, useChainId, useConnect, useConnection, useDisconnect, useSwitchChain } from "wagmi"
import { injected } from "wagmi/connectors"
import { formatUnits } from "viem"
import { wagmiConfig } from "@/config/wagmi" // 根据你的实际路径调整

export const ConnectButton = () => {
    const { address, isConnected } = useConnection()
    const { mutate: connect, isPending } = useConnect()
    const chainId = useChainId()
    const { mutate: switchChain } = useSwitchChain()
    const { mutate: disconnect } = useDisconnect()

    // 检查当前链是否在我们支持的链列表中
    const supportedChainIds = wagmiConfig.chains.map((c) => c.id)
    const isWrongNetwork = !supportedChainIds.includes(chainId)

    const { data: balance, isLoading: isBalanceLoading } = useBalance({
        address,
        query: {
            enabled: !!address && !isWrongNetwork,
        },
    })

    if (!isConnected) {
        return (
            <button
                disabled={isPending}
                onClick={() => connect({ connector: injected() })}
                className="inline-flex items-center h-7 px-2 text-sm font-medium rounded-[6px] bg-ink text-white hover:bg-ink/90 disabled:opacity-50 transition-colors"
            >
                {isPending ? "Connecting..." : "Connect Wallet"}
            </button>
        )
    }

    if (isWrongNetwork) {
        return (
            <button
                onClick={() => switchChain({ chainId: supportedChainIds[0] })}
                className="inline-flex items-center h-7 px-2 text-sm font-medium rounded-[6px] bg-error text-white hover:bg-error-deep transition-colors"
            >
                Wrong Network
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
                {isBalanceLoading
                    ? "..."
                    : `${Number(formatUnits(balance?.value ?? 0n, balance?.decimals ?? 0)).toFixed(4)} ${balance?.symbol}`}
            </span>
        </button>
    )
}