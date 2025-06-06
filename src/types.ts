// src/types.ts
export type UserProfile = {
  telegram_id?: number;
  full_name?: string;
  username?: string | null;
  profile_photo?: string;
  join_date?: string | null;
  subscriptions?: Subscription[];
};

export interface Subscription {
  id: number
  name: string
  price: string | number
  selectedOption?: string | null
  description?: string
  features?: string[]
  terms_and_conditions: string[];
  animation?: object
  subscriptionOptions?: string[]
  color?: string
  expiry?: string
  start_date?: string
  invite_link?: string
  progress?: number
  status: 'نشط' | 'منتهي' | 'unknown'
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[]
  meta?: {
    total: number
    active: number
    expired: number
  }
}
