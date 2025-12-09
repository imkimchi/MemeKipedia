import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadSnapshot } from '@/lib/ipfs'
import { SnapshotData } from '@/lib/types'
import { deployTokenWithBondingCurve } from '@/lib/memecore/token-deployer'
import { DEFAULT_INITIAL_SUPPLY, DEFAULT_NETWORK } from '@/lib/memecore/config'

export async function POST(request: NextRequest) {
  try {
    const { title, ticker, body_mdx, media, editor, logo } = await request.json()

    if (!title || !ticker || !body_mdx || !editor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Default category for token deployment (can be customized later)
    const category = 'Meme'

    const snapshot: SnapshotData = {
      version: 1,
      type: 'wiki',
      title,
      category,
      body_mdx,
      media: media || [],
      editor,
      timestamp: Math.floor(Date.now() / 1000),
    }

    const cid = await uploadSnapshot(snapshot)

    // Deploy MRC-20 token on Memecore
    let tokenData = null
    const shouldDeployToken = process.env.ENABLE_TOKEN_DEPLOYMENT === 'true'

    if (shouldDeployToken) {
      try {
        console.log(`Deploying token with bonding curve for wiki: ${title} (${ticker})`)
        const deployment = await deployTokenWithBondingCurve({
          name: title,
          symbol: ticker, // Use user-provided ticker
          logoURI: logo || 'https://memekipedia.com/default-logo.png', // Use wiki logo or default
          category,
          network: DEFAULT_NETWORK,
        })

        tokenData = {
          token_address: deployment.tokenAddress,
          token_symbol: deployment.tokenSymbol,
          token_name: deployment.tokenName,
          token_supply: deployment.initialSupply,
          deploy_tx_hash: deployment.transactionHash,
          token_network: deployment.network,
          bonding_curve_address: deployment.bondingCurveAddress, // NEW: Store bonding curve address
        }

        console.log(`Token deployed: ${deployment.tokenAddress}`)
        console.log(`Bonding curve deployed: ${deployment.bondingCurveAddress}`)
        console.log(`✅ Trading enabled immediately!`)
      } catch (tokenError) {
        console.error('Token deployment failed:', tokenError)
        // Continue with wiki creation even if token deployment fails
        // In production, you might want to retry or handle this differently
      }
    }

    // Insert wiki with optional token data
    const { data: wiki, error } = await supabase
      .from('wiki')
      .insert({
        title,
        category,
        cid,
        editor,
        ...(tokenData || {}),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wiki })
  } catch (error) {
    console.error('Wiki creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
