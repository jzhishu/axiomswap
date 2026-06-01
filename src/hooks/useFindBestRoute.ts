import { useChainId, useReadContracts } from "wagmi";
import { getContracts, getTokenList, ROUTER_ABI } from "@/contracts/contracts";
import { useMemo } from "react";

interface UseFindBestRouteProps {
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountIn: bigint | null;
}

interface BestRoute {
    path: `0x${string}`[];
    label: string;
    amountOut: bigint;
}

interface SortedRoutes {
    bestRoute: BestRoute;
    sortedRoutes: BestRoute[];
    isLoading: boolean;
    error: string | null;
    isInsufficientLiquidity: boolean;
}

export function useFindBestRoute({ tokenIn, tokenOut, amountIn }: UseFindBestRouteProps): SortedRoutes {
    const chainId = useChainId();
    const { ROUTER_ADDRESS } = getContracts(chainId);
    const shouldQuote = amountIn !== null && amountIn > 0n;
    
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
            args: [amountIn ?? 0n, c.path],
        })),
        query: {
            enabled: validCandidates.length > 0 && shouldQuote,
        }
    })

    const sortedRoutes = useMemo(() => {
        if(!amounts || amounts.length === 0) return [];

        const validRoutes = amounts.reduce<BestRoute[]>((routes, quote, index) => {
            if(quote.status !== 'success') return routes;

            const amountOuts = quote.result as bigint[] || [];
            const amountOut = amountOuts[amountOuts.length - 1];
            if(!amountOut) return routes;

            routes.push({
                ...validCandidates[index],
                amountOut,
            });
            return routes;
        }, []);

        if(validRoutes.length === 0) return [];
        
        // 按照amountOut降序
        validRoutes.sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1));

        return validRoutes;
    }, [amounts, validCandidates])

    const routeErrors = useMemo(() => {
        if(!amounts) return [];

        return amounts
            .filter((quote) => quote.status === 'failure')
            .map((quote) => quote.error);
    }, [amounts]);

    const quoteError = error?.message ?? routeErrors[0]?.message ?? null;
    const isInsufficientLiquidity = useMemo(() => {
        if(!shouldQuote || isLoading || sortedRoutes.length > 0 || routeErrors.length === 0) return false;

        return routeErrors.every((routeError) => isLiquidityError(routeError.message));
    }, [isLoading, routeErrors, shouldQuote, sortedRoutes.length]);

    return {
        bestRoute: sortedRoutes?.[0] ?? { path: [tokenIn, tokenOut], label: 'Direct Swap', amountOut: 0n },
        sortedRoutes,
        isLoading,
        error: quoteError,
        isInsufficientLiquidity,
    }
}

function isLiquidityError(message: string) {
    const msg = message.toLowerCase();
    return (
        msg.includes('insufficient_liquidity') ||
        msg.includes('insufficient liquidity') ||
        msg.includes('ds-math-sub-underflow') ||
        msg.includes('pair does not exist') ||
        // Uniswap V2 合约 revert 编码（0x08c379a0 + "INSUFFICIENT_LIQUIDITY"）
        (msg.includes('0x') && msg.includes('execution reverted'))
    );
}