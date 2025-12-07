import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''

    let query = supabase.from('bounty').select('*', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, reward_m, deadline, creator } = await request.json()

    if (!title || !description || !reward_m || !deadline || !creator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: bounty, error } = await supabase
      .from('bounty')
      .insert({
        title,
        description,
        reward_m,
        deadline,
        creator,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bounty })
  } catch (error) {
    console.error('Bounty creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
