'use client'
import { useState, useEffect, useCallback } from "react";
import { useTelegram } from "../context/TelegramContext";

export const useTelegramPayment = () => {
  const { telegramId } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'cancelled' | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) return;

    const tgWebApp = window.Telegram.WebApp;

    // ✅ متابعة الدفع بعد إغلاق نافذة الفاتورة
    const handleInvoiceClosed = () => {
      setLoading(false);

      // ✅ التحقق من الدفع عبر `paymentStatus`
      if (paymentStatus === 'pending') {
        console.warn("❌ الدفع فشل أو تم إلغاؤه.");
        setError("فشلت عملية الدفع أو تم إلغاؤها.");
        setPaymentStatus('failed');
      }
    };

    // ✅ التأكد من أن `onEvent` موجود قبل استخدامه
    tgWebApp?.onEvent?.("invoiceClosed", handleInvoiceClosed);

    return () => {
      tgWebApp?.offEvent?.("invoiceClosed", handleInvoiceClosed);
    };
  }, [paymentStatus]);

  const handleTelegramStarsPayment = useCallback(async (
    planId: number,
    price: number,
    onSuccess: () => void
  ) => {
    if (!telegramId || !window.Telegram?.WebApp) {
      alert("❗ يرجى فتح التطبيق داخل تليجرام");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('pending');

      const payload = JSON.stringify({
        planId,
        userId: telegramId
      });

      const providerToken = process.env.NEXT_PUBLIC_TELEGRAM_PROVIDER_TOKEN; // ✅ استخدام المتغير البيئي

      if (!providerToken) {
        throw new Error("❌ Telegram Provider Token غير مضبوط!");
      }

      window.Telegram.WebApp.openInvoice?.(
        {
          chat_id: telegramId,
          title: "اشتراك VIP",
          description: "اشتراك شهري في الخدمة المميزة",
          currency: "XTR",
          prices: [{ label: "الاشتراك", amount: price * 100 }],
          payload: payload,
          provider_token: providerToken // ✅ حماية المفتاح
        },
        (status) => {
          if (status === 'paid') {
            console.log("✅ تم الدفع بنجاح");
            setPaymentStatus('paid');
            onSuccess();
          } else {
            console.warn(`❌ حالة الدفع: ${status}`);
            setPaymentStatus(status);
            setError(`فشلت عملية الدفع (${status})`);
          }
        }
      );

    } catch (error) {
      console.error("❌ خطأ في الدفع:", error);
      setError(error instanceof Error ? error.message : "خطأ غير متوقع");
      setPaymentStatus('failed');
      alert("فشلت عملية الدفع، يرجى المحاولة لاحقًا");
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  return {
    handleTelegramStarsPayment,
    paymentState: {
      loading,
      error,
      paymentStatus,
      resetError: () => setError(null),
      resetPaymentStatus: () => setPaymentStatus(null) // ✅ إعادة ضبط حالة الدفع
    }
  };
};
