import { FACTORY_ABI, getContracts, getTokenList, PAIR_ABI, TokenInfo } from "@/contracts/contracts";
import { useMemo } from "react";
import { useChainId, useReadContracts } from "wagmi";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface UsePriceImpactProps {
    bestRoute: {
        path: `0x${string}`[];
        label: string;
        amountOut: bigint;
      } | null;
    amountIn?: bigint;
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
}

export function usePriceImpact({bestRoute, amountIn, tokenIn, tokenOut}: UsePriceImpactProps) {
    const chainId = useChainId();
    const { FACTORY_ADDRESS } = getContracts(chainId);
    const tokenByAddress = useMemo(() => {
      return new Map(getTokenList(chainId).map((token) => [token.address.toLowerCase(), token]));
    }, [chainId]);
  
    // 1. 查路径上每个相邻代币对的 pair 地址
    const pairs = useMemo(() => {
      if (!bestRoute) return [];
      const result = [];
      for (let i = 0; i < bestRoute.path.length - 1; i++) {
        result.push({ tokenA: bestRoute.path[i], tokenB: bestRoute.path[i + 1] });
      }
      return result;
    }, [bestRoute]);
  
    const { data: pairAddresses } = useReadContracts({
      contracts: pairs.map((p) => ({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getPair",
        args: [p.tokenA, p.tokenB],
      })),
      query: { enabled: pairs.length > 0 },
    });
  
    // 2. 查每个 pair 的 reserves 和 token0
    const validPairs = useMemo(() => {
      if (!pairAddresses) return [];
      return pairAddresses
        .map((r) => (r.status === "success" ? (r.result as `0x${string}`) : null))
        .filter((addr): addr is `0x${string}` => !!addr && addr.toLowerCase() !== ZERO_ADDRESS);
    }, [pairAddresses]);
  
    const { data: reservesData } = useReadContracts({
      contracts: validPairs.flatMap((addr) => [
        { address: addr, abi: PAIR_ABI, functionName: "getReserves" },
        { address: addr, abi: PAIR_ABI, functionName: "token0" },
      ]),
      query: { enabled: validPairs.length > 0 },
    });
  
    // 3. 计算连乘 midPrice，再和 executionPrice 对比
    const priceImpact = useMemo(() => {
      if (!reservesData || !bestRoute || !amountIn || amountIn === 0n) return null;
      if (validPairs.length !== pairs.length) return null;
  
      let midPrice = 1;
  
      for (let i = 0; i < pairs.length; i++) {
        const reserveResult = reservesData[i * 2];
        const token0Result = reservesData[i * 2 + 1];
  
        if (reserveResult?.status !== "success" || token0Result?.status !== "success")
          return null;
  
        const [r0, r1] = reserveResult.result as [bigint, bigint, number];
        const token0 = token0Result.result as `0x${string}`;
  
        // 判断这一跳的 tokenIn 是 token0 还是 token1
        const hopTokenIn = pairs[i].tokenA;
        const hopTokenOut = pairs[i].tokenB;
        const [reserveIn, reserveOut] =
          hopTokenIn.toLowerCase() === token0.toLowerCase() ? [r0, r1] : [r1, r0];

        const hopTokenInInfo = tokenByAddress.get(hopTokenIn.toLowerCase());
        const hopTokenOutInfo = tokenByAddress.get(hopTokenOut.toLowerCase());
        if (!hopTokenInInfo || !hopTokenOutInfo) return null;
  
        const normalizedReserveIn = Number(reserveIn) / 10 ** hopTokenInInfo.decimals;
        const normalizedReserveOut = Number(reserveOut) / 10 ** hopTokenOutInfo.decimals;
        if (normalizedReserveIn === 0) return null;

        midPrice *= normalizedReserveOut / normalizedReserveIn;
      }
  
      // executionPrice 需要考虑 decimals 差异
      const execPrice =
        (Number(bestRoute.amountOut) / 10 ** tokenOut.decimals) /
        (Number(amountIn) / 10 ** tokenIn.decimals);
  
      return ((midPrice - execPrice) / midPrice) * 100;
    }, [reservesData, bestRoute, amountIn, pairs, tokenIn, tokenOut, tokenByAddress, validPairs.length]);
  
    return priceImpact;
  }