export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  description: string;
  bestFor: string;
  features: string[];
  isMostPopular?: boolean;
  badgeLabel?: string;
}

export const MEMBERSHIP_PLANS: Record<string, MembershipPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    billingCycle: 'month',
    description: 'Perfect for exploring NexSkill and trying out courses.',
    bestFor: 'Casual learners and those getting started',
    features: [
      'Access to all free courses',
      'Community discussions',
      'Limited AI Coach (10 queries/month)',
      'Basic progress tracking',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingCycle: 'month',
    description: 'Unlock premium courses and advanced learning tools.',
    bestFor: 'Dedicated learners building new skills',
    features: [
      'Everything in Free, plus:',
      'Full access to premium courses',
      'Unlimited AI Coach access',
      '2 coaching credits per month',
      'Course certificates',
      'Live classes access',
      'Download courses offline',
    ],
    isMostPopular: true,
    badgeLabel: 'Most Popular',
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 79,
    billingCycle: 'month',
    description: 'Premium experience with career services and priority support.',
    bestFor: 'Serious professionals and career changers',
    features: [
      'Everything in Pro, plus:',
      '10 coaching credits per month',
      'Blockchain-verified certificates',
      'Priority support (24h response)',
      'Career services & job placement',
      'Resume reviews & interview prep',
      'Exclusive masterclasses',
    ],
  },
};

export const PLANS_LIST = Object.values(MEMBERSHIP_PLANS);

export function getPlan(id: string): MembershipPlan {
  return MEMBERSHIP_PLANS[id] || MEMBERSHIP_PLANS.free;
}
