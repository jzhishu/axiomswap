import { ConnectButton } from '@/components/ConnectButton'
import { SwapCard } from '@/components/SwapCard'

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas-soft">
      <header className="sticky top-0 z-50 bg-canvas border-b border-hairline">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16 px-6">
          <h1 className="text-lg font-semibold text-ink tracking-[-0.02em]">
            AxiomSwap
          </h1>
          <ConnectButton />
        </div>
      </header>
      <main>
        <SwapCard />
      </main>
    </div>
  )
}
