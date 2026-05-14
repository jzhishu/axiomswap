/**
 * 将合约/钱包原始错误映射为用户可读的中文提示
 */
export function parseSwapError(err: Error | null): string | null {
    if (!err) return null;
    const msg = err.message;

    if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('ACTION_REJECTED')) {
        return '已取消：用户拒绝了交易';
    }
    if (msg.includes('insufficient funds') || msg.includes('InsufficientFunds')) {
        return '链上手续费不足，请确保钱包有足够的 ETH 支付 Gas';
    }
    if (msg.includes('INSUFFICIENT_OUTPUT_AMOUNT') || msg.includes('slippage')) {
        return '滑点超限，请提高滑点容忍度后重试';
    }
    if (msg.includes('EXPIRED') || msg.includes('expired')) {
        return '交易已超时，请重新发起';
    }
    if (msg.includes('TRANSFER_FAILED') || msg.includes('TransferHelper')) {
        return '代币转账失败，请检查授权额度';
    }
    if (msg.includes('INSUFFICIENT_LIQUIDITY') || msg.includes('insufficient liquidity')) {
        return '流动性不足，无法完成此笔交易';
    }
    if (msg.includes('execution reverted')) {
        return '合约执行失败，请检查参数或联系支持';
    }

    return msg.slice(0, 120) + (msg.length > 120 ? '...' : '');
}
