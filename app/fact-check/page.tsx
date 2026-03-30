'use client'

// app/fact-check/page.tsx

import { useState } from 'react'
import { Shield, Link2, FileText, X, Loader2, AlertCircle } from 'lucide-react'
import FactCheckResult, { type FactCheckResultData } from '@/components/ai/FactCheckResult'

type InputMode = 'text' | 'url'

export default function FactCheckPage() {
  const [mode, setMode] = useState<InputMode>('text')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FactCheckResultData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClear = () => {
    setInput('')
    setResult(null)
    setError(null)
  }

  const handleModeSwitch = (m: InputMode) => {
    setMode(m)
    setInput('')
    setResult(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!input.trim() || input.trim().length < 20) {
      setError('Please enter more content to analyze (at least 20 characters).')
      return
    }

    if (mode === 'url') {
      try { new URL(input.trim()) }
      catch { setError('Please enter a valid URL (e.g. https://example.com/article)'); return }
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/ai/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim(), type: mode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Analysis failed. Please try again.')
        return
      }

      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-purple/15 border border-accent-purple/25 mb-2">
            <Shield size={22} className="text-accent-purple" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Fact Checker</h1>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Paste any news article or URL — our AI will analyze it for credibility, extract key claims, and flag red flags.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">

          {/* Mode Toggle */}
          <div className="flex border-b border-white/8">
            {(['text', 'url'] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'text-accent-purple bg-accent-purple/8 border-b-2 border-accent-purple'
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/3'
                }`}
              >
                {m === 'text' ? <FileText size={14} /> : <Link2 size={14} />}
                {m === 'text' ? 'Paste Text' : 'Enter URL'}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 space-y-3">
            {mode === 'text' ? (
              <div className="relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Paste the news article content here..."
                  rows={7}
                  className="w-full bg-transparent text-text-primary text-sm placeholder:text-text-muted resize-none outline-none leading-relaxed"
                />
                {input && (
                  <button
                    onClick={handleClear}
                    className="absolute top-0 right-0 p-1 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative flex items-center gap-2">
                <Link2 size={14} className="text-text-muted shrink-0" />
                <input
                  type="url"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="https://example.com/news-article"
                  className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-muted outline-none"
                />
                {input && (
                  <button onClick={handleClear} className="text-text-muted hover:text-text-secondary transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Character count for text mode */}
            {mode === 'text' && input.length > 0 && (
              <p className="text-xs text-text-muted">{input.length} characters</p>
            )}
          </div>

          {/* Footer with submit */}
          <div className="px-4 pb-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-glow-purple"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield size={15} />
                  Check for Fake News
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-400/8 border border-red-400/20">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            <div className="skeleton h-28 rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
            </div>
            <div className="skeleton h-32 rounded-xl" />
            <p className="text-xs text-text-muted text-center">AI is analyzing the content...</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && <FactCheckResult result={result} />}

      </div>
    </div>
  )
}