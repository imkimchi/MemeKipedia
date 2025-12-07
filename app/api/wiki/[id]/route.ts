import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadSnapshot } from '@/lib/ipfs'
import { SnapshotData } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: wiki, error } = await supabase
      .from('wiki')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Wiki not found' }, { status: 404 })
    }

    const snapshotUrl = `https://ipfs.io/ipfs/${wiki.cid}`
    const snapshotResponse = await fetch(snapshotUrl)
    const snapshot = await snapshotResponse.json()

    return NextResponse.json({ wiki, snapshot })
  } catch (error) {
    console.error('Wiki fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, category, body_mdx, media, editor } = await request.json()

    if (!title || !category || !body_mdx || !editor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    const { data: wiki, error } = await supabase
      .from('wiki')
      .update({
        title,
        category,
        cid,
        editor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wiki })
  } catch (error) {
    console.error('Wiki update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
