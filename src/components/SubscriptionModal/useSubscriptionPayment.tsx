'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useTelegramPayment } from '@/hooks/useTelegramPayment'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { useUserStore } from '@/stores/zustand/userStore'
import { handleTonPayment } from '@/utils/tonPayment'
import { useTelegram } from '@/context/TelegramContext'
import type { SubscriptionPlan } from '@/typesPlan'
import { PaymentStatus } from '@/types/payment'
import { useQueryClient } from '@tanstack/react-query'
import { useTariffStore } from '@/stores/zustand'
import { showToast } from '@/components/ui/Toast'

interface ExchangeDetails {
  depositAddress: string
  amount: string
  network: string
  paymentToken: string
  planName?: string
}

export const useSubscriptionPayment = (plan: SubscriptionPlan | null, onSuccess: () => void) => {
  const { handleTelegramStarsPayment } = useTelegramPayment()
  const { telegramId } = useTelegram()
  const { telegramUsername, fullName } = useUserStore()
  const [tonConnectUI] = useTonConnectUI()
  const queryClient = useQueryClient()

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle')
  const [loading, setLoading] = useState(false)
  const [exchangeDetails, setExchangeDetails] = useState<ExchangeDetails | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const paymentSessionRef = useRef<{
    paymentToken?: string
    planId?: string
  }>({})

  // تنظيف بيانات جلسة الدفع
  const cleanupPaymentSession = useCallback(() => {
    localStorage.removeItem('paymentData')
    paymentSessionRef.current = {}
    setExchangeDetails(null)
  }, [])

  // إعادة تعيين حالة الدفع
  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus('idle')
    cleanupPaymentSession()

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [cleanupPaymentSession])

  // عند نجاح الدفع
  const handlePaymentSuccess = useCallback(() => {
    cleanupPaymentSession()
    setPaymentStatus('success')
    queryClient.invalidateQueries({
      queryKey: ['subscriptions', telegramId || '']
    })
    onSuccess()

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [cleanupPaymentSession, queryClient, telegramId, onSuccess])

  // منع إغلاق الصفحة أثناء المعالجة
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentStatus === 'processing') {
        e.preventDefault()
        e.returnValue = 'لديك عملية دفع قيد التقدم، هل أنت متأكد من المغادرة؟'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [paymentStatus])

  // استعادة الجلسة مع التحقق من الصلاحية
  const restoreSession = useCallback(async () => {
    if (!plan || paymentStatus !== 'idle') return

    setIsInitializing(true)
    try {
      const savedData = localStorage.getItem('paymentData')
      if (!savedData) {
        setIsInitializing(false)
        return
      }

      const { paymentToken, planId, timestamp } = JSON.parse(savedData)

      // التحقق من انتهاء الصلاحية (30 دقيقة)
      if (Date.now() - timestamp > 30 * 60 * 1000) {
        localStorage.removeItem('paymentData')
        setIsInitializing(false)
        return
      }

      if (planId !== plan.selectedOption.id.toString()) {
        localStorage.removeItem('paymentData')
        setIsInitializing(false)
        return
      }

      // إذا كانت حالة الدفع ناجحة من قبل
      if (paymentToken) {
        handlePaymentSuccess()
      }
    } catch (error) {
      console.error('فشل في استعادة الجلسة:', error)
      showToast.error('تعذر استعادة جلسة الدفع، يرجى البدء من جديد')
      localStorage.removeItem('paymentData')
    } finally {
      setIsInitializing(false)
    }
  }, [plan, paymentStatus, handlePaymentSuccess])

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // معالجة نجاح الدفع
  useEffect(() => {
    if (paymentStatus === 'exchange_success') {

      const timer = setTimeout(() => {
        onSuccess()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [paymentStatus, onSuccess])

  // عملية الدفع عبر TON
  const handleTonPaymentWrapper = async () => {
    if (!plan) return

    try {
      setLoading(true)
      const selectedPlanId = plan.selectedOption.id.toString()
      const { payment_token } = await handleTonPayment(
        tonConnectUI,
        setPaymentStatus,
        selectedPlanId,
        telegramId || 'unknown',
        telegramUsername || 'unknown',
        fullName || 'Unknown'
      )

      if (payment_token) {
        handlePaymentSuccess()
      } else {
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('فشل الدفع:', error)
      showToast.error(error instanceof Error ? error.message : 'فشلت عملية الدفع')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  // بدء استطلاع حالة الدفع
  const startPollingPaymentStatus = useCallback((paymentToken: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/status?token=${paymentToken}`)
        if (!response.ok) throw new Error(response.statusText)

        const data = await response.json()
        if (data.status === 'exchange_success') {
          setPaymentStatus('exchange_success')
          localStorage.setItem('paymentData', JSON.stringify({
            paymentToken,
            planId: plan?.selectedOption.id.toString(),
            status: 'exchange_success',
            timestamp: Date.now()
          }))

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error('خطأ في استطلاع حالة الدفع:', error)
      }
    }

    pollStatus()
    pollingIntervalRef.current = setInterval(pollStatus, 3000)
  }, [plan])

  // اختيار طريقة الدفع USDT
  const handleUsdtPaymentChoice = async (method: 'wallet' | 'exchange') => {
    if (!plan) return

    try {
      setLoading(true)
      if (method === 'wallet') {
        await handleTonPaymentWrapper()
      } else {
        let payment_token = paymentSessionRef.current.paymentToken || ''
        if (!payment_token) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/confirm_payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Telegram-Id': telegramId || 'unknown'
            },
            body: JSON.stringify({
              webhookSecret: process.env.NEXT_PUBLIC_WEBHOOK_SECRET,
              planId: plan.selectedOption.id,
              telegramId,
              telegramUsername,
              fullName
            }),
          })

          if (!response.ok) throw new Error('فشل في إنشاء طلب الدفع')
          const data = await response.json()
          payment_token = data.payment_token
        }

        paymentSessionRef.current = {
          paymentToken: payment_token,
          planId: plan.selectedOption.id.toString()
        }

        localStorage.setItem('paymentData', JSON.stringify({
          paymentToken: payment_token,
          planId: plan.selectedOption.id.toString(),
          timestamp: Date.now()
        }))

        setExchangeDetails({
          depositAddress: useTariffStore.getState().walletAddress || '0xRecipientAddress',
          amount: plan.selectedOption.price.toString(),
          network: 'TON Network',
          paymentToken: payment_token,
          planName: plan.name
        })

        setPaymentStatus('processing')
        startPollingPaymentStatus(payment_token)
      }
    } catch (error) {
      console.error('خطأ في عملية الدفع:', error)
      setPaymentStatus('failed')
      showToast.error('فشلت عملية الدفع، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  // عملية الدفع عبر Telegram Stars
  const handleStarsPayment = async () => {
    if (!plan) return
    // تحقق من وجود قيمة رقمية صحيحة
    if (typeof plan.selectedOption.telegramStarsPrice !== 'number') {
      showToast.error('سعر النجوم غير متوفر أو غير صالح');
      setPaymentStatus('failed');
      return;
    }
    try {
      setLoading(true)
      const { paymentToken } = await handleTelegramStarsPayment(
        plan.selectedOption.id,
        plan.selectedOption.telegramStarsPrice // الآن مضمون أنها number
      )

      if (paymentToken) {
        handlePaymentSuccess()
      } else {
        setPaymentStatus('failed')
      }
    } catch {
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }
  // التأكد من صحة حالة الدفع
  useEffect(() => {
    if (!exchangeDetails && paymentStatus === 'processing') {
      setPaymentStatus('idle')
    }
  }, [exchangeDetails, paymentStatus])

  // تنظيف المؤقتات عند تفكيك المكون
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return {
    paymentStatus,
    loading,
    exchangeDetails,
    setExchangeDetails,
    isInitializing,
    handleTonPaymentWrapper,
    handleUsdtPaymentChoice,
    handleStarsPayment,
    resetPaymentStatus,
    cleanupPaymentSession
  }
}