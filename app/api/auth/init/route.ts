import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json()

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', wallet.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ user: existingUser })
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        wallet: wallet.toLowerCase(),
        nickname: null,
        settings: {},
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: newUser })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
