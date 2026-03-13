'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '@/components/shared/LangProvider'
import { GitCompare, Zap, ArrowLeft, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

function CompareContent() {
  const { t } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [article1] = useState({
    title: searchParams.get('title1') || '',
    description: searchParams.get('desc1') || '',
    source: searchParams.get('source1') || '',
    image: searchParams.get('image1') || '',
    url: searchParams.get('url1') || '',
  })
  const [article2] = useState({
    title: searchParams.get('title2') || '',
    description: searchParams.get('desc2') || '',
    source: searchParams.get('source2') || '',
    image: searchParams.get('image2') || '',
    url: searchParams.get('url2') || '',
  })

  const [comparison, setComparison] = useState('')
  const [loading, setLoading] = useState(false)

  const canCompare = article1.title.trim() && article2.title.trim()

  useEffect(() => {
    if (canCompare) fetchComparison()
  }, [])

  const fetchComparison = async () => {
    setLoading(true)
    setComparison('')
    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article1, article2 }),
      })
      const data = await res.json()
      setComparison(data.comparison || '')
    } catch {
      toast.error('Failed to compare articles')
    } finally { setLoading(false) }
  }

  const ArticleCard = ({ article, index }: { article: { title: string; description: string; source: string; image: string; url: string }, index: number }) => (
    <div className={`glass rounded-2xl border overflow-hidden ${index === 0 ? 'border-accent-purple/30' : 'border-accent-cyan/30'}`}>
      {/* Image */}
      {article.image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.image}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-card/90 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-mono px-2 py-1 rounded-md border backdrop-blur-sm ${
              index === 0
                ? 'text-accent-purple bg-bg-primary/80 border-accent-purple/30'
                : 'text-accent-cyan bg-bg-primary/80 border-accent-cyan/30'
            }`}>
              {article.source || 'Unknown'}
            </span>
          </div>
          <div className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
            index === 0 ? 'bg-accent-purple' : 'bg-accent-cyan'
          }`}>
            {index + 1}
          </div>
        </div>
      )}

      {/* No image fallback */}
      {!article.image && (
        <div className={`h-16 flex items-center justify-between px-4 ${
          index === 0 ? 'bg-accent-purple/10' : 'bg-accent-cyan/10'
        }`}>
          <span className={`text-xs font-mono font-bold ${index === 0 ? 'text-accent-purple' : 'text-accent-cyan'}`}>
            {article.source || 'Unknown'}
          </span>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
            index === 0 ? 'bg-accent-purple' : 'bg-accent-cyan'
          }`}>
            {index + 1}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-text-primary font-semibold text-sm leading-snug mb-2 line-clamp-3">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-text-muted text-xs leading-relaxed line-clamp-3 mb-3">
            {article.description}
          </p>
        )}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
              index === 0 ? 'text-accent-purple hover:text-accent-purple/80' : 'text-accent-cyan hover:text-accent-cyan/80'
            }`}
          >
            <ExternalLink size={11} />
            Read Full Article
          </a>
        )}
      </div>
    </div>
  )

  if (!canCompare) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <GitCompare size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
        <p className="text-text-muted mb-4">No articles selected for comparison.</p>
        <button onClick={() => router.push('/')} className="text-accent-purple text-sm hover:underline">
          ← Go back to feed
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6 group text-sm"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
        Back to feed
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <GitCompare size={20} className="text-accent-cyan" />
          <h1 className="font-display text-5xl tracking-wider">
            NEWS<span className="text-accent-cyan">COMPARE</span>
          </h1>
        </div>
        <p className="text-text-muted text-sm">AI analysis of how these stories differ</p>
      </div>

      {/* Article Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <ArticleCard article={article1} index={0} />
        <ArticleCard article={article2} index={1} />
      </div>

      {/* VS */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/5" />
        <span className="font-display text-2xl text-text-muted tracking-wider">VS</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass rounded-2xl border border-accent-purple/20 p-6 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-accent-purple animate-pulse" />
            <span className="text-sm text-accent-purple">AI is comparing articles...</span>
          </div>
          <div className="skeleton h-3 rounded-full w-full" />
          <div className="skeleton h-3 rounded-full w-4/5" />
          <div className="skeleton h-3 rounded-full w-3/5" />
          <div className="skeleton h-3 rounded-full w-4/5" />
        </div>
      )}

      {/* Result */}
      {comparison && !loading && (
        <div className="glass rounded-2xl border border-accent-purple/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-accent-purple" />
            <span className="text-sm font-semibold text-accent-purple">AI Comparison Analysis</span>
            <span className="text-xs font-mono text-accent-purple/50 border border-accent-purple/20 px-2 py-0.5 rounded-full ml-auto">
              Powered by Groq
            </span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{comparison}</p>
          <button
            onClick={fetchComparison}
            className="mt-4 text-xs text-text-muted hover:text-accent-purple transition-colors"
          >
            ↻ Regenerate analysis
          </button>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 rounded-lg mb-6" />
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}