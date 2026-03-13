'use client'

import { useState } from 'react'
import { Swords, Zap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface DebateSide {
  position: string
  arguments: string[]
  conclusion: string
}

interface DebateResult {
  topic: string
  sideA: DebateSide
  sideB: DebateSide
  verdict: string
}

const SAMPLE_TOPICS = [
  'Social media does more harm than good',
  'AI will replace most jobs in 10 years',
  'Remote work is better than office work',
  'Nuclear energy is the future',
  'Cryptocurrency will replace traditional banking',
  'Space exploration is a waste of money',
]

export default function DebatePage() {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<DebateResult | null>(null)
  const [loading, setLoading] = useState(false)

  const generateDebate = async (t?: string) => {
    const debateTopic = (t ?? topic).trim()
    if (!debateTopic) { toast.error('Enter a topic first!'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: debateTopic }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch {
      toast.error('Could not generate debate. Try again!')
    } finally { setLoading(false) }
  }

  const handleSample = (t: string) => {
    setTopic(t)
    generateDebate(t)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-wider">
          DEBATE<span className="text-accent-red"> MODE</span>
        </h1>
        <p className="text-text-muted text-sm mt-1">AI generates both sides of any argument ⚔️</p>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
        <label className="text-xs text-text-muted mb-2 block">Enter a topic or statement</label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateDebate()}
            placeholder="e.g. Social media is harmful for society"
            className="input-field flex-1 text-sm"
          />
          <button onClick={() => generateDebate()} disabled={loading || !topic.trim()}
            className="px-4 py-2.5 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Swords size={14} />}
            {loading ? 'Generating...' : 'Debate!'}
          </button>
        </div>

        {/* Sample topics */}
        <div className="mt-3">
          <p className="text-xs text-text-muted mb-2">Try a sample:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map(t => (
              <button key={t} onClick={() => handleSample(t)}
                className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-text-muted hover:border-accent-red/30 hover:text-text-primary transition-all">
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl h-64 animate-pulse border border-white/5" />
            <div className="glass rounded-2xl h-64 animate-pulse border border-white/5" />
          </div>
          <div className="glass rounded-2xl h-20 animate-pulse border border-white/5" />
          <p className="text-center text-xs text-text-muted">AI is preparing both sides of the argument...</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Topic</p>
            <p className="text-text-primary font-semibold">"{result.topic}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Side A - For */}
            <div className="glass rounded-2xl border border-accent-green/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-accent-green/10 flex items-center gap-2"
                style={{ background: 'rgba(16,185,129,0.08)' }}>
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-accent-green text-xs font-black tracking-wider uppercase">For</p>
                  <p className="text-text-primary text-sm font-semibold">{result.sideA.position}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {result.sideA.arguments.map((arg, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="text-accent-green font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-text-secondary text-sm leading-relaxed">{arg}</p>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-accent-green text-xs font-semibold italic">"{result.sideA.conclusion}"</p>
                </div>
              </div>
            </div>

            {/* Side B - Against */}
            <div className="glass rounded-2xl border border-accent-red/20 overflow-hidden">
              <div className="px-5 py-3 border-b border-accent-red/10 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.08)' }}>
                <span className="text-lg">❌</span>
                <div>
                  <p className="text-accent-red text-xs font-black tracking-wider uppercase">Against</p>
                  <p className="text-text-primary text-sm font-semibold">{result.sideB.position}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {result.sideB.arguments.map((arg, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="text-accent-red font-bold text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-text-secondary text-sm leading-relaxed">{arg}</p>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-accent-red text-xs font-semibold italic">"{result.sideB.conclusion}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict */}
          <div className="glass rounded-2xl border border-accent-purple/20 p-5"
            style={{ background: 'rgba(139,92,246,0.05)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-accent-purple" />
              <p className="text-accent-purple text-xs font-black tracking-wider uppercase">AI Verdict</p>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{result.verdict}</p>
          </div>

          <button onClick={() => generateDebate()}
            className="w-full py-3 border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>
      )}
    </div>
  )
}