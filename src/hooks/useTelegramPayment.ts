'use client';
import { useState, useCallback } from "react";
import { useTelegram } from "../context/TelegramContext";

type PaymentResponse = {
  paymentToken?: string;
  error?: string;
};

export const useTelegramPayment = () => {
  const { telegramId } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'processing' | null>(null);

  const handleTelegramStarsPayment = useCallback(async (
    planId: number,
    price: number,
    fullName: string,
    telegramUsername: string
  ): Promise<PaymentResponse> => {
    if (typeof window === "undefined" || !window.Telegram?.WebApp) {
      alert("❗ يرجى فتح التطبيق داخل تليجرام");
      return { error: "Telegram WebApp not available" };
    }

    if (!telegramId || !planId) {
      const errorMsg = "❌ بيانات المستخدم أو الخطة غير صحيحة!";
      setError(errorMsg);
      return { error: errorMsg };
    }

    try {
      setLoading(true);
      setError(null);
      setPaymentStatus('pending');

      // 1. إنشاء payment_token باستخدام عنوان الباك إند من متغيرات البيئة
      const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/create-telegram-payment-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId })
      });

      if (!tokenResponse.ok) {
        throw new Error('❌ فشل في إنشاء رمز الدفع');
      }

      const { payment_token } = await tokenResponse.json();
      if (!payment_token) {
        throw new Error('❌ لم يتم استلام رمز الدفع من الخادم');
      }

      // 2. إنشاء الفاتورة مع البيانات الجديدة (full_name و username)
      const invoiceResponse = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: Number(telegramId),
          plan_id: planId,
          amount: price,
          payment_token,
          full_name: fullName,
          username: telegramUsername
        })
      });

      if (!invoiceResponse.ok) {
        throw new Error("❌ فشل في إنشاء الفاتورة!");
      }

      const invoiceData = await invoiceResponse.json();
      if (!invoiceData.invoice_url) {
        throw new Error("❌ رابط الفاتورة غير موجود في الاستجابة");
      }

      // 3. فتح واجهة الدفع باستخدام واجهة Telegram WebApp
      return new Promise<PaymentResponse>((resolve) => {
        if (!window.Telegram?.WebApp?.openInvoice) {
          const errorMsg = "❌ نظام الدفع غير متاح";
          setError(errorMsg);
          resolve({ error: errorMsg });
          return;
        }

        window.Telegram.WebApp.openInvoice(invoiceData.invoice_url, (status: string) => {
          if (status === "paid") {
            setTimeout(() => {
              setPaymentStatus("processing");
              console.log("✅ تم الدفع بنجاح!");
              resolve({ paymentToken: payment_token });
            }, 1000);
          } else {
            setPaymentStatus('failed');
            const errorMsg = "❌ الدفع لم يتم بنجاح";
            setError(errorMsg);
            resolve({ error: errorMsg });
          }
          setLoading(false);
        });
      });
    } catch (error) {
      setLoading(false);
      console.error("❌ خطأ غير متوقع:", error);
      const errorMsg = error instanceof Error ? error.message : "❌ حدث خطأ غير معروف";
      setError(errorMsg);
      return { error: errorMsg };
    }
  }, [telegramId]);

  return {
    handleTelegramStarsPayment,
    paymentState: {
      loading,
      error,
      paymentStatus,
      resetError: () => setError(null)
    }
  };
};
