/**
 * 交换卡片，输入端、输出端，输入输出交换按钮，汇率现实，swap按钮
 */

'use client'

import { ERC20_ABI, TOKEN_LIST, TokenInfo } from "@/contracts/contracts";
import { useApprove } from "@/hooks/useApprove";
import { useQuote } from "@/hooks/useQuote";
import { useSwap } from "@/hooks/useSwap";
import { SwapStatusBanner } from "@/components/SwapStatusBanner";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useConnect, useConnection, useReadContract } from "wagmi";
import { injected } from "wagmi/connectors";

type ButtonState =
	| 'connect'
	| 'no-amount'
	| 'insufficient-balance'
	| 'quote-loading'
	| 'insufficient-liquidity'
	| 'approve-pending'
	| 'need-approve'
	| 'swap-pending'
	| 'swap-loading'
	| 'ready';

export function SwapCard() {
	const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKEN_LIST[0])
	const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKEN_LIST[1])
	const [amountIn, setAmountIn] = useState('')
	const [slippage, setSlippage] = useState('0.5')

	const { address, isConnected } = useConnection();
	const { mutate: connect, isPending: isConnecting } = useConnect();

	const { data: balanceData, refetch: refetchBalance } = useReadContract({
		address: tokenIn.address,
		abi: ERC20_ABI,
		functionName: 'balanceOf',
		args: [address!],
		query: {
			enabled: !!address,
		}
	})

	const { amountOut, isLoading: isQuoteLoading, error: quoteError, isInsufficientLiquidity } = useQuote({ tokenIn, tokenOut, amountIn })

	const { allowance, approve, isPending: isApprovePending, error: approveError } = useApprove({ owner: address!, token: tokenIn })

	const amountOutMin = useMemo(() => {
		if (!amountOut) return null;
		const slippageBps = Math.round(Number(slippage) * 10);
		const amountOutRaw = parseUnits(amountOut, tokenOut.decimals);
		return amountOutRaw * BigInt(1000 - slippageBps) / 1000n;
	}, [amountOut, slippage, tokenOut.decimals]);

	const { swap, error: swapError, isSuccess: isSwapSuccess, isPending: isSwapPending, isSwapLoading, isReceiptError, txHash } = useSwap({ tokenIn, tokenOut, amountIn, amountOut, to: address!, amountOutMin })

	const needApprove = useMemo(() => {
		if (!amountIn) return false;
		if (!allowance) return true;
		return BigInt(allowance) < BigInt(parseUnits(amountIn, tokenIn.decimals));
	}, [allowance, amountIn, tokenIn.decimals]);

	const isInsufficientBalance = useMemo(() => {
		if (!amountIn || !balanceData || !isConnected) return false;
		try {
			return parseUnits(amountIn, tokenIn.decimals) > balanceData;
		} catch {
			return false;
		}
	}, [amountIn, balanceData, tokenIn.decimals, isConnected]);

	const handleFlip = () => {
		setTokenIn(tokenOut)
		setTokenOut(tokenIn)
		setAmountIn('')
	}

	const handleTokenInChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = TOKEN_LIST.find((t) => t.address === e.target.value)
		if (selected) {
			if (selected.address === tokenOut.address) {
				handleFlip()
			} else {
				setTokenIn(selected)
			}
		}
	}

	const handleTokenOutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = TOKEN_LIST.find((t) => t.address === e.target.value)
		if (selected) {
			if (selected.address === tokenIn.address) {
				handleFlip()
			} else {
				setTokenOut(selected)
			}
		}
	}

	const actionError = swapError || approveError;

	/** 确定当前按钮所处的状态 */
	const buttonState: ButtonState = useMemo(() => {
		if (!isConnected) return 'connect'
		if (!amountIn) return 'no-amount'
		if (isInsufficientBalance) return 'insufficient-balance'
		if (isQuoteLoading) return 'quote-loading'
		if (isInsufficientLiquidity) return 'insufficient-liquidity'
		if (needApprove && isApprovePending) return 'approve-pending'
		if (needApprove) return 'need-approve'
		if (isSwapPending) return 'swap-pending'
		if (isSwapLoading) return 'swap-loading'
		return 'ready'
	}, [isConnected, amountIn, isInsufficientBalance, isQuoteLoading, isInsufficientLiquidity, needApprove, isApprovePending, isSwapPending, isSwapLoading])

	useEffect(() => {
		if (isSwapSuccess) {
			refetchBalance()
		}
	}, [isSwapSuccess, refetchBalance])

	/* ====== 按钮配置表 ====== */
	const buttonConfig: Record<ButtonState, { label: string; className: string; disabled: boolean; onClick?: () => void }> = {
		connect: {
			label: isConnecting ? '连接中...' : '连接钱包',
			className: isConnecting ? 'opacity-50' : '',
			disabled: isConnecting,
			onClick: () => connect({ connector: injected() }),
		},
		'no-amount': {
			label: '输入金额',
			className: 'bg-canvas-soft-2 text-mute cursor-not-allowed',
			disabled: true,
		},
		'insufficient-balance': {
			label: '余额不足',
			className: 'bg-error-soft/50 text-error-deep cursor-not-allowed border border-error/30',
			disabled: true,
		},
		'quote-loading': {
			label: '获取报价中...',
			className: 'bg-canvas-soft-2 text-mute cursor-not-allowed',
			disabled: true,
		},
		'insufficient-liquidity': {
			label: '流动性不足',
			className: 'bg-error-soft/50 text-error-deep cursor-not-allowed border border-error/30',
			disabled: true,
		},
		'approve-pending': {
			label: '授权中...',
			className: 'bg-canvas-soft-2 text-mute cursor-not-allowed',
			disabled: true,
		},
		'need-approve': {
			label: `授权 ${tokenIn.symbol}`,
			className: 'bg-amber-500 text-white hover:bg-amber-600',
			disabled: false,
			onClick: () => approve(amountIn),
		},
		'swap-pending': {
			label: '等待钱包确认...',
			className: 'bg-canvas-soft-2 text-mute cursor-not-allowed',
			disabled: true,
		},
		'swap-loading': {
			label: '交易上链中...',
			className: 'bg-canvas-soft-2 text-mute cursor-not-allowed',
			disabled: true,
		},
		ready: {
			label: 'Swap',
			className: 'bg-ink text-white hover:bg-ink/90',
			disabled: false,
			onClick: swap,
		},
	}

	const isLoading = ['quote-loading', 'approve-pending', 'swap-pending', 'swap-loading'].includes(buttonState)
	const config = buttonConfig[buttonState]

	return (
		<div className="max-w-[420px] mx-auto mt-30 mb-10 p-6 rounded-2xl border border-hairline bg-canvas shadow-[0_1px_1px_#00000005,0_2px_2px_#0000000a]">
			<h2 className="text-xl font-semibold text-ink tracking-[-0.02em] mb-5 text-center">
				Swap
			</h2>

			{/* === 输入端 === */}
			<div className="p-4 rounded-xl bg-canvas-soft mb-2">
				<div className="flex justify-between items-center mb-2">
					<label className="text-[13px] text-mute">From</label>
					{balanceData && tokenIn.decimals && (
						<span
							className="text-xs text-link cursor-pointer hover:underline"
							onClick={() => setAmountIn(formatUnits(balanceData, tokenIn.decimals ?? 0))}
							title="点击填入最大余额"
						>
							余额: {formatUnits(balanceData, tokenIn.decimals ?? 0)} {tokenIn.symbol}
						</span>
					)}
				</div>
				<div className="flex gap-2 items-center">
					<input
						type="text"
						inputMode="decimal"
						placeholder="0.0"
						value={amountIn}
						onChange={(e) => {
							const val = e.target.value
							if (/^\d*\.?\d*$/.test(val)) {
								setAmountIn(val)
							}
						}}
						className="flex-1 py-3 text-xl bg-transparent text-ink outline-none placeholder:text-mute"
					/>
					<select
						value={tokenIn.address}
						onChange={handleTokenInChange}
						className="py-2 px-3 text-base font-semibold rounded-lg border border-hairline bg-canvas text-ink cursor-pointer outline-none hover:border-hairline-strong transition-colors"
					>
						{TOKEN_LIST.map((token) => (
							<option key={token.address} value={token.address}>
								{token.symbol}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* === 翻转按钮 === */}
			<button
				onClick={handleFlip}
				className="block mx-auto my-1 p-1.5 text-lg rounded-lg border border-hairline bg-canvas text-ink hover:bg-canvas-soft cursor-pointer transition-colors"
			>
				↕
			</button>

			{/* === 输出端 === */}
			<div className="p-4 rounded-xl bg-canvas-soft mb-3">
				<label className="text-[13px] text-mute mb-2 block">To</label>
				<div className="flex gap-2 items-center">
					<input
						type="text"
						placeholder="0.0"
						value={isQuoteLoading ? '查询中...' : amountOut ?? ''}
						readOnly
						className="flex-1 py-3 text-xl bg-transparent text-mute outline-none"
					/>
					<select
						value={tokenOut.address}
						onChange={handleTokenOutChange}
						className="py-2 px-3 text-base font-semibold rounded-lg border border-hairline bg-canvas text-ink cursor-pointer outline-none hover:border-hairline-strong transition-colors"
					>
						{TOKEN_LIST.map((token) => (
							<option key={token.address} value={token.address}>
								{token.symbol}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* === 汇率 & 最小获得详情 === */}
			{amountOut && amountIn && Number(amountIn) > 0 && (
				<div className="mt-3 rounded-xl border border-hairline bg-canvas-soft overflow-hidden">
					<div className="flex justify-between items-center px-3 py-2 border-b border-hairline">
						<span className="text-[12px] font-normal text-mute" style={{ fontFamily: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>
							汇率
						</span>
						<span className="text-[12px] font-normal text-body" style={{ fontFamily: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>
							1 {tokenIn.symbol} ≈ {(Number(amountOut) / Number(amountIn)).toFixed(8)} {tokenOut.symbol}
						</span>
					</div>
					{amountOutMin !== null && (
						<div className="flex justify-between items-center px-3 py-2">
							<span className="text-[12px] font-normal text-mute" style={{ fontFamily: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>
								最小获得
							</span>
							<span className="text-[12px] font-normal text-body" style={{ fontFamily: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace' }}>
								{formatUnits(amountOutMin, tokenOut.decimals ?? 18)} {tokenOut.symbol}
							</span>
						</div>
					)}
				</div>
			)}

			{/* === 操作按钮 === */}
			<button
				disabled={config.disabled}
				onClick={config.onClick}
				className={`w-full mt-4 py-3.5 text-base font-semibold rounded-full flex items-center justify-center gap-2 transition-all duration-200 ${config.className}`}
			>
				{isLoading && <Spinner />}
				{config.label}
			</button>

			{/* === 滑点设置 === */}
			<div className="flex justify-between items-center mt-3">
				<span className="text-[13px] text-mute">滑点容忍度</span>
				<div className="flex gap-1.5 items-center">
					{['0.1', '0.5', '1.0'].map((v) => (
						<button
							key={v}
							onClick={() => setSlippage(v)}
							className={`px-2.5 py-1 text-[13px] rounded-lg border cursor-pointer transition-colors ${
								slippage === v
									? 'border-link text-link bg-link-bg-soft'
									: 'border-hairline text-mute bg-canvas hover:border-hairline-strong'
							}`}
						>
							{v}%
						</button>
					))}
				</div>
			</div>

			{/* === 所有状态提示（错误 / 警告 / 成功）=== */}
			<SwapStatusBanner
				quoteError={quoteError}
				isInsufficientLiquidity={isInsufficientLiquidity}
				isInsufficientBalance={isInsufficientBalance}
				tokenInSymbol={tokenIn.symbol}
				actionError={actionError}
				isReceiptError={isReceiptError}
				txHash={txHash}
				isSwapSuccess={isSwapSuccess}
			/>
		</div>
	)
}

/** 简单 loading spinner */
function Spinner() {
	return (
		<span className="inline-block animate-[spin_1s_linear_infinite] text-base" aria-hidden>
			⟳
		</span>
	)
}
