// Badge definitions
export const BADGES = {
  // Reading badges
  first_read: { id: 'first_read', label: 'First Read', emoji: '📖', desc: 'Read your first article', color: 'accent-purple' },
  reader_10: { id: 'reader_10', label: 'Bookworm', emoji: '🐛', desc: 'Read 10 articles', color: 'accent-cyan' },
  reader_50: { id: 'reader_50', label: 'News Junkie', emoji: '📰', desc: 'Read 50 articles', color: 'accent-blue' },
  reader_100: { id: 'reader_100', label: 'Century Club', emoji: '💯', desc: 'Read 100 articles', color: 'accent-yellow' },
  reader_500: { id: 'reader_500', label: 'News Legend', emoji: '🏆', desc: 'Read 500 articles', color: 'accent-orange' },

  // Streak badges
  streak_3: { id: 'streak_3', label: 'On Fire', emoji: '🔥', desc: '3 day reading streak', color: 'accent-orange' },
  streak_7: { id: 'streak_7', label: 'Week Warrior', emoji: '⚡', desc: '7 day reading streak', color: 'accent-yellow' },
  streak_30: { id: 'streak_30', label: 'Iron Reader', emoji: '🦾', desc: '30 day reading streak', color: 'accent-pink' },

  // Quiz badges
  first_quiz: { id: 'first_quiz', label: 'Quiz Starter', emoji: '🧩', desc: 'Complete your first quiz', color: 'accent-purple' },
  quiz_perfect: { id: 'quiz_perfect', label: 'Perfect Score', emoji: '🎯', desc: 'Get 5/5 on a quiz', color: 'accent-green' },
  quiz_master: { id: 'quiz_master', label: 'Quiz Master', emoji: '🧠', desc: 'Complete 10 quizzes', color: 'accent-cyan' },

  // Community badges
  first_share: { id: 'first_share', label: 'Sharer', emoji: '🎉', desc: 'Share your first article', color: 'accent-pink' },
  first_note: { id: 'first_note', label: 'Thinker', emoji: '💭', desc: 'Save your first note', color: 'accent-yellow' },

  // Special
  early_adopter: { id: 'early_adopter', label: 'Early Adopter', emoji: '🚀', desc: 'One of the first users', color: 'accent-purple' },
  challenge_complete: { id: 'challenge_complete', label: 'Challenger', emoji: '🎮', desc: 'Complete a daily challenge', color: 'accent-orange' },
  goal_crusher: { id: 'goal_crusher', label: 'Goal Crusher', emoji: '💪', desc: 'Hit your daily reading goal', color: 'accent-green' },
} as const

export type BadgeId = keyof typeof BADGES

export function checkBadges(stats: {
  totalRead: number
  streak: number
  totalQuizzes: number
  perfectQuizzes: number
  totalShares: number
  totalNotes: number
  challengesCompleted: number
  goalHit: boolean
}): BadgeId[] {
  const earned: BadgeId[] = []

  if (stats.totalRead >= 1) earned.push('first_read')
  if (stats.totalRead >= 10) earned.push('reader_10')
  if (stats.totalRead >= 50) earned.push('reader_50')
  if (stats.totalRead >= 100) earned.push('reader_100')
  if (stats.totalRead >= 500) earned.push('reader_500')

  if (stats.streak >= 3) earned.push('streak_3')
  if (stats.streak >= 7) earned.push('streak_7')
  if (stats.streak >= 30) earned.push('streak_30')

  if (stats.totalQuizzes >= 1) earned.push('first_quiz')
  if (stats.perfectQuizzes >= 1) earned.push('quiz_perfect')
  if (stats.totalQuizzes >= 10) earned.push('quiz_master')

  if (stats.totalShares >= 1) earned.push('first_share')
  if (stats.totalNotes >= 1) earned.push('first_note')
  if (stats.challengesCompleted >= 1) earned.push('challenge_complete')
  if (stats.goalHit) earned.push('goal_crusher')

  return earned
}