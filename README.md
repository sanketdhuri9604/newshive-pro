# 📰 NewsHive Pro — Next.js

AI-powered news intelligence platform. Built for Eternia 🏆

## ✨ Features
- 🤖 **7 AI features** powered by Groq (fastest LLM inference)
- 📰 **News from RSS + NewsAPI** — zero limits on RSS feeds
- 🔥 **Reactions, Comments** with AI toxicity filter
- 💬 **Real-time chat** via Supabase
- 🆚 **News Comparison** — side-by-side bias analysis
- 📊 **Trending Analysis** — AI explains why topics are viral
- 🧠 **Quiz Generator** — test knowledge from any article
- 🌐 **Translation** to 8 languages

## 🛠️ Tech Stack (All Free Tier)
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Next.js 14 | Full-stack framework | Free |
| Vercel | Deployment | Free |
| Supabase | DB + Auth + Realtime | 500MB free |
| Groq | AI (LLaMA 3.3) | ~14k req/day free |
| Cloudinary | Image upload | 25GB free |
| RSS Feeds | News (BBC etc.) | Unlimited free |
| Resend | Email newsletter | 3k/month free |

## 🚀 Setup

### 1. Clone & Install
```bash
git clone <your-repo>
cd newshive-pro
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in your keys
```

### 3. Supabase Setup
- Run `supabase-migration-001.sql` (existing schema)
- Run `supabase-migration-002.sql` (new tables: reactions, reading_history, newsletter_subs)

### 4. Get API Keys (all free)
- **Groq**: https://console.groq.com → API Keys
- **NewsAPI**: https://newsapi.org/register
- **Cloudinary**: https://cloudinary.com (use existing account)
- **Resend**: https://resend.com

### 5. Run Dev Server
```bash
npm run dev
# Open http://localhost:3000
```

### 6. Deploy to Vercel
```bash
npx vercel
# Set all env variables in Vercel dashboard
```

## 📁 Structure
```
app/
├── page.tsx              ← Home feed
├── (auth)/               ← Login, Register
├── (main)/news/          ← Article detail + AI
├── (main)/compare/       ← News comparison
├── (main)/trending/      ← Trending analysis
├── (main)/chatbot/       ← AI chatbot
├── (main)/saved/         ← Bookmarks
├── api/                  ← All backend routes
components/
├── news/                 ← NewsCard, Feed
├── ai/                   ← QuizModal, AI components
├── ui/                   ← ReactionBar, Comments
└── shared/               ← Navbar, AuthProvider
lib/
├── groq.ts               ← All AI functions
├── supabase.ts           ← Client
└── cloudinary.ts         ← Image upload
```

## 🤖 Groq Model Strategy
| Model | Used For |
|-------|---------|
| `llama-3.3-70b-versatile` | Summary, Chatbot, Translation, Comparison, Trending |
| `llama-3.1-8b-instant` | Sentiment, Fake Detect, Bias, Quiz, Toxicity, Reading Time |
