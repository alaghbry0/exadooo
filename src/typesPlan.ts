// src/typesPlan.ts
import React from 'react'

export type NotificationType = 
  | 'info'
  | 'success' 
  | 'warning'
  | 'error'
  | 'invite';

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'exchange_success';

export interface ToastAction {
  text: string
  onClick: () => void
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  _seq?: number
  timestamp: number
  duration?: number
  invite_link?: string
  formatted_message?: string
  action?: ToastAction
}

// هذا النوع يمثل الخيار المحدد من قبل المستخدم لكل نوع اشتراك
export interface SubscriptionOption {
  id: number; // plan.id
  duration: string; // plan.name
  price: string; // السعر المعروض (مثل "99$")
  originalPrice?: string | null; // السعر الأصلي المعروض (مثل "120$")
  discountedPrice?: number; // السعر الرقمي بعد الخصم (للحسابات)
  discountPercentage?: number;
  hasDiscount: boolean;
  savings?: string; // نص التوفير مثل "وفر 20%"
  telegramStarsPrice?: number | null; // سعر النجوم
  duration_days: number; // للمساعدة في الترتيب والمنطق
}

export interface SelectedPlanForModal extends SubscriptionUIData {
  selectedOption: SubscriptionOption;
  planId: number; // هو selectedOption.id
  groupName?: string; // اسم المجموعة الأم (اختياري)
}
export type SubscriptionPlan = SubscriptionCard & {
  selectedOption: SubscriptionOption;
}


export interface ApiSubscriptionGroup {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// تعديل ApiSubscriptionType ليشمل group_id
export interface ApiSubscriptionType {
  id: number;
  name: string;
  description: string;
  features: string[];
  channel_id: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  usp: string;
  is_recommended?: boolean;
  terms_and_conditions: string[]; // تأكد أن هذا موجود، يبدو أنه مفقود من تعريفك الحالي
  group_id: number | null; // <-- إضافة مهمة
  sort_order: number; // <-- إضافة مهمة
}


export interface ApiSubscriptionPlan {
  id: number;
  name: string;
  price: number;
  original_price: number; // إضافة حقل السعر الأصلي
  duration_days: number;
  subscription_type_id: number;
  telegram_stars_price: number;
  created_at: string;
  is_active: boolean;
}

// تعديل SubscriptionCard ليشمل group_id
export interface SubscriptionCard {
  id: number;
  name: string;
  isRecommended: boolean;
  tagline: string;
  description: string;
  features: string[];
  primaryColor: string;
  accentColor: string;
  image_url: string | null;
  icon: React.FC; // أو string إذا كنت ستستخدم اسم الأيقونة من API
  backgroundPattern: string;
  usp: string;
  color: string;
  subscriptionOptions: SubscriptionOption[];
  group_id: number | null; // <-- إضافة مهمة
  terms_and_conditions: string[]; // أضفت هذا هنا لأنه منطقي أن يكون لكل نوع اشتراك شروطه
}


export interface ApiPublicPlan {
  id: number;
  subscription_type_id: number;
  name: string; // اسم الخطة مثل "شهري", "3 شهور"
  price: number | string;
  original_price?: number | string | null;
  telegram_stars_price?: number | null;
  duration_days: number;
}

export interface ApiPublicSubscriptionType {
  id: number;
  name: string;
  channel_id?: number | null; // أصبح اختياريًا لأن الخادم قد لا يرسله دائمًا
  group_id: number | null; // ID المجموعة التي ينتمي إليها النوع
  sort_order?: number;
  description?: string | null;
  image_url?: string | null;
  features: string[]; // المميزات كمصفوفة من النصوص
  usp?: string | null; // Unique Selling Proposition
  is_recommended?: boolean;
  terms_and_conditions: string[]; // الشروط والأحكام كمصفوفة من النصوص
  created_at?: string;
  subscription_options: ApiPublicPlan[]; // الخطط المتاحة لهذا النوع
}

export interface ApiPublicSubscriptionGroup {
  id: number | null; // معرّف المجموعة، null إذا كانت "مجموعة" للأنواع غير الممرتبطة
  name: string; // اسم المجموعة
  description?: string | null;
  image_url?: string | null;
  color?: string | null;
  icon?: string | null; // اسم الأيقونة (مثل 'category', 'star')
  sort_order?: number;
  display_as_single_card: boolean; // العامل الرئيسي لتحديد طريقة العرض
  subscription_types: ApiPublicSubscriptionType[]; // أنواع الاشتراكات داخل هذه المجموعة
}

// هذا النوع سيستخدم داخليًا في shop.tsx لتمثيل بيانات نوع الاشتراك بعد بعض المعالجة (مثل إضافة الأنماط)
export interface SubscriptionUIData extends ApiPublicSubscriptionType {
  tagline: string;
  primaryColor: string;
  accentColor: string;
  backgroundPattern: string;
  color: string;
  // iconComponent?: React.ElementType; // إذا كنت تريد تحويل اسم الأيقونة لمكون
}
