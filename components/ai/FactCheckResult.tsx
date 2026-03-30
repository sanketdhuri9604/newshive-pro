'use client'

// components/ai/FactCheckResult.tsx

import { ShieldCheck, ShieldX, ShieldAlert, ShieldQuestion, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export interface FactCheckClaim {
  claim: string
  verdict: 'true' | 'false' | 'misleading' | 'unverified'
  explanation: string
}

export interface FactCheckResultData {
  verdict: 'real' | 'fake' | 'misleading' | 'unverified'
  confidence: number
  summary: string
  claims: FactCheckClaim[]
  redFlags: string[]
  positiveSignals: string[]
}

const VERDICT_CONFIG = {
  real: {
    label: 'Likely Real',
    icon: ShieldCheck,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/25',
    bar: 'bg-green-400',
  },
  fake: {
    label: 'Likely Fake',
    icon: ShieldX,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/25',
    bar: 'bg-red-400',
  },
  misleading: {
    label: 'Misleading',
    icon: ShieldAlert,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/25',
    bar: 'bg-yellow-400',
  },
  unverified: {
    label: 'Unverified',
    icon: ShieldQuestion,
    color: 'text-text-muted',
    bg: 'bg-white/5',
    border: 'border-white/10',
    bar: 'bg-white/30',
  },
}

const CLAIM_VERDICT_CONFIG = {
  true: { label: 'True', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  false: { label: 'False', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  misleading: { label: 'Misleading', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  unverified: { label: 'Unverified', color: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10' },
}

export default function FactCheckResult({ result }: { result: FactCheckResultData }) {
  const [showClaims, setShowClaims] = useState(true)
  const config = VERDICT_CONFIG[result.verdict]
  const Icon = config.icon

  return (
    <div className="space-y-4">

      {/* Main Verdict Card */}
      <div className={`p-5 rounded-2xl border ${config.bg} ${config.border}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-xl ${config.bg} border ${config.border}`}>
            <Icon size={22} className={config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.bg} ${config.border} ${config.color}`}>
                {result.confidence}% confidence
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Confidence Level</span>
            <span>{result.confidence}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${config.bar}`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Red Flags + Positive Signals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Red Flags */}
        {result.redFlags.length > 0 && (
          <div className="p-4 rounded-xl bg-red-400/5 border border-red-400/15 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Red Flags</span>
            </div>
            <ul className="space-y-1.5">
              {result.redFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-red-400 mt-0.5 shrink-0">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Positive Signals */}
        {result.positiveSignals.length > 0 && (
          <div className="p-4 rounded-xl bg-green-400/5 border border-green-400/15 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-green-400" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Credibility Signals</span>
            </div>
            <ul className="space-y-1.5">
              {result.positiveSignals.map((signal, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="text-green-400 mt-0.5 shrink-0">•</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Claims Breakdown */}
      {result.claims.length > 0 && (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <button
            onClick={() => setShowClaims(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors"
          >
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Claims Breakdown ({result.claims.length})
            </span>
            {showClaims
              ? <ChevronUp size={14} className="text-text-muted" />
              : <ChevronDown size={14} className="text-text-muted" />
            }
          </button>

          {showClaims && (
            <div className="divide-y divide-white/5">
              {result.claims.map((claim, i) => {
                const cv = CLAIM_VERDICT_CONFIG[claim.verdict]
                return (
                  <div key={i} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="text-sm text-text-primary leading-snug flex-1">{claim.claim}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${cv.bg} ${cv.border} ${cv.color}`}>
                        {cv.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{claim.explanation}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-text-muted text-center">
        AI analysis — always verify with trusted sources
      </p>
    </div>
  )
}