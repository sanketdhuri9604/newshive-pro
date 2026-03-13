export interface Article {
  title: string
  description: string
  url: string
  urlToImage?: string | null
  publishedAt: string
  source: { name: string }
  content?: string
}

export interface SavedArticle {
  id: string
  user_id: string
  title: string
  url: string
  image_url?: string | null
  description?: string
  source?: string
  created_at: string
}

export interface Profile {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
}

export interface Comment {
  id: string
  news_url: string
  content: string
  user_id: string
  is_toxic: boolean
  created_at: string
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  reason?: string
}

export interface CredibilityResult {
  credibilityScore: number
  verdict: string
  reason: string
}

export interface BiasResult {
  bias: 'left' | 'center' | 'right'
  confidence: number
  reason?: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
}
