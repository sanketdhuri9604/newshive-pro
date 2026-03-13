'use client'

import { useState } from 'react'
import { Zap, Trophy } from 'lucide-react'
import { useLang } from '@/components/shared/LangProvider'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Question {
  question: string
  options: string[]
  correct: number
}

export default function QuizModal({ title, description, content, articleUrl, onComplete, allowRetry = true }: {
  title: string
  description?: string
  content?: string
  articleUrl?: string
  onComplete?: (score: number, total: number) => void
  allowRetry?: boolean
}) {
  const { t } = useLang()
  const { user, profile } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)

  const generateQuiz = async () => {
    setLoading(true)
    setAnswers({})
    setSubmitted(false)
    setScoreSaved(false)
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, content }),
      })
      const data = await res.json()
      if (data.questions) setQuestions(data.questions)
      else toast.error(t('ai.aiBusy'))
    } catch { toast.error(t('ai.aiBusy')) }
    finally { setLoading(false) }
  }

  const handleAnswer = (qIndex: number, aIndex: number) => {
    if (submitted) return
    setAnswers(p => ({ ...p, [qIndex]: aIndex }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Answer all questions first!')
      return
    }
    setSubmitted(true)
    const finalScore = questions.filter((q, i) => answers[i] === q.correct).length

    // Save score to Supabase
    if (user && !scoreSaved) {
      try {
        const { error } = await supabase.from('quiz_scores').insert({
          user_id: user.id,
          username: profile?.username || user.email?.split('@')[0] || 'anonymous',
          score: finalScore,
          total: questions.length,
          article_url: articleUrl || '',
          article_title: title,
          played_at: new Date().toISOString(),
        })
        if (!error) {
          setScoreSaved(true)
          toast.success('Score saved to leaderboard! 🏆')
          onComplete?.(finalScore, questions.length)
        }
      } catch {}
    }
  }

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0

  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
        <p className="text-text-muted text-xs text-center">{t('quiz.generating')}</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <button
        onClick={generateQuiz}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 text-accent-purple text-sm rounded-xl transition-all font-medium"
      >
        <Zap size={14} /> {t('ai.takeQuiz')}
      </button>
    )
  }

  return (
    <div className="space-y-4">
      {submitted && (
        <div className={`p-4 rounded-xl border text-sm font-medium text-center ${
          score === questions.length ? 'bg-green-400/10 border-green-400/20 text-green-400' :
          score >= questions.length / 2 ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
          'bg-red-400/10 border-red-400/20 text-red-400'
        }`}>
          <p className="text-lg font-bold mb-1">{score}/{questions.length}</p>
          <p>{
            score === questions.length ? t('quiz.perfect') :
            score >= questions.length / 2 ? t('quiz.goodJob') :
            t('quiz.tryAgain')
          }</p>
          {scoreSaved && (
            <p className="text-xs mt-2 flex items-center justify-center gap-1 opacity-80">
              <Trophy size={11} /> Score saved to leaderboard!
            </p>
          )}
          {!user && (
            <p className="text-xs mt-2 opacity-70">Login to save your score to the leaderboard!</p>
          )}
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="text-text-primary text-sm font-medium">{qi + 1}. {q.question}</p>
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi
              const isCorrect = submitted && oi === q.correct
              const isWrong = submitted && isSelected && oi !== q.correct
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(qi, oi)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    isCorrect ? 'bg-green-400/15 border-green-400/40 text-green-400' :
                    isWrong ? 'bg-red-400/15 border-red-400/40 text-red-400' :
                    isSelected ? 'bg-accent-purple/15 border-accent-purple/40 text-accent-purple' :
                    'border-white/5 text-text-secondary hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="font-mono mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {!submitted && questions.length > 0 && (
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 bg-accent-purple hover:bg-accent-purple/90 text-white text-sm font-medium rounded-xl transition-all hover:shadow-glow-purple"
        >
          {t('quiz.submitAnswers')}
        </button>
      )}

      {submitted && allowRetry && (
        <button
          onClick={generateQuiz}
          className="w-full py-2.5 border border-white/10 text-text-secondary text-sm rounded-xl hover:bg-white/5 transition-all"
        >
          Try Another Quiz
        </button>
      )}
    </div>
  )
}