import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — service role key use karta hai
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 })

    // Delete all user data
    await Promise.all([
      supabaseAdmin.from('saved_news').delete().eq('user_id', userId),
      supabaseAdmin.from('reading_history').delete().eq('user_id', userId),
      supabaseAdmin.from('comments').delete().eq('user_id', userId),
      supabaseAdmin.from('article_notes').delete().eq('user_id', userId),
      supabaseAdmin.from('community_shares').delete().eq('user_id', userId),
      supabaseAdmin.from('quiz_scores').delete().eq('user_id', userId),
      supabaseAdmin.from('user_badges').delete().eq('user_id', userId),
      supabaseAdmin.from('profiles').delete().eq('id', userId),
    ])

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
