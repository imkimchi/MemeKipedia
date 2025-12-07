'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses'
import { MTOKEN_ABI, STAKING_ABI, REWARD_DISTRIBUTOR_ABI } from '@/lib/contracts/abis'
import { useRouter } from 'next/navigation'

export default function StakingPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [stakeAmount, setStakeAmount] = useState('')

  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.MToken as `0x${string}`,
    abi: MTOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const { data: stakeData } = useReadContract({
    address: CONTRACT_ADDRESSES.StakingContract as `0x${string}`,
    abi: STAKING_ABI,
    functionName: 'getStake',
    args: address ? [address] : undefined,
  })

  const { data: pendingRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.RewardDistributor as `0x${string}`,
    abi: REWARD_DISTRIBUTOR_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
  })

  const { data: approveHash, writeContract: approve } = useWriteContract()
  const { data: stakeHash, writeContract: stake } = useWriteContract()
  const { data: unstakeHash, writeContract: unstake } = useWriteContract()
  const { data: claimHash, writeContract: claim } = useWriteContract()

  const { isLoading: isApproving } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: isStaking } = useWaitForTransactionReceipt({ hash: stakeHash })
  const { isLoading: isUnstaking } = useWaitForTransactionReceipt({ hash: unstakeHash })
  const { isLoading: isClaiming } = useWaitForTransactionReceipt({ hash: claimHash })

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  const handleApproveAndStake = async () => {
    if (!stakeAmount || !address) return

    const amount = parseEther(stakeAmount)

    approve({
      address: CONTRACT_ADDRESSES.MToken as `0x${string}`,
      abi: MTOKEN_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.StakingContract as `0x${string}`, amount],
    })

    setTimeout(() => {
      stake({
        address: CONTRACT_ADDRESSES.StakingContract as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'stake',
        args: [amount],
      })
    }, 2000)
  }

  const handleUnstake = () => {
    unstake({
      address: CONTRACT_ADDRESSES.StakingContract as `0x${string}`,
      abi: STAKING_ABI,
      functionName: 'unstake',
    })
  }

  const handleClaim = () => {
    claim({
      address: CONTRACT_ADDRESSES.RewardDistributor as `0x${string}`,
      abi: REWARD_DISTRIBUTOR_ABI,
      functionName: 'claim',
    })
  }

  if (!isConnected) {
    return null
  }

  const stakedAmount = stakeData ? stakeData[0] : BigInt(0)
  const unlockTime = stakeData ? stakeData[2] : BigInt(0)
  const isLocked = unlockTime > BigInt(Math.floor(Date.now() / 1000))

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-slate-100">Staking</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#a855f7]">
              {balance ? formatEther(balance) : '0'} M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staked Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#98fce5]">
              {formatEther(stakedAmount)} M
            </p>
            {isLocked && (
              <p className="mt-2 text-sm text-slate-400">
                Unlocks: {new Date(Number(unlockTime) * 1000).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stake Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={stakedAmount > BigInt(0)}
              />
            </div>
            <Button
              onClick={handleApproveAndStake}
              disabled={!stakeAmount || stakedAmount > BigInt(0) || isApproving || isStaking}
              className="w-full"
            >
              {isApproving || isStaking ? 'Staking...' : 'Stake'}
            </Button>
            {stakedAmount > BigInt(0) && (
              <Button
                onClick={handleUnstake}
                disabled={isLocked || isUnstaking}
                variant="outline"
                className="w-full"
              >
                {isUnstaking ? 'Unstaking...' : isLocked ? 'Locked' : 'Unstake'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Pending Rewards:</span>
              <span className="text-lg font-semibold text-[#98fce5]">
                {pendingRewards ? formatEther(pendingRewards) : '0'} M
              </span>
            </div>
            <Button
              onClick={handleClaim}
              disabled={!pendingRewards || pendingRewards === BigInt(0) || isClaiming}
              className="w-full"
            >
              {isClaiming ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
