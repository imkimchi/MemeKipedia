import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: bounty, error } = await supabase
      .from('bounty')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Bounty not found' }, { status: 404 })
    }

    const { data: submissions } = await supabase
      .from('bounty_submission')
      .select('*')
      .eq('bounty_id', params.id)
      .order('upvotes', { ascending: false })

    return NextResponse.json({ bounty, submissions: submissions || [] })
  } catch (error) {
    console.error('Bounty fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
