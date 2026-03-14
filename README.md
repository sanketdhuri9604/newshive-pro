# ⚡ NewsHive Pro

<div align="center">

![NewsHive Pro](https://img.shields.io/badge/NewsHive-Pro-8B5CF6?style=for-the-badge&logo=lightning&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Groq AI](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)

**AI-Powered News Intelligence Platform**

*Real news. AI clarity. No noise.*

[🌐 Live Demo](https://newshive-pro.vercel.app) · [📸 Screenshots](#screenshots) · [🚀 Features](#features) · [🛠️ Tech Stack](#tech-stack)

</div>

---

## 📖 About

NewsHive Pro is a full-stack AI-powered news platform built for the modern reader. It aggregates real-time news from multiple sources and uses Groq's LLaMA AI to provide intelligent analysis — including fake news detection, sentiment analysis, bias detection, and smart summaries — all in one place.

Built as a college exhibition project to demonstrate the integration of modern web technologies with AI capabilities.

---

## ✨ Features

### 🤖 AI-Powered Analysis
- **AI Summary** — 3-point summary of any article instantly
- **Sentiment Analysis** — Positive/Negative/Neutral detection with confidence score
- **Credibility Score** — Fake news detection with detailed explainer
- **Bias Meter** — Left/Center/Right political bias detection
- **News Quiz** — Auto-generated quiz from article content
- **Translate Article** — Translate to 10+ Indian languages
- **Ask AI** — Chat with AI about any article
- **Debate Mode** — AI generates both sides of any argument
- **News Timeline** — Chronological story of any topic

### 📰 News Features
- **Multi-source Feed** — Real-time news from GNews & NewsAPI
- **Category Filtering** — 7+ news categories
- **Search with History** — Smart search with recent history
- **Related Articles** — AI-powered similar article suggestions
- **Breaking News Ticker** — Live scrolling headlines
- **For You Feed** — Personalized based on reading history & followed topics

### 👤 User Features
- **Reading History** — Track every article you've read
- **Save Articles** — Bookmark articles for later
- **Personal Notes** — Add private notes to any article
- **Reading Streak** — Daily streak tracker like Duolingo
- **Reading Goals** — Set daily & weekly reading targets
- **Topics Follow** — Follow topics to personalize your feed
- **Community Feed** — Share articles with the community
- **Like System** — Like community shares

### 🎮 Gamification
- **Badges & Achievements** — 15+ unlockable badges
- **Daily Challenge** — New article + quiz every day
- **Quiz Leaderboard** — Compete with other readers
- **Reading Analytics** — GitHub-style activity heatmap

### 💅 UI/UX
- **Collapsible Sidebar** — Clean left navigation
- **Multi-language Support** — English + 10 Indian languages
- **Mobile Responsive** — Works on all devices
- **Dark Theme** — Easy on the eyes
- **Onboarding Flow** — Smooth new user experience

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **AI** | Groq API (LLaMA 3.1) |
| **News API** | GNews API + NewsAPI |
| **Deployment** | Vercel |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |

---

## 🗄️ Database Schema

```
profiles          — User profiles (username, bio, topics, goals)
reading_history   — Articles read by each user
saved_news        — Bookmarked articles
comments          — Article discussions (AI moderated)
article_notes     — Personal notes on articles
community_shares  — Shared articles in community feed
community_likes   — Likes on community shares
quiz_scores       — Quiz results for leaderboard
user_badges       — Earned badges per user
daily_challenges  — Daily challenge articles
challenge_completions — User challenge completions
reading_goals     — Daily/weekly reading targets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key
- GNews API key

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/newshive-pro.git
cd newshive-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GNEWS_API_KEY=your_gnews_api_key
NEWS_API_KEY=your_newsapi_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
newshive-next/
├── app/
│   ├── (pages)/          # All page routes
│   │   ├── analytics/
│   │   ├── badges/
│   │   ├── challenge/
│   │   ├── chatbot/
│   │   ├── community/
│   │   ├── compare/
│   │   ├── debate/
│   │   ├── foryou/
│   │   ├── history/
│   │   ├── leaderboard/
│   │   ├── news/
│   │   ├── notes/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── saved/
│   │   ├── search/
│   │   ├── timeline/
│   │   └── trending/
│   └── api/
│       ├── ai/           # AI API routes (Groq)
│       └── news/         # News aggregation API
├── components/
│   ├── ai/               # AI components (QuizModal etc.)
│   ├── news/             # News components (NewsCard etc.)
│   ├── shared/           # Shared components (Navbar, Auth etc.)
│   └── ui/               # UI components
└── lib/                  # Utilities & configs
```

---

## 🤖 AI Features Deep Dive

NewsHive Pro uses **Groq's LLaMA 3.1** model for all AI features:

| Feature | Model | Avg Response Time |
|---------|-------|------------------|
| Summary | llama-3.1-8b-instant | ~1.2s |
| Sentiment | llama-3.1-8b-instant | ~0.8s |
| Fake Detection | llama-3.1-8b-instant | ~1.5s |
| Bias Analysis | llama-3.1-8b-instant | ~1.0s |
| Quiz Generation | llama-3.1-8b-instant | ~2.0s |
| Debate Mode | llama-3.1-8b-instant | ~3.0s |
| Timeline | llama-3.1-8b-instant | ~3.5s |

---

## 👨‍💻 Author

**Sanket** — College Exhibition Project

---

## 📄 License

This project is for educational purposes as part of a college exhibition.

---

<div align="center">
  <p>Built with ❤️ using Next.js, Supabase & Groq AI</p>
  <p>⚡ NewsHive Pro — Real news. AI clarity. No noise.</p>
</div>
