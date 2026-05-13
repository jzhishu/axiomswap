/**
 * 交换卡片，输入端、输出端，输入输出交换按钮，汇率现实，swap按钮
 */

 'use client'

import { ERC20_ABI, TOKEN_LIST, TokenInfo } from "@/contracts/contracts";
import { useQuote } from "@/hooks/useQuote";
import { useState } from "react";
import { formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { useBalance, useConnection, useReadContract } from "wagmi";

 export function SwapCard() {
	const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKEN_LIST[0])
	const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKEN_LIST[1])
	const [amountIn, setAmountIn] = useState('')

	const { address, isConnected } = useConnection();

	const { data: balanceData } = useReadContract({
		address: tokenIn.address,
		abi: ERC20_ABI,
		functionName: 'balanceOf',
		args: [address!],
		query: {
			enabled: !!address,
		}
	})

	const { amountOut, isLoading: isQuoteLoading, error: quoteError } = useQuote({tokenIn, tokenOut, amountIn})

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

	if(!isConnected) {
		return (
			<div style={styles.card}>
				<p style={styles.connectHint}>请先链接钱包</p>
			</div>
		)
	}
	
	return (
		<div style={styles.card}>
			<h2 style={styles.title}>SwapCard</h2>

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
							Balance: {formatUnits(balanceData, tokenIn.decimals ?? 0)} {tokenIn.symbol}
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
							// 只允许数字和小数点
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

			{/* === 错误提示 === */}
			{quoteError && (
				<div style={styles.error}>
					报价失败：{quoteError.slice(0, 100)}
					{quoteError.length > 100 ? '...' : ''}
				</div>
			)}

			{/* === Swap 按钮（暂不可用，下一步实现） === */}
			<button
				disabled
				style={{ ...styles.swapButton, ...styles.swapButtonDisabled }}
			>
				{!amountIn
				? '输入金额'
				: isQuoteLoading
					? '查询报价中...'
					: 'Swap（下一步实现）'}
			</button>
		</div>
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
	  padding: '8px 12px',
	  fontSize: 13,
	  color: '#ff6b6b',
	  backgroundColor: '#2d1b1b',
	  borderRadius: 8,
	},
	swapButton: {
	  width: '100%',
	  marginTop: 16,
	  padding: '14px',
	  fontSize: 16,
	  fontWeight: 600,
	  border: 'none',
	  borderRadius: 12,
	  cursor: 'pointer',
	},
	swapButtonDisabled: {
	  backgroundColor: '#333',
	  color: '#666',
	  cursor: 'not-allowed',
	},
	connectHint: {
	  textAlign: 'center',
	  color: '#888',
	  padding: 40,
	},
  }