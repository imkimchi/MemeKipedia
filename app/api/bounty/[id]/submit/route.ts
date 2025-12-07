import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { submitter, cid } = await request.json()

    if (!submitter || !cid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: submission, error } = await supabase
      .from('bounty_submission')
      .insert({
        bounty_id: params.id,
        submitter,
        cid,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
