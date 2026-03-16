import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

async function extractAllLocations(articles: any[]): Promise<(string | null)[]> {
  try {
    const numbered = articles
      .map((a, i) => `${i + 1}. ${a.title} — ${(a.description || '').slice(0, 100)}`)
      .join('\n')

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `For each news article below, extract the primary Indian city or state name. Reply with ONLY a JSON array of strings, one per article. Use "NONE" if no Indian location found. No explanation, just the array.

Example: ["Mumbai", "NONE", "Delhi", "Karnataka"]

Articles:
${numbered}`
        }]
      })
    })

    const data = await res.json()
    console.log('🤖 Groq full response:', JSON.stringify(data)) // full response

    const text = data.choices?.[0]?.message?.content?.trim() || '[]'
    const match = text.match(/\[.*\]/s)
    if (!match) {
      console.log('❌ No JSON array found in Groq response')
      return articles.map(() => null)
    }

    const parsed: string[] = JSON.parse(match[0])
    console.log('📍 Parsed locations:', parsed)
    return parsed.map(l => (!l || l === 'NONE' || l.length > 50) ? null : l)
  } catch (e) {
    console.log('❌ Groq error:', e)
    return articles.map(() => null)
  }
}

async function geocodeAll(
  uniqueLocations: string[]
): Promise<Map<string, { lat: number; lng: number }>> {
  const results = new Map<string, { lat: number; lng: number }>()

  await Promise.all(
    uniqueLocations.map(async (location) => {
      try {
        const res = await fetch(
          `https://geocode.maps.co/search?q=${encodeURIComponent(location + ', India')}&api_key=${process.env.NEXT_PUBLIC_GEOCODE_API_KEY}`
        )
        const data = await res.json()
        console.log(`📌 Geocode "${location}":`, data?.[0] ? `${data[0].lat}, ${data[0].lon}` : 'NOT FOUND')
        if (data?.[0]) {
          results.set(location, {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          })
        }
      } catch (e) {
        console.log(`❌ Geocode error for "${location}":`, e)
      }
    })
  )

  return results
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang') || 'en'
  const category = searchParams.get('category') || 'general'
  const cacheKey = `map-${lang}-${category}`

  console.log(`\n🗺️ news-map called: lang=${lang} category=${category}`)

  // ── Check Supabase cache ──
  try {
    const { data } = await supabase
      .from('news_locations')
      .select('articles, cached_at')
      .eq('id', cacheKey)
      .single()

    if (data) {
      const isExpired = Date.now() - new Date(data.cached_at).getTime() > CACHE_TTL
      console.log(`💾 Supabase cache found, expired: ${isExpired}`)
      if (!isExpired) return NextResponse.json({ locations: data.articles })
    } else {
      console.log('💾 No Supabase cache found')
    }
  } catch (e) {
    console.log('💾 Supabase cache error:', e)
  }

  // ── Fetch articles ──
  let articles: any[] = []
  try {
    const newsRes = await fetch(`${req.nextUrl.origin}/api/news?lang=${lang}&category=${category}`)
    const data = await newsRes.json()
    articles = data.articles || []
    console.log(`📰 Articles fetched: ${articles.length}`)
  } catch (e) {
    console.log('❌ News fetch error:', e)
    return NextResponse.json({ locations: [] })
  }

  if (articles.length === 0) {
    console.log('❌ No articles returned from /api/news')
    return NextResponse.json({ locations: [] })
  }

  // ── Slice to first 50 to stay within Groq token limit ──
  const articlesToProcess = articles.slice(0, 50)
  console.log(`📰 Processing ${articlesToProcess.length} articles`)

  // ── 1 Groq call for ALL articles ──
  const locationNames = await extractAllLocations(articlesToProcess)
  const validLocations = locationNames.filter(Boolean)
  console.log(`✅ Valid locations found: ${validLocations.length} / ${articlesToProcess.length}`)

  // ── Unique locations ──
  const uniqueLocations = [...new Set(validLocations)] as string[]
  console.log(`🔍 Unique locations to geocode:`, uniqueLocations)

  // ── Geocode ──
  const coordsMap = await geocodeAll(uniqueLocations)
  console.log(`🌍 Geocoded successfully: ${coordsMap.size} / ${uniqueLocations.length}`)

  // ── Build locationMap ──
  const locationMap = new Map<string, { lat: number; lng: number; articles: any[] }>()

  articlesToProcess.forEach((article, i) => {
    const name = locationNames[i]
    if (!name) return
    const coords = coordsMap.get(name)
    if (!coords) return

    if (locationMap.has(name)) {
      locationMap.get(name)!.articles.push(article)
    } else {
      locationMap.set(name, { lat: coords.lat, lng: coords.lng, articles: [article] })
    }
  })

  const locations = Array.from(locationMap.entries()).map(([name, data]) => ({
    name,
    lat: data.lat,
    lng: data.lng,
    count: data.articles.length,
    articles: data.articles,
  }))

  console.log(`🎯 Final locations: ${locations.length}`)

  // ── Save to Supabase cache ──
  if (locations.length > 0) {
    try {
      await supabase.from('news_locations').upsert({
        id: cacheKey,
        articles: locations,
        cached_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      console.log('✅ Saved to Supabase cache')
    } catch (e) {
      console.log('❌ Supabase save error:', e)
    }
  }

  return NextResponse.json({ locations })
}