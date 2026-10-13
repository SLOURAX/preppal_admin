export type AnalyticsPeriod = "7" | "30" | "90" | "180" | "0";

export interface AdminAnalytics {
  generatedAt: string;
  period: AnalyticsPeriod;
  overview: {
    kpis: {
      totalUsers: number;
      activeToday: number;
      newUsers: number;
      churnRate: number;
      totalQuizzes: number;
      quizzesToday: number;
      avgSessionDuration: number;
      aiHintsUsed: number;
      totalXpIssued: number;
      coinsCirculating: number;
      pendingWithdrawals: number;
      referrals: number;
    };
    growth: {
      activeUsers: Array<{ date: string; value: number }>;
      registrations: Array<{ date: string; value: number }>;
      quizzes: Array<{ date: string; value: number }>;
    };
  };
  engagement: {
    planDistribution: Array<{ plan: string; users: number; pct: number }>;
    topUsers: Array<{
      id: string;
      name: string;
      xp: number;
      quizzes: number;
      plan: string;
    }>;
    referrals: {
      total: number;
      activated: number;
      activationRate: number;
      rewardsRedeemed: number;
    };
  };
  learning: {
    subjectAccuracy: Array<{
      subject: string;
      accuracy: number;
      attempts: number;
    }>;
    examPopularity: Array<{
      exam: string;
      quizzes: number;
      users: number;
      avgScore: number;
    }>;
    hourlyActivity: number[];
    aiUsage: {
      total: number;
      bySubject: Array<{ subject: string; hints: number }>;
      segments: { timed: number; untimed: number };
    };
  };
  finance: {
    totalDeposited: number;
    totalWithdrawn: number;
    netFlow: number;
    coinsCirculating: number;
    monthly: Array<{
      month: string;
      deposits: number;
      withdrawals: number;
    }>;
  };
  health: {
    questionsFlagged: number;
    duplicateReports: number;
    incorrectAnswerReports: number;
    suspiciousAccounts: number;
    averageQuestionAccuracy: number;
  };
}
