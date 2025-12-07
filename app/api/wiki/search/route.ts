import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const sort = searchParams.get('sort') || 'updated_at'
    const cursor = searchParams.get('cursor') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase.from('wiki').select('*', { count: 'exact' })

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,category.ilike.%${q}%`
      )
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (cursor) {
      if (sort === 'created_at') {
        query = query.lt('created_at', cursor)
      } else {
        query = query.lt('updated_at', cursor)
      }
    }

    const sortField = sort === 'created_at' ? 'created_at' : 'updated_at'
    query = query.order(sortField, { ascending: false }).limit(limit)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nextCursor = data && data.length === limit ? data[data.length - 1][sortField] : null

    return NextResponse.json({
      data,
      count,
      nextCursor,
      hasMore: data && data.length === limit,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
