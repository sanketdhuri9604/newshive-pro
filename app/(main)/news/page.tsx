'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '@/components/shared/LangProvider'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft, ExternalLink, Bookmark, BookmarkCheck,
  Clock, Zap, ChevronDown, ChevronUp, Share2, Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactionBar from '@/components/ui/ReactionBar'
import CommentSection from '@/components/ui/CommentSection'
import QuizModal from '@/components/ai/QuizModal'
import ArticleNote from '@/components/ui/ArticleNote'
import RelatedArticles from '@/components/ui/RelatedArticles'

function NewsDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, lang } = useLang()
  const { user, profile } = useAuth()

  const article = {
    title: searchParams.get('title') || '',
    description: searchParams.get('description') || '',
    url: searchParams.get('url') || '',
    image: searchParams.get('image') || '',
    source: searchParams.get('source') || '',
    publishedAt: searchParams.get('publishedAt') || '',
    content: searchParams.get('content') || '',
  }

  const [saved, setSaved] = useState(false)
  const [savingLoading, setSavingLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [sentiment, setSentiment] = useState<{ sentiment: string; confidence: number; reason?: string } | null>(null)
  const [sentimentLoading, setSentimentLoading] = useState(false)
  const [readingTime, setReadingTime] = useState<{ minutes: number } | null>(null)
  const [fakeScore, setFakeScore] = useState<{ credibilityScore: number; verdict: string; reason?: string } | null>(null)
  const [fakeLoading, setFakeLoading] = useState(false)
  const [explainer, setExplainer] = useState('')
  const [explainerLoading, setExplainerLoading] = useState(false)
  const [bias, setBias] = useState<{ bias: string; confidence: number; reason?: string } | null>(null)
  const [biasLoading, setBiasLoading] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>('summary')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState('')
  const [showTranslate, setShowTranslate] = useState(false)
  const [askQuestion, setAskQuestion] = useState('')
  const [askAnswer, setAskAnswer] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [showAsk, setShowAsk] = useState(false)
  const [sharingCommunity, setSharingCommunity] = useState(false)
  const [communityComment, setCommunityComment] = useState('')
  const [showCommunityShare, setShowCommunityShare] = useState(false)

  const [readProgress, setReadProgress] = useState(0)
  const [fontSize, setFontSize] = useState(14)
  const FONT_MIN = 12
  const FONT_MAX = 20

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
      setReadProgress(progress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    if (deltaX > 80 && deltaY < 50) router.back()
    touchStartX.current = null
    touchStartY.current = null
  }

  useEffect(() => {
    if (!user || !article.url) return
    supabase.from('saved_news').select('id').eq('user_id', user.id).eq('url', article.url).maybeSingle().then(({ data }) => setSaved(!!data))
  }, [user, article.url])

  useEffect(() => {
    if (article.content || article.description) {
      const text = article.content || article.description
      const minutes = Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200))
      setReadingTime({ minutes })
    }
  }, [article.content, article.description])

  useEffect(() => {
    if (!user || !article.url || !article.title) return
    const save = async () => {
      try {
        await supabase.from('reading_history').upsert({
          user_id: user.id,
          title: article.title,
          news_url: article.url,
          read_at: new Date().toISOString(),
        }, { onConflict: 'user_id,news_url' })
      } catch {}
    }
    save()
  }, [user, article.url])

  const handleSave = async () => {
    if (!user) { toast.error(t('card.loginToSave')); return }
    setSavingLoading(true)
    try {
      if (saved) {
        const { error } = await supabase.from('saved_news').delete().eq('user_id', user.id).eq('url', article.url)
        if (error) throw error
        setSaved(false)
        toast.success(t('detail.removedFromSaved'))
      } else {
        const { error } = await supabase.from('saved_news').insert({ user_id: user.id, title: article.title, url: article.url, image_url: article.image, description: article.description, source: article.source })
        if (error) throw error
        setSaved(true)
        toast.success(t('card.saved'))
      }
    } catch {
      toast.error(t('detail.saveFailed'))
    } finally {
      setSavingLoading(false)
    }
  }

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'copy') => {
    const text = `${article.title} — ${article.url}`
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(article.url)}`, '_blank')
    } else {
      navigator.clipboard.writeText(article.url)
      toast.success(t('detail.linkCopied'))
    }
  }

  const shareToCommunity = async () => {
    if (!user) { toast.error(t('detail.loginToShare')); return }
    setSharingCommunity(true)
    try {
      const { error } = await supabase.from('community_shares').insert({
        user_id: user.id,
        username: profile?.username || user.email?.split('@')[0] || 'anonymous',
        news_url: article.url,
        title: article.title,
        description: article.description,
        image: article.image,
        source: article.source,
        comment: communityComment.trim(),
        likes: 0,
      })
      if (error) throw error
      toast.success(t('detail.sharedToCommunity'))
      setShowCommunityShare(false)
      setCommunityComment('')
    } catch {
      toast.error(t('detail.shareFailed'))
    } finally { setSharingCommunity(false) }
  }

  const fetchTranslate = async () => {
    if (translated) { setShowTranslate(true); return }
    setTranslating(true)
    setShowTranslate(true)
    const langMap: Record<string, string> = {
      hi: 'Hindi', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
      bn: 'Bengali', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam',
      pa: 'Punjabi', ur: 'Urdu'
    }
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Title: ${article.title}\n\nDescription: ${article.description}`,
          targetLanguage: langMap[lang] || 'Hindi'
        })
      })
      const data = await res.json()
      setTranslated(data.translated || '')
    } catch { toast.error(t('detail.translationFailed')) }
    finally { setTranslating(false) }
  }

  const fetchAskAI = async () => {
    if (!askQuestion.trim()) return
    setAskLoading(true)
    setAskAnswer('')
    try {
      const res = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Article: "${article.title}"\n\nDescription: ${article.description}\n\nQuestion: ${askQuestion}`
          }]
        })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
              try {
                const token = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content || ''
                full += token
                setAskAnswer(full)
              } catch {}
            }
          }
        }
      }
    } catch { toast.error(t('detail.askFailed')) }
    finally { setAskLoading(false) }
  }

  const fetchSummary = async () => {
    if (summary) return
    setSummaryLoading(true)
    try {
      const res = await fetch('/api/ai/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: article.title, description: article.description, content: article.content }) })
      const data = await res.json()
      setSummary(data.summary || '')
    } catch { toast.error(t('ai.aiBusy')) }
    finally { setSummaryLoading(false) }
  }

  const fetchSentiment = async () => {
    if (sentiment) return
    setSentimentLoading(true)
    try {
      const res = await fetch('/api/ai/sentiment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: article.title, description: article.description }) })
      const data = await res.json()
      setSentiment(data)
    } catch { toast.error(t('ai.aiBusy')) }
    finally { setSentimentLoading(false) }
  }

  const fetchFakeScore = async () => {
    if (fakeScore) return
    setFakeLoading(true)
    try {
      const res = await fetch('/api/ai/fake-detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: article.title, description: article.description, source: article.source }) })
      const data = await res.json()
      setFakeScore(data)
    } catch { toast.error(t('ai.aiBusy')) }
    finally { setFakeLoading(false) }
  }

  const fetchExplainer = async () => {
    if (explainer || !fakeScore) return
    setExplainerLoading(true)
    try {
      const res = await fetch('/api/ai/credibility-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: article.title, description: article.description, source: article.source, score: fakeScore.credibilityScore, verdict: fakeScore.verdict })
      })
      const data = await res.json()
      setExplainer(data.explanation || '')
    } catch { toast.error(t('detail.explainFailed')) }
    finally { setExplainerLoading(false) }
  }

  const fetchBias = async () => {
    if (bias) return
    setBiasLoading(true)
    try {
      const res = await fetch('/api/ai/bias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: article.title, description: article.description }) })
      const data = await res.json()
      setBias(data)
    } catch { toast.error(t('ai.aiBusy')) }
    finally { setBiasLoading(false) }
  }

  const toggleSection = (section: string, fetchFn?: () => void) => {
    if (openSection === section) { setOpenSection(null); return }
    setOpenSection(section)
    if (fetchFn) fetchFn()
  }

  if (!article.title) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-text-muted">{t('detail.noArticle')}</p>
    </div>
  )

  return (
    <>
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 z-[9999] h-0.5 transition-all duration-100"
        style={{
          width: `${readProgress}%`,
          background: 'linear-gradient(to right, #8B5CF6, #06B6D4)',
          boxShadow: '0 0 8px rgba(139,92,246,0.6)',
        }}
      />

      <div
        className="max-w-3xl mx-auto px-4 py-8"
        style={{ position: 'relative', zIndex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6 group text-sm">
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          {t('detail.backToFeed')}
        </button>

        {article.image && (
          <div className="relative rounded-3xl overflow-hidden mb-6 h-64 md:h-80 border border-white/8">
            <img src={article.image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,4,15,0.9) 0%, rgba(4,4,15,0.3) 60%, transparent 100%)' }} />
            <div className="absolute top-4 left-4">
              <span className="text-[11px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(4,4,15,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(6,182,212,0.4)', color: '#06B6D4' }}>
                {article.source}
              </span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {!article.image && (
              <span className="text-[11px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}>
                {article.source}
              </span>
            )}
            {readingTime && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Clock size={11} />
                {readingTime.minutes} {t('card.minRead')}
              </span>
            )}
            {article.publishedAt && (
              <span className="text-xs text-text-muted">
                // ✅ Yeh karo — hamesha same format
{new Date(article.publishedAt).toLocaleDateString('en-GB')}
              </span>
            )}

            {/* Font Size Controls */}
            <div className="flex items-center gap-1 ml-auto px-2 py-1 rounded-lg border border-white/8"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <button
                onClick={() => setFontSize(f => Math.max(FONT_MIN, f - 1))}
                disabled={fontSize <= FONT_MIN}
                className="w-6 h-6 rounded-md text-xs font-bold text-text-muted hover:text-text-primary hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center"
              >A-</button>
              <span className="text-[10px] text-text-muted font-mono w-6 text-center">{fontSize}</span>
              <button
                onClick={() => setFontSize(f => Math.min(FONT_MAX, f + 1))}
                disabled={fontSize >= FONT_MAX}
                className="w-6 h-6 rounded-md text-sm font-bold text-text-muted hover:text-text-primary hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center"
              >A+</button>
            </div>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-text-primary leading-tight mb-4">
            {article.title}
          </h1>
          {article.description && (
            <p className="text-text-secondary leading-relaxed border-l-2 border-accent-purple/40 pl-4"
              style={{ fontSize: `${fontSize}px` }}>
              {article.description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <a href={article.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-glow-purple"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            <ExternalLink size={14} />
            {t('detail.readFull')}
          </a>
          <button onClick={handleSave} disabled={savingLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border"
            style={{
              background: saved ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
              borderColor: saved ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)',
              color: saved ? '#8B5CF6' : '#A0A0C0'
            }}>
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saved ? t('card.saved') : t('detail.save')}
          </button>
        </div>

        {/* Share */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <Share2 size={11} /> {t('detail.share')}:
          </span>
          <button onClick={() => handleShare('whatsapp')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-green-400/20 text-green-400 hover:bg-green-400/10 transition-all">
            WhatsApp
          </button>
          <button onClick={() => handleShare('twitter')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-sky-400/20 text-sky-400 hover:bg-sky-400/10 transition-all">
            Twitter
          </button>
          <button onClick={() => handleShare('copy')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-text-muted hover:bg-white/5 transition-all">
            {t('detail.copyLink')}
          </button>
        </div>

        {/* Reactions */}
        <div className="mb-8 p-4 rounded-2xl border border-white/8"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
          <ReactionBar newsUrl={article.url} />
        </div>

        {/* AI Analysis */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-6 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)' }} />
            <h2 className="text-sm font-black tracking-widest uppercase text-accent-purple">{t('ai.analysis')}</h2>
            <span className="text-[10px] font-mono text-accent-purple/50 border border-accent-purple/20 px-2 py-0.5 rounded-full">Groq LLaMA</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)' }} />
          </div>

          <div className="space-y-4">

            {/* Summary */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: openSection === 'summary' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSection('summary', fetchSummary)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">🧠</span> {t('ai.summary')}</span>
                {openSection === 'summary' ? <ChevronUp size={15} className="text-accent-purple" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {openSection === 'summary' && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {summaryLoading ? (
                    <div className="space-y-2 pt-3"><div className="skeleton h-3 rounded-full w-full" /><div className="skeleton h-3 rounded-full w-4/5" /><div className="skeleton h-3 rounded-full w-3/5" /></div>
                  ) : summary ? (
                    <p className="text-text-secondary leading-relaxed pt-3" style={{ fontSize: `${fontSize}px` }}>{summary}</p>
                  ) : (
                    <button onClick={fetchSummary} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6' }}>
                      <Zap size={13} /> {t('ai.generate')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sentiment */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: openSection === 'sentiment' ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSection('sentiment', fetchSentiment)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">😊</span> {t('ai.sentiment')}</span>
                {openSection === 'sentiment' ? <ChevronUp size={15} className="text-accent-cyan" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {openSection === 'sentiment' && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {sentimentLoading ? <div className="skeleton h-10 rounded-xl w-32 mt-3" /> : sentiment ? (
                    <div className="space-y-3 pt-3">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${sentiment.sentiment === 'positive' ? 'bg-green-400/10 border-green-400/30 text-green-400' : sentiment.sentiment === 'negative' ? 'bg-red-400/10 border-red-400/30 text-red-400' : 'bg-gray-400/10 border-gray-400/30 text-gray-400'}`}>
                        {sentiment.sentiment === 'positive' ? '😊' : sentiment.sentiment === 'negative' ? '😟' : '😐'}
                        {sentiment.sentiment?.charAt(0).toUpperCase() + sentiment.sentiment?.slice(1)}
                        <span className="text-xs opacity-60 font-normal">({sentiment.confidence}%)</span>
                      </div>
                      {sentiment.reason && <p className="text-text-muted text-xs leading-relaxed">{sentiment.reason}</p>}
                    </div>
                  ) : (
                    <button onClick={fetchSentiment} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06B6D4' }}>
                      <Zap size={13} /> {t('ai.analyze')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Credibility */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: openSection === 'fake' ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSection('fake', fetchFakeScore)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">🔍</span> {t('ai.credibility')}</span>
                {openSection === 'fake' ? <ChevronUp size={15} className="text-accent-orange" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {openSection === 'fake' && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {fakeLoading ? <div className="skeleton h-10 rounded-xl w-full mt-3" /> : fakeScore ? (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${fakeScore.credibilityScore}%`, background: fakeScore.credibilityScore > 70 ? 'linear-gradient(to right, #10B981, #6FFFA0)' : fakeScore.credibilityScore > 40 ? 'linear-gradient(to right, #F97316, #FFB86F)' : 'linear-gradient(to right, #EF4444, #FF6F6F)' }} />
                        </div>
                        <span className="font-mono text-sm font-bold w-12 text-right" style={{ color: fakeScore.credibilityScore > 70 ? '#10B981' : fakeScore.credibilityScore > 40 ? '#F97316' : '#EF4444' }}>{fakeScore.credibilityScore}%</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: fakeScore.credibilityScore > 70 ? '#10B981' : fakeScore.credibilityScore > 40 ? '#F97316' : '#EF4444' }}>{fakeScore.verdict}</p>
                      {fakeScore.reason && <p className="text-text-muted text-xs leading-relaxed">{fakeScore.reason}</p>}
                      {!explainer && !explainerLoading && (
                        <button onClick={fetchExplainer}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-accent-orange/20 text-accent-orange hover:bg-accent-orange/10 transition-all">
                          <Zap size={11} /> {t('detail.whyThisScore')}
                        </button>
                      )}
                      {explainerLoading && (
                        <div className="space-y-1.5">
                          <div className="skeleton h-3 rounded-full w-full" />
                          <div className="skeleton h-3 rounded-full w-4/5" />
                          <div className="skeleton h-3 rounded-full w-3/5" />
                        </div>
                      )}
                      {explainer && (
                        <div className="rounded-xl border border-accent-orange/15 p-3 space-y-2"
                          style={{ background: 'rgba(249,115,22,0.05)' }}>
                          <p className="text-xs font-semibold text-accent-orange">{t('detail.scoreExplanation')}</p>
                          <p className="text-text-secondary text-xs leading-relaxed whitespace-pre-line">{explainer}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={fetchFakeScore} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316' }}>
                      <Zap size={13} /> {t('ai.check')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bias */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: openSection === 'bias' ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSection('bias', fetchBias)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">📊</span> {t('ai.biasMeter')}</span>
                {openSection === 'bias' ? <ChevronUp size={15} className="text-accent-pink" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {openSection === 'bias' && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {biasLoading ? <div className="skeleton h-10 rounded-xl w-full mt-3" /> : bias ? (
                    <div className="space-y-3 pt-3">
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(16,185,129,0.5), rgba(139,92,246,0.5))' }}>
                        <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-lg transition-all duration-1000 border-2 border-white" style={{ left: bias.bias === 'left' ? '8%' : bias.bias === 'right' ? '83%' : '46%', background: 'white', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
                      </div>
                      <div className="flex justify-between text-xs text-text-muted">
                        <span className="text-red-400">{t('ai.left')}</span>
                        <span className="font-bold text-text-primary">{bias.bias?.toUpperCase()} · {bias.confidence}% {t('ai.confidence')}</span>
                        <span className="text-accent-purple">{t('ai.right')}</span>
                      </div>
                      {bias.reason && <p className="text-text-muted text-xs leading-relaxed">{bias.reason}</p>}
                    </div>
                  ) : (
                    <button onClick={fetchBias} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#EC4899' }}>
                      <Zap size={13} /> {t('ai.detectBias')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quiz */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: openSection === 'quiz' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSection('quiz')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">🧩</span> {t('ai.quiz')}</span>
                {openSection === 'quiz' ? <ChevronUp size={15} className="text-accent-yellow" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {openSection === 'quiz' && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <p className="text-text-muted text-xs mb-3">{t('ai.quizSub')}</p>
                  <QuizModal title={article.title} description={article.description} content={article.content} />
                </div>
              )}
            </div>

            {/* Translate */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: showTranslate ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => showTranslate ? setShowTranslate(false) : fetchTranslate()}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">🌐</span> {t('detail.translateArticle')}</span>
                {showTranslate ? <ChevronUp size={15} className="text-accent-purple" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {showTranslate && (
                <div className="px-4 pb-4 border-t border-white/5">
                  {translating ? (
                    <div className="space-y-2 pt-3"><div className="skeleton h-3 rounded-full w-full" /><div className="skeleton h-3 rounded-full w-4/5" /></div>
                  ) : (
                    <p className="text-text-secondary leading-relaxed pt-3 whitespace-pre-line" style={{ fontSize: `${fontSize}px` }}>{translated}</p>
                  )}
                </div>
              )}
            </div>

            {/* Ask AI */}
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: showAsk ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowAsk(!showAsk)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary"><span className="text-lg">💬</span> {t('detail.askAI')}</span>
                {showAsk ? <ChevronUp size={15} className="text-accent-cyan" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {showAsk && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={askQuestion}
                      onChange={e => setAskQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchAskAI()}
                      placeholder={t('detail.askPlaceholder')}
                      className="input-field flex-1 text-sm"
                    />
                    <button onClick={fetchAskAI} disabled={askLoading || !askQuestion.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-medium border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 disabled:opacity-50 transition-all">
                      {askLoading ? '...' : '→'}
                    </button>
                  </div>
                  {askAnswer && (
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {askAnswer}
                      {askLoading && <span className="inline-block w-1.5 h-4 bg-accent-cyan ml-0.5 animate-pulse" />}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Bottom Sections */}
        <div className="space-y-4">
          <RelatedArticles title={article.title} category={searchParams.get('category') || undefined} />
          <ArticleNote newsUrl={article.url} articleTitle={article.title} />

          {user && (
            <div className="rounded-2xl border overflow-hidden transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', borderColor: showCommunityShare ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShowCommunityShare(!showCommunityShare)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <span className="text-lg">👥</span> {t('detail.shareToCommunity')}
                </span>
                {showCommunityShare ? <ChevronUp size={15} className="text-accent-pink" /> : <ChevronDown size={15} className="text-text-muted" />}
              </button>
              {showCommunityShare && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  <textarea
                    value={communityComment}
                    onChange={e => setCommunityComment(e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder={t('detail.communityCommentPlaceholder')}
                    className="input-field resize-none text-sm"
                  />
                  <button onClick={shareToCommunity} disabled={sharingCommunity}
                    className="w-full py-2.5 bg-accent-pink/10 hover:bg-accent-pink/20 border border-accent-pink/20 text-accent-pink text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                    {sharingCommunity ? t('detail.sharing') : t('detail.shareToCommunityBtn')}
                  </button>
                </div>
              )}
            </div>
          )}

          <CommentSection newsUrl={article.url} />
        </div>

      </div>
    </>
  )
}

export default function NewsDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="skeleton h-6 w-28 rounded-lg mb-6" />
        <div className="skeleton h-72 rounded-3xl mb-6" />
        <div className="skeleton h-8 w-3/4 rounded-xl mb-3" />
        <div className="skeleton h-4 w-full rounded-lg mb-2" />
        <div className="skeleton h-4 w-2/3 rounded-lg mb-8" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-2xl" />)}
        </div>
      </div>
    }>
      <NewsDetailContent />
    </Suspense>
  )
}
