import { getContracts, ROUTER_ABI, TokenInfo } from "@/contracts/contracts";
import { parseUnits } from "viem";
import { useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface UseSwapProps {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: string | null;
    amountOut: string | null;
    to: `0x${string}`;
    // slippage: string;
    amountOutMin: bigint | null;
}

export function useSwap({ tokenIn, tokenOut, amountIn, amountOut, to, amountOutMin }: UseSwapProps) {
    const chainId = useChainId()
    const { ROUTER_ADDRESS } = getContracts(chainId)

    const { mutate, data: txHash, isPending, error } = useWriteContract()

    const {
        isSuccess,
        isLoading: isSwapLoading,
        isError: isReceiptError,
        error: receiptError,
    } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    const swap = () => {
        if (!amountIn || !amountOut || !amountOutMin) return;
        const amountInRaw = parseUnits(amountIn, tokenIn.decimals);

        // 2 minutes revert
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 2);
        
        mutate({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [amountInRaw, amountOutMin, [tokenIn.address, tokenOut.address], to, deadline],
        })
    }

    const combinedError = receiptError || error;

    return { swap, isPending, error: combinedError, isSuccess, isSwapLoading, isReceiptError, txHash };
}