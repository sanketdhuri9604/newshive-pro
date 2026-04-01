<div align="center">
  
  # ⚡ NewsHive Pro
  
  **The Next-Generation AI-Powered News Intelligence Platform**

  [![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Now-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://newshive-pro.vercel.app/)
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)
  [![Multilingual](https://img.shields.io/badge/Multilingual-10%2B_Languages-059669?style=for-the-badge&logo=googletranslate&logoColor=white)](#)

  ![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![Groq AI](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge)

  <p align="center">
    <em>Solving information overload, fighting fake news, and rewarding knowledge through AI-driven clarity, gamification, and personalization.</em>
  </p>
</div>

---

## 🌟 The Vision

In a world overwhelmed by clickbait, bias, and misinformation, **NewsHive Pro** stands out as a beacon of clarity. It aggregates real-time news and supercharges it with **Groq's hyper-fast LLaMA 3.1 AI**, offering multi-dimensional analysis, fact-checking, and interactive learning. 

Whether you're exploring localized news on an interactive map, translating breaking stories into your native language, or competing on the daily quiz leaderboard, NewsHive Pro turns news consumption into a smart, engaging, and personalized habit.

---

## 🚀 Key Highlights

<div align="center">
  <table>
    <tr>
      <td align="center"><b>🤖 AI First</b><br>Powered by Groq's LLaMA 3.1 for instant summaries, debate generation, and fake news detection.</td>
      <td align="center"><b>📱 PWA Built</b><br>Installable web app with offline support, intelligent caching, and blazing fast performance.</td>
      <td align="center"><b>🌍 Multilingual</b><br>Breaking language barriers with seamless translation into 10+ Indian languages.</td>
    </tr>
    <tr>
      <td align="center"><b>🗺️ Spatial News</b><br>Interactive Leaflet maps to discover region-specific and hyper-local breaking news.</td>
      <td align="center"><b>🎯 Gamified</b><br>Reading streaks, daily challenges, and badges to build healthy reading habits.</td>
      <td align="center"><b>💅 Premium UI/UX</b><br>Distraction-free, fully responsive dark-mode interface that feels like a top-tier SaaS.</td>
    </tr>
  </table>
</div>

---

## 📸 Feature Gallery



### 📰 News Feed — Today's Briefing


---

### 🤖 AI Chat Interface


---

### ⚖️ Debate Mode


---

### 🛡️ Fact Check Tool


---

### 🗺️ Spatial News Map (Leaflet.js)


---

### ⚔️ Daily Challenge


---

### ⏳ News Timeline


---

### 🏆 Badges & Achievements


---

### 🤝 Community Feed


---

### 📊 Analytics Dashboard


</div>

---

## 🔥 Core Features

### 1️⃣ AI Analysis Engine (The Brain)

- 📝 **AI Summary:** 3-point concise breakdown of any long-form article.
- 🎭 **Sentiment Analysis:** Classifies news tone (Positive/Negative/Neutral) with confidence scores.
- ⚖️ **Bias Detection:** Analyzes political/narrative leaning (Left/Center/Right).
- 🛡️ **Fake News Detector:** Evaluates credibility and provides detailed reasoning & scoring.
- 🔍 **Fact-Check Tool:** Paste any URL or text to instantly verify its authenticity.
- 🗣️ **Debate Mode:** Automatically generates both sides of an argument for balanced perspectives.
- 💬 **Ask AI:** Interactive chat interface to interrogate the article and ask questions.
- ⏳ **News Timeline:** Traces the chronological evolution of ongoing stories.
- 🧠 **Quiz Generator:** AI dynamically generates an MCQ quiz directly from the article's content.
- 🌐 **Translation Engine:** Translates complex articles into 10+ regional Indian languages.

### 2️⃣ Progressive Web App (PWA) & Performance

- 📲 **Installable:** Add to Home Screen like a native mobile app for instantaneous access.
- 📶 **Offline Support:** Read cached articles even without an internet connection.
- ⚡ **Optimized:** High Lighthouse scores, debounced API calls, SSR implementations, and optimized AI queries.

### 3️⃣ Location-Based News (Unique)

- 🗺️ **Interactive Maps:** Built with Leaflet.js to show news geographically.
- 📍 **Region-Specific Discovery:** Click on any state or region to instantly view hyper-local news.

### 4️⃣ Deep Personalization & Aggregation

- 📰 **Multi-Source Fetching:** Real-time data streams from GNews & NewsAPI.
- 🎯 **"For You" Feed:** AI curates a dynamic timeline based on your reading history, time spent, and followed topics.
- 🔖 **User Dashboard:** Save articles, add private notes, track reading history, manage preferences.

### 5️⃣ Gamification & Community

- 📈 **Reading Streaks & Goals:** Track your daily consistency (Duolingo-style).
- 🏆 **Badges & Achievements:** Over 15+ unlockable rewards for active learning.
- 📊 **Activity Heatmap:** GitHub-style contribution graph for your reading habits.
- ⚔️ **Daily Challenges:** Complete the daily article challenge and top the Quiz Leaderboards.
- 🤝 **Community Hub:** Share articles, drop likes, and engage in AI-moderated discussions.

---

## 🛠️ Technology Stack

| Architecture | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router), React, TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Clean Minimalist Dark Mode |
| **Backend / API** | Next.js Serverless Routes, GNews API, NewsAPI |
| **Database & Auth** | Supabase (PostgreSQL), Supabase Auth |
| **AI Processing** | Groq API (LLaMA 3.1) for ultrafast inference & lowest latency |
| **Mapping & Spatial** | Leaflet.js for geographic news visualization |
| **Deployment & Hosting** | Vercel (Edge-optimized platform) |

---

## 🗄️ Database Architecture

A robust, relational PostgreSQL schema powered by Supabase:

- `profiles` — User preferences, followed topics, bio
- `reading_history` / `saved_news` / `article_notes` — Personal user data
- `community_shares` / `community_likes` / `comments` — Social engagement & interactions
- `quiz_scores` / `user_badges` / `daily_challenges` / `challenge_completions` — Gamification engine
- `reading_goals` — Goal tracking metrics & analytics

---

## 🚀 Getting Started

Experience it live at **[newshive-pro.vercel.app](https://newshive-pro.vercel.app/)**, or run it locally:

### Prerequisites
- Node.js 18+
- Supabase Project & Database
- Groq API Key
- GNews API Key & NewsAPI Key

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/newshive-pro.git
cd newshive-pro

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
```

**Environment Variables (`.env.local`):**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GNEWS_API_KEY=your_gnews_api_key
NEWS_API_KEY=your_newsapi_key
```

### Run Locally
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start exploring.

---

## 🏆 Why NewsHive Pro?

NewsHive Pro isn't just another RSS reader or aggregator. It is a **full-fledged SaaS-grade product** built to solve modern media's biggest problems — misinformation and information fatigue. By combining **blazing fast AI processing**, **gamified learning**, and **PWA accessibility**, NewsHive Pro aims to make society smarter, one article at a time.

<div align="center">
  <br>
  <b>Built with passion to redefine how we consume information.</b>
  <p><i>Made for the Future. ⚡</i></p>
</div>
