'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { useUser } from '@/lib/store/useUser'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { user, initUser } = useUser()

  useEffect(() => {
    if (isConnected && address && !user) {
      initUser(address)
    }
  }, [isConnected, address, user, initUser])

  return (
    <nav className="border-b border-slate-700 bg-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <Image src="/logo-new.png" alt="Memekipedia" width={150} height={40} />
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/wiki"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
              >
                Wiki
              </Link>
              <Link
                href="/bounty"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
              >
                Bounties
              </Link>
              {isConnected && (
                <>
                  <Link
                    href="/staking"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
                  >
                    Staking
                  </Link>
                  <Link
                    href="/account"
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700"
                  >
                    Account
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && address && (
              <div className="text-sm text-slate-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
