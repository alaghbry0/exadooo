import { useState, useEffect, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { PaymentHistoryItem } from '@/components/PaymentHistoryItem'
import axios from 'axios'
import { useTelegram } from '../context/TelegramContext'
import { Button } from 'flowbite-react'
import { useRouter } from 'next/router'
import { FiArrowLeft } from 'react-icons/fi'

type Payment = {
  tx_hash: string
  amount_received: number
  subscription_plan_id: number
  status: 'completed' | 'failed'
  processed_at: string
  payment_token: string
  error_message?: string | null
  plan_name: string
  subscription_name: string
}

export default function PaymentHistory() {
  const router = useRouter()
  const { telegramId } = useTelegram()


  const [payments, setPayments] = useState<Payment[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const limit = 10

  const fetchMoreData = useCallback(async (): Promise<void> => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/payment-history`, {
        params: { offset, limit, telegram_id: telegramId }
      })
      const newPayments: Payment[] = res.data || []
      setPayments(prev => [...prev, ...newPayments])
      setOffset(prev => prev + limit)
      if (newPayments.length < limit) setHasMore(false)
    } catch (error) {
      console.error('Error fetching payment history', error)
    } finally {
      setIsLoading(false)
    }
  }, [offset, telegramId]);

  useEffect(() => {
    if (telegramId) {
      fetchMoreData();
    }
  }, [telegramId, offset, fetchMoreData])

  const handleGoBack = () => {
    router.back()
  }

  if (isLoading && payments.length === 0) {
    return (
      <div className="container mx-auto p-4 min-h-[60vh] space-y-6">
        {/* هيكل Skeleton للرأس */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        </div>
        
        {/* هيكل Skeleton للعناصر */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow space-y-4">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-6">
        <Button onClick={handleGoBack} color="gray" pill>
          <FiArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1 text-center">السجل</h1>
      </div>

      <InfiniteScroll
        dataLength={payments.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={
          <div className="p-6 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        }
        endMessage={
          <p className="text-center my-4 text-gray-500">
            لا توجد سجلات أخرى.
          </p>
        }
      >
        {payments.map((payment) => (
          <PaymentHistoryItem key={payment.tx_hash} payment={payment} />
        ))}
      </InfiniteScroll>
    </div>
  )
}
