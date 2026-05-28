import { FACTORY_ABI, getContracts, PAIR_ABI, TokenInfo } from "@/contracts/contracts";
import { useMemo } from "react";
import { parseUnits } from "viem";
import { useChainId, useReadContract } from "wagmi";

interface UseSwapDetailProps {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: string | null;
    amountOut: string | null;
    slippage: string;
}

export function useSwapDetail({ tokenIn, tokenOut, slippage, amountOut, amountIn }: UseSwapDetailProps) {

    const chainId = useChainId()
    const { FACTORY_ADDRESS } = getContracts(chainId)

    const amountOutMin = useMemo(() => {
		if (!amountOut) return null;
		const slippageBps = Math.round(Number(slippage) * 100);
		const amountOutRaw = parseUnits(amountOut, tokenOut.decimals);
		return amountOutRaw * BigInt(10000 - slippageBps) / 10000n;
	}, [amountOut, slippage, tokenOut.decimals]);

    // 拿 pair 地址
    const { data: pairAddress } = useReadContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getPair',
        args: [tokenIn.address, tokenOut.address],
        query: {
            enabled: !!tokenIn.address && !!tokenOut.address,
        }
    })

    // 拿 reserves
    const { data: reserves } = useReadContract({
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'getReserves',
        query: {
            enabled: !!pairAddress,
        }
    })

    const [reserve0, reserve1] = (reserves as [bigint, bigint, number] | undefined) ?? [0n, 0n, 0];

    const { data: token0 } = useReadContract({
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'token0',
        query: {
            enabled: !!pairAddress,
        }
    })

    const [reserveIn, reserveOut] =
        token0 && tokenIn.address.toLowerCase() === token0.toLowerCase()
            ? [reserve0, reserve1]
            : [reserve1, reserve0]

    // 第二步、三步：算价格冲击（需要所有数据都就绪且非 null）
    const priceImpact = useMemo(() => {
        if (!amountOut || !amountIn || !reserveIn || !reserveOut) return null;
        const amountOutRaw = parseUnits(amountOut, tokenOut.decimals);
        const amountInRaw = parseUnits(amountIn, tokenIn.decimals);
        const priceBefore = Number(reserveOut) / Number(reserveIn);
        const priceAfter = Number(reserveOut - amountOutRaw) / Number(reserveIn + amountInRaw);
        return ((priceBefore - priceAfter) / priceBefore) * 100;
    }, [amountOut, amountIn, reserveIn, reserveOut, tokenOut.decimals, tokenIn.decimals]);

    return { amountOutMin, priceImpact }
}