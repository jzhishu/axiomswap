import { useChainId, useReadContracts } from "wagmi";
import { getContracts, getTokenList, ROUTER_ABI } from "@/contracts/contracts";
import { useMemo } from "react";

export function useFindBestRoute(
    tokenIn: `0x${string}`,
    tokenOut: `0x${string}`,
    amountIn: bigint,
) {
    const chainId = useChainId();
    const { ROUTER_ADDRESS } = getContracts(chainId);
    
    // 路径计算
    const validCandidates = useMemo(() => {
        const tokens = getTokenList(chainId);
    
        const weth = tokens.find(token => token.symbol === 'WETH');
        const usdc = tokens.find(token => token.symbol === 'USDC');
        const candidates = [
            // 单跳
            { path: [tokenIn, tokenOut], label: 'Direct Swap' },
        ]

        // 添加多跳
        if(weth) {
            candidates.push({ path: [tokenIn, weth.address, tokenOut], label: 'Via WETH' });
        }
        if(usdc) {
            candidates.push({ path: [tokenIn, usdc.address, tokenOut], label: 'Via USDC' });
        }
        // 检查路径是否合法，避免重复路径
        return candidates.filter((c) => {
            const s = new Set(c.path);
            return s.size === c.path.length;
        });
    }, [chainId, tokenIn, tokenOut]);

    const {data: amounts, isLoading, error} = useReadContracts({
        contracts: validCandidates.map(c => ({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: 'getAmountsOut',
            args: [amountIn, c.path],
        })),
        query: {
            enabled: validCandidates.length > 0 && !!amountIn && amountIn > 0n,
        }
    })

    const sortedRoutes = useMemo(() => {
        if(!amounts || amounts.length === 0) return null;

        const valideRoutes = amounts
            .map((a, index) => {
                if(a.status !== 'success') return null;
                const amountOuts = a.result as bigint[] || [];
                return {
                    ...validCandidates[index],
                    amountOut: amountOuts[amountOuts.length - 1] ?? null,
                }
            })
            .filter((r) => r !== null);

        if(valideRoutes.length === 0) return null;
        
        // 按照amountOut降序
        valideRoutes.sort((a, b) => {
            if(a && b){
                return (b.amountOut > a.amountOut ? 1 : -1);
            }
            return 0;
        });

        return valideRoutes;
    }, [amounts, validCandidates])

    return {
        bestRoute: sortedRoutes?.[0] ?? null,
        sortedRoutes,
        isLoading,
        error,
    }
}