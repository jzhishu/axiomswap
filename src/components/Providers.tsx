"use client"

import { WagmiProvider, State } from "wagmi"
import { wagmiConfig } from "../config/wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useState } from "react"

export function Providers({
    children,
    initialState,
}: {
    children: ReactNode
    initialState?: State
}) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <WagmiProvider config={wagmiConfig} initialState={initialState}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}