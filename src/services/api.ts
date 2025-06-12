// services/api.js


// --- تعريف الأنواع التي ستأتي من نقطة النهاية الجديدة ---
export interface ApiPublicPlan {
  id: number;
  subscription_type_id: number;
  name: string;
  price: number | string; // السعر يمكن أن يكون رقمًا أو نصًا مثل "99.00"
  original_price?: number | string | null;
  telegram_stars_price?: number | null;
  duration_days: number;
}

export interface ApiPublicSubscriptionType {
  id: number;
  name: string;
  channel_id?: number | null;
  group_id: number | null;
  sort_order?: number;
  description?: string | null;
  image_url?: string | null;
  features: string[]; // تأكد أن الخادم يرسلها كمصفوفة Strings
  usp?: string | null;
  is_recommended?: boolean;
  terms_and_conditions: string[]; // تأكد أن الخادم يرسلها كمصفوفة Strings
  created_at?: string;
  subscription_options: ApiPublicPlan[]; // اسم الحقل كما هو مرسل من الخادم
}

export interface ApiPublicSubscriptionGroup {
  id: number | null; // يمكن أن يكون null للأنواع غير المجمعة
  name: string;
  description?: string | null;
  image_url?: string | null;
  color?: string | null;
  icon?: string | null;
  sort_order?: number;
  display_as_single_card: boolean;
  subscription_types: ApiPublicSubscriptionType[];
}

// دالة جديدة لجلب كل بيانات الاشتراكات العامة
export const getAllPublicSubscriptionData = async (): Promise<ApiPublicSubscriptionGroup[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/all-subscription-data`);
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Failed to fetch all subscription data.`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += ` ${errorData.error}`;
        }
      } catch { /* ignore parse error if response is not json */ }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data as ApiPublicSubscriptionGroup[];
  } catch (error) {
    console.error("getAllPublicSubscriptionData failed:", error);
    // يمكنك إعادة رمي الخطأ أو معالجته بشكل مختلف هنا
    if (error instanceof Error) {
        throw new Error(`Network or parsing error in getAllPublicSubscriptionData: ${error.message}`);
    }
    throw new Error('An unknown error occurred in getAllPublicSubscriptionData');
  }
};


export const getSubscriptionGroups = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/subscription-groups`);
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: Failed to fetch subscription groups.`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` ${errorData.error}`;
                }
            } catch {}
            throw new Error(errorMessage);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("getSubscriptionGroups failed:", error);
        throw error;
    }
};

// تعديل getSubscriptionTypes ليقبل group_id
export const getSubscriptionTypes = async (groupId: number | null = null) => {
    try {
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/subscription-types`;
        if (groupId !== null) {
            url += `?group_id=${groupId}`; // <-- تعديل هنا
        }
        const response = await fetch(url);
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: Failed to fetch subscription types.`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` ${errorData.error}`;
                }
            } catch {}
            throw new Error(errorMessage);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("getSubscriptionTypes failed:", error);
        throw error;
    }
};


export const getSubscriptionPlans = async () => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/subscription-plans`);
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: Failed to fetch subscription plans.`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` ${errorData.error}`;
                }
            } catch { // تم حذف parseError غير المستخدم
                // في حال تعذر تحليل الاستجابة، يتم الاحتفاظ برسالة الخطأ الافتراضية
            }
            throw new Error(errorMessage);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("getSubscriptionPlans failed:", error);
        throw error;
    }
};



export const getUserSubscriptions = async (telegramId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/subscriptions?telegram_id=${telegramId}`);
    if (!res.ok) throw new Error('فشل في جلب الاشتراكات');
    return res.json();
};

export const fetchBotWalletAddress = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/wallet`);
    if (response.ok) {
      const data = await response.json();
      return data.wallet_address;
    } else {
      console.error("❌ Failed to fetch wallet address");
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching wallet address:", error);
    return null;
  }
};


import axios from 'axios'

export const fetchUserPayments = async (params: {
  telegramId: number
  page?: number
  status?: string
  startDate?: string
  endDate?: string
}) => {
  const response = await axios.get('${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/payments', { params })
  return {
    data: response.data.results,
    pagination: response.data.pagination
  }
}