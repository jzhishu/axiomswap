import { FACTORY_ABI, getContracts, PAIR_ABI, TokenInfo } from "@/contracts/contracts";
import { useMemo } from "react";
import { parseUnits } from "viem";
import { useChainId, useReadContract } from "wagmi";
import { usePriceImpact } from "./usePriceImpact";

interface UseSwapDetailProps {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: string | null;
    bestRoute: {
        path: `0x${string}`[];
        label: string;
        amountOut: bigint;
      } | null;
    slippage: string;
}

export function useSwapDetail({ tokenIn, tokenOut, slippage, amountIn, bestRoute }: UseSwapDetailProps) {

    const amountOutMin = useMemo(() => {
		if (!bestRoute) return null;
		const slippageBps = Math.round(Number(slippage) * 100);
		return bestRoute.amountOut * BigInt(10000 - slippageBps) / 10000n;
	}, [slippage, bestRoute]);

    const priceImpact = usePriceImpact({ bestRoute, tokenIn, tokenOut, amountIn: amountIn ? parseUnits(amountIn, tokenIn.decimals) : undefined });

    return { amountOutMin, priceImpact }
}