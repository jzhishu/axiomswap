import { ROUTER_ABI, ROUTER_ADDRESS, TokenInfo } from "@/contracts/contracts";
import { useMemo } from "react";
import { parseUnits } from "viem";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface UseSwapProps {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: string | null;
    amountOut: string | null;
    to: `0x${string}`;
}

export function useSwap({ tokenIn, tokenOut, amountIn, amountOut, to }: UseSwapProps) {

    const { mutate, data: txHash, isPending, error } = useWriteContract()

    const { isSuccess, isLoading: isSwapLoading } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    const swap = () => {
        if (!amountIn || !amountOut) return;
        const amountInRaw = parseUnits(amountIn, tokenIn.decimals);
        const amountOutRaw = parseUnits(amountOut, tokenOut.decimals);

        // 0.5% slippage
        const amountOutMin = amountOutRaw * 995n / 1000n;

        // 2 minutes revert
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 2);
        
        mutate({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [amountInRaw, amountOutMin, [tokenIn.address, tokenOut.address], to, deadline],
        })
    }

    return { swap, isPending, error, isSuccess, isSwapLoading };
}