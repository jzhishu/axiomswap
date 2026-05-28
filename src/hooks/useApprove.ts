import { useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ERC20_ABI, getContracts, TokenInfo } from "../contracts/contracts";
import { parseUnits } from "viem";
import { useEffect, useMemo } from "react";

interface ApproveProps {
    token: TokenInfo;
    owner: `0x${string}`;
}

export function useApprove({ owner, token }: ApproveProps) {
    const chainId = useChainId()
    const { ROUTER_ADDRESS } = getContracts(chainId)

    // 查询授权额度
    const { data: allowance, isLoading: isAllowanceLoading, error: allowanceError, refetch: refetchAllowance } = useReadContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner as `0x${string}`, ROUTER_ADDRESS],
        query: {
            enabled: !!owner && !!token?.address,
        }
    })

    // 执行授权
    const { mutate, data: txHash, isPending: isApprovePending, error: approveError } = useWriteContract()

    const approve = (amount: string) => {
        mutate({
            address: token.address,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [ROUTER_ADDRESS, parseUnits(amount, token.decimals)],
        })
    }

    const { isSuccess: isApproveSuccess, isError: isApproveError, isLoading: isApproveLoading } = useWaitForTransactionReceipt({
        hash: txHash,
    })

    const error = useMemo(() => {
        return allowanceError || approveError || isApproveError ? new Error('Approve failed') : null;
    }, [allowanceError, approveError, isApproveError]);

    const isPending = useMemo(() => {
        return isApprovePending || isApproveLoading || isAllowanceLoading;
    }, [isApprovePending, isApproveLoading, isAllowanceLoading]);

    useEffect(() => {
        if (isApproveSuccess) {
            refetchAllowance()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isApproveSuccess]);

    return { allowance, approve, isPending, error };
}