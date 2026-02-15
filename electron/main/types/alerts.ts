export interface Alert {
  type: string;
  templateId: string;
  id?: string;
  userId: string;
  username: string;
  userDisplayName: string;
  rewardId?: string;
  rewardTitle?: string;
  rewardCost?: number;
  userInput?: string;
  timestamp: Date;
  tier?: number;
  is_gift?: boolean;
  message?: string;
  total_months?: number;
  streak_months?: number;
  duration_months?: number;
  cumulative_total?: number;
  total?: number;
  followed_at?: Date;
  status?: 'unfulfilled' | 'fulfilled' | 'canceled';
}