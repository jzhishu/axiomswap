/**
 * 汇聚 Swap 全流程的状态提示：余额不足 / 流动性不足 / 报价失败 / 交易错误 / 交易成功
 * SwapCard 只需传入状态标志，渲染逻辑全部在此处理。
 */

import { parseSwapError } from '@/utils/parseSwapError';
import React from 'react';

const EXPLORER_URL = 'https://sepolia.etherscan.io/tx';

interface SwapStatusBannerProps {
    /** 报价阶段原始错误（字符串） */
    quoteError: string | null;
    /** 是否流动性不足（由 useQuote 识别） */
    isInsufficientLiquidity: boolean;
    /** 是否余额不足 */
    isInsufficientBalance: boolean;
    /** 余额不足时展示的代币符号 */
    tokenInSymbol: string;
    /** approve 或 swap 阶段的 Error 对象 */
    actionError: Error | null;
    /** 链上收据失败（交易已上链但 revert） */
    isReceiptError: boolean;
    /** 交易哈希，用于链接到浏览器 */
    txHash?: `0x${string}`;
    /** swap 成功 */
    isSwapSuccess: boolean;
}

const bannerBase = "mt-3 p-2.5 text-[13px] rounded-lg border leading-relaxed";

export function SwapStatusBanner({
    quoteError,
    isInsufficientLiquidity,
    isInsufficientBalance,
    tokenInSymbol,
    actionError,
    isReceiptError,
    txHash,
    isSwapSuccess,
}: SwapStatusBannerProps) {
    return (
        <>
            {/* 报价失败（非流动性问题的其他错误） */}
            {quoteError && !isInsufficientLiquidity && (
                <div className={`${bannerBase} text-error bg-error-soft/30 border-error/20`}>
                    ⚠ 报价失败：{quoteError.slice(0, 100)}{quoteError.length > 100 ? '...' : ''}
                </div>
            )}

            {/* 流动性不足 */}
            {isInsufficientLiquidity && (
                <div className={`${bannerBase} text-warning-deep bg-warning-soft/60 border-warning/30`}>
                    ⚠ 当前交易对流动性不足，无法为此金额提供报价，请减少输入金额或等待流动性恢复。
                </div>
            )}

            {/* 余额不足 */}
            {isInsufficientBalance && (
                <div className={`${bannerBase} text-warning-deep bg-warning-soft/60 border-warning/30`}>
                    ⚠ 余额不足：当前 {tokenInSymbol} 余额不足以完成此笔交易。
                </div>
            )}

            {/* approve / swap 阶段错误 */}
            {actionError && (
                <div className={`${bannerBase} text-error bg-error-soft/30 border-error/20`}>
                    ⚠ {parseSwapError(actionError)}
                </div>
            )}

            {/* 链上执行失败（有 txHash 可查） */}
            {isReceiptError && !actionError && (
                <div className={`${bannerBase} text-error bg-error-soft/30 border-error/20`}>
                    ⚠ 交易在链上执行失败，请检查参数或联系支持
                    {txHash && (
                        <a
                            href={`${EXPLORER_URL}/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-1.5 text-xs text-error/70 underline hover:text-error"
                        >
                            查看交易详情 →
                        </a>
                    )}
                </div>
            )}

            {/* 交易成功 */}
            {isSwapSuccess && (
                <div className={`${bannerBase} text-link bg-link-bg-soft/50 border-link/20 flex items-center justify-center gap-2`}>
                    ✓ 交换成功！
                    {txHash && (
                        <a
                            href={`${EXPLORER_URL}/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-link underline hover:text-link-deep"
                        >
                            查看交易 →
                        </a>
                    )}
                </div>
            )}
        </>
    );
}
