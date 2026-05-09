import { ConnectButton } from '@/components/ConnectButton'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-end">
        <ConnectButton />
      </div>
      <h1 className="text-2xl font-bold mt-8">Mini DEX</h1>
    </main>
  )
}