/**
 * 汇率查询hook，输入tokenIn和tokenOut，以及对应的amountIn，返回对应的amountOut
 */
import { useMemo } from "react";
import { ROUTER_ADDRESS, TokenInfo, ROUTER_ABI } from "../contracts/contracts"
import { formatUnits, parseUnits } from "viem";
import { useReadContract } from "wagmi";

interface UseQuoteProps {
    // 用户选择的币种
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    // 用户输入的实际值
    amountIn: string;
}

interface UseQuoteResult {
    // 预计输出值，格式化之后，用户可读
    amountOut: string | null;
    // 预计输出值，格式化之前，合约可读
    amountOutRaw: bigint | null;
    isLoading: boolean;
    error: string | null;
    isInsufficientLiquidity: boolean;
}

export function useQuote ({
    tokenIn,
    tokenOut,
    amountIn,
}: UseQuoteProps): UseQuoteResult{
    // 用户输入amountIn先转换为合约格式unit256
    const amountInRaw = useMemo(() => {
        if (!amountIn || Number(amountIn) <= 0) return null;
        try{
            return parseUnits(amountIn, tokenIn?.decimals);
        }catch {
            return null;
        }
    }, [amountIn, tokenIn?.decimals]);

    // 构建path数组，tokenIn.address -> tokenOut.address
    const path = useMemo(() => [tokenIn.address, tokenOut.address], [tokenIn.address, tokenOut.address]);

    // 通过useReadContract调用合约getAmountOut查询
    const { data: amounts, isLoading, error } = useReadContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: amountInRaw ? [amountInRaw, path] : undefined,
        // 限制： 有实际输入值再查询
        query: {
            enabled: !!amountInRaw && !!path && path.length > 0,
        }
    })

 
    const amountOutRaw = amounts?.[1] ?? null;
    const amountOut = useMemo(() => {
        if(!amountOutRaw || !tokenOut.decimals) return null;
        try{
            return formatUnits(amountOutRaw, tokenOut.decimals);
        }catch {
            return null;
        }
    }, [amountOutRaw, tokenOut.decimals]);

    const isInsufficientLiquidity = useMemo(() => {
        if (!error) return false;
        const msg = error.message.toLowerCase();
        return (
            msg.includes('insufficient_liquidity') ||
            msg.includes('insufficient liquidity') ||
            msg.includes('ds-math-sub-underflow') ||
            msg.includes('pair does not exist') ||
            // Uniswap V2 合约 revert 编码（0x08c379a0 + "INSUFFICIENT_LIQUIDITY"）
            (msg.includes('0x') && msg.includes('execution reverted'))
        );
    }, [error]);

    return { amountOut, amountOutRaw, isLoading, error: error?.message || null, isInsufficientLiquidity };
}