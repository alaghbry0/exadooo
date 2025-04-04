// في ملف src/types/payment.d.ts
export type PaymentStatus =
  | 'idle'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed';

export interface SubscriptionPlanExtended extends SubscriptionPlan {
  selectedOption: {
    id: number;
    price: string;
    duration: string;
    telegramStarsPrice: number;
  };
  features: string[];
}

