/**
 * 交换卡片，输入端、输出端，输入输出交换按钮，汇率现实，swap按钮
 */

 'use client'

import { ERC20_ABI, TOKEN_LIST, TokenInfo } from "@/contracts/contracts";
import { useApprove } from "@/hooks/useApprove";
import { useQuote } from "@/hooks/useQuote";
import { useSwap } from "@/hooks/useSwap";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useConnect, useConnection, useReadContract } from "wagmi";
import { injected } from "wagmi/connectors";

 export function SwapCard() {
	const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKEN_LIST[0])
	const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKEN_LIST[1])
	const [amountIn, setAmountIn] = useState('')

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

	const { amountOut, isLoading: isQuoteLoading, error: quoteError } = useQuote({tokenIn, tokenOut, amountIn})

	const { allowance, approve, isPending: isApprovePending, error: approveError } = useApprove({ owner: address!, token: tokenIn })

	const { swap, error: swapError, isSuccess: isSwapSuccess, isPending: isSwapPending, isSwapLoading } = useSwap({ tokenIn, tokenOut, amountIn, amountOut, to: address! })

	const needApprove = useMemo(() => {
		if (!amountIn) return false;
		if (!allowance) return true;
		return BigInt(allowance) < BigInt(parseUnits(amountIn, tokenIn.decimals));
	}, [allowance, amountIn, tokenIn.decimals]);

	// 切换代币方向（常见 DEX 交互：点击箭头翻转输入输出）
	const handleFlip = () => {
		setTokenIn(tokenOut)
		setTokenOut(tokenIn)
		setAmountIn('')
	}

	// 代币选择处理
	const handleTokenInChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selected = TOKEN_LIST.find((t) => t.address === e.target.value)
		if (selected) {
			// 如果选的跟输出代币一样，就翻转
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

	const error = swapError || approveError;

	/** 渲染底部操作按钮，根据状态显示不同文案和样式 */
	const renderActionButton = () => {
		// 未连接钱包
		if (!isConnected) {
			return (
				<button
					disabled={isConnecting}
					style={{ ...styles.swapButton, ...styles.connectButton, ...(isConnecting ? styles.swapButtonLoading : {}) }}
					onClick={() => connect({ connector: injected() })}
				>
					{isConnecting ? <><Spinner /> 连接中...</> : '连接钱包'}
				</button>
			)
		}

		// 未输入金额
		if (!amountIn) {
			return (
				<button disabled style={{ ...styles.swapButton, ...styles.swapButtonDisabled }}>
					输入金额
				</button>
			)
		}

		// 报价加载中
		if (isQuoteLoading) {
			return (
				<button disabled style={{ ...styles.swapButton, ...styles.swapButtonLoading }}>
					<Spinner /> 获取报价中...
				</button>
			)
		}

		// Approve 等待钱包签名 / 链上确认中
		if (needApprove && isApprovePending) {
			return (
				<button disabled style={{ ...styles.swapButton, ...styles.swapButtonLoading }}>
					<Spinner /> 授权中...
				</button>
			)
		}

		// 需要 Approve
		if (needApprove) {
			return (
				<button
					style={{ ...styles.swapButton, ...styles.approveButton }}
					onClick={() => approve(amountIn)}
				>
					授权 {tokenIn.symbol}
				</button>
			)
		}

		// Swap 等待钱包签名
		if (isSwapPending) {
			return (
				<button disabled style={{ ...styles.swapButton, ...styles.swapButtonLoading }}>
					<Spinner /> 等待钱包确认...
				</button>
			)
		}

		// Swap 链上确认中
		if (isSwapLoading) {
			return (
				<button disabled style={{ ...styles.swapButton, ...styles.swapButtonLoading }}>
					<Spinner /> 交易上链中...
				</button>
			)
		}

		// 正常 Swap
		return (
			<button style={{ ...styles.swapButton, ...styles.swapButtonActive }} onClick={swap}>
				Swap
			</button>
		)
	}

	useEffect(() => {
		if (isSwapSuccess) {
			refetchBalance()
		}
	}, [isSwapSuccess, refetchBalance])

	return (
		<div style={styles.card}>
			<h2 style={styles.title}>Swap</h2>

			{/* === 输入端 === */}
			<div style={styles.tokenRow}>
				<div style={styles.tokenRowHeader}>
					<label style={styles.label}>From</label>
					{balanceData && tokenIn.decimals && (
						<span
							style={styles.balance}
							onClick={() => setAmountIn(formatUnits(balanceData, tokenIn.decimals ?? 0))}
							title="点击填入最大余额"
						>
							余额: {formatUnits(balanceData, tokenIn.decimals ?? 0)} {tokenIn.symbol}
						</span>
					)}
				</div>
				<div style={styles.inputGroup}>
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
						style={styles.input}
					/>
					<select
						value={tokenIn.address}
						onChange={handleTokenInChange}
						style={styles.select}
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
			<button onClick={handleFlip} style={styles.flipButton}>
				↕
			</button>

			{/* === 输出端 === */}
			<div style={styles.tokenRow}>
				<label style={styles.label}>To</label>
				<div style={styles.inputGroup}>
					<input
						type="text"
						placeholder="0.0"
						value={isQuoteLoading ? '查询中...' : amountOut ?? ''}
						readOnly
						style={{ ...styles.input, ...styles.inputReadonly }}
					/>
					<select
						value={tokenOut.address}
						onChange={handleTokenOutChange}
						style={styles.select}
					>
						{TOKEN_LIST.map((token) => (
							<option key={token.address} value={token.address}>
								{token.symbol}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* === 汇率显示 === */}
			{amountOut && amountIn && Number(amountIn) > 0 && (
				<div style={styles.rateInfo}>
					1 {tokenIn.symbol} ≈ {(Number(amountOut) / Number(amountIn)).toFixed(8)} {tokenOut.symbol}
				</div>
			)}

			{/* === 报价错误 === */}
			{quoteError && (
				<div style={styles.error}>
					⚠ 报价失败：{quoteError.slice(0, 100)}{quoteError.length > 100 ? '...' : ''}
				</div>
			)}

			{/* === 操作按钮 === */}
			{renderActionButton()}

			{/* === 交易错误 === */}
			{error && (
				<div style={styles.error}>
					⚠ {error.message.slice(0, 120)}{error.message.length > 120 ? '...' : ''}
				</div>
			)}

			{/* === 成功提示 === */}
			{isSwapSuccess && (
				<div style={styles.success}>
					✓ 交换成功！
				</div>
			)}
		</div>
	)
 }

/** 简单 loading spinner */
function Spinner() {
	return (
		<span style={styles.spinner} aria-hidden>
			⟳
		</span>
	)
}

 const styles: Record<string, React.CSSProperties> = {
	card: {
	  maxWidth: 420,
	  margin: '40px auto',
	  padding: 24,
	  borderRadius: 16,
	  border: '1px solid #333',
	  backgroundColor: '#1a1a2e',
	  color: '#e0e0e0',
	  fontFamily: 'monospace',
	},
	title: {
	  margin: '0 0 20px',
	  fontSize: 20,
	  fontWeight: 600,
	  textAlign: 'center',
	},
	tokenRow: {
	  marginBottom: 8,
	  padding: 16,
	  borderRadius: 12,
	  backgroundColor: '#16213e',
	},
	tokenRowHeader: {
	  display: 'flex',
	  justifyContent: 'space-between',
	  alignItems: 'center',
	  marginBottom: 8,
	},
	label: {
	  fontSize: 13,
	  color: '#888',
	},
	balance: {
	  fontSize: 12,
	  color: '#6c9bff',
	  cursor: 'pointer',
	},
	inputGroup: {
	  display: 'flex',
	  gap: 8,
	  alignItems: 'center',
	},
	input: {
	  flex: 1,
	  padding: '12px',
	  fontSize: 20,
	  border: 'none',
	  borderRadius: 8,
	  backgroundColor: 'transparent',
	  color: '#fff',
	  outline: 'none',
	},
	inputReadonly: {
	  color: '#aaa',
	},
	select: {
	  padding: '8px 12px',
	  fontSize: 16,
	  fontWeight: 600,
	  border: '1px solid #333',
	  borderRadius: 8,
	  backgroundColor: '#0f3460',
	  color: '#fff',
	  cursor: 'pointer',
	  outline: 'none',
	},
	flipButton: {
	  display: 'block',
	  margin: '4px auto',
	  padding: '4px 12px',
	  fontSize: 18,
	  border: '1px solid #333',
	  borderRadius: 8,
	  backgroundColor: '#16213e',
	  color: '#6c9bff',
	  cursor: 'pointer',
	},
	rateInfo: {
	  marginTop: 12,
	  padding: '8px 12px',
	  fontSize: 13,
	  color: '#aaa',
	  backgroundColor: '#16213e',
	  borderRadius: 8,
	  textAlign: 'center',
	},
	error: {
	  marginTop: 12,
	  padding: '10px 14px',
	  fontSize: 13,
	  color: '#ff6b6b',
	  backgroundColor: '#2d1b1b',
	  borderRadius: 10,
	  border: '1px solid #5c2020',
	  lineHeight: 1.5,
	},
	success: {
	  marginTop: 12,
	  padding: '10px 14px',
	  fontSize: 13,
	  color: '#4ade80',
	  backgroundColor: '#14290e',
	  borderRadius: 10,
	  border: '1px solid #1a4a10',
	  textAlign: 'center',
	},
	// 按钮基础样式（共用）
	swapButton: {
	  width: '100%',
	  marginTop: 16,
	  padding: '14px',
	  fontSize: 16,
	  fontWeight: 600,
	  border: 'none',
	  borderRadius: 12,
	  cursor: 'pointer',
	  display: 'flex',
	  alignItems: 'center',
	  justifyContent: 'center',
	  gap: 8,
	  transition: 'opacity 0.2s',
	},
	swapButtonActive: {
	  backgroundColor: '#3b82f6',
	  color: '#fff',
	},
	connectButton: {
	  backgroundColor: '#7c3aed',
	  color: '#fff',
	},
	approveButton: {
	  backgroundColor: '#f59e0b',
	  color: '#000',
	},
	swapButtonDisabled: {
	  backgroundColor: '#2a2a3e',
	  color: '#555',
	  cursor: 'not-allowed',
	},
	swapButtonLoading: {
	  backgroundColor: '#1e3a5f',
	  color: '#6c9bff',
	  cursor: 'not-allowed',
	},
	spinner: {
	  display: 'inline-block',
	  animation: 'spin 1s linear infinite',
	  fontSize: 16,
	},
  }