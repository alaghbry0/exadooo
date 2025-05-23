'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TonConnectButton, TonConnectUIProvider } from '@tonconnect/ui-react'
import { Button, Footer } from 'flowbite-react'
import { HiOutlineCash, HiOutlineChartBar, HiOutlineChat } from 'react-icons/hi'
import Navbar from '../components/Navbar'

const Home: React.FC = () => {
  const featuresData = [
    {
      icon: <HiOutlineChartBar className="w-12 h-12 text-[#0084ff]" />,
      title: "تحليلات مباشرة للأسواق",
      description: "تحليلات يومية وأسبوعية لأهم العملات الرقمية وأزواج سوق الفوركس."
    },
    {
      icon: <HiOutlineCash className="w-12 h-12 text-[#0084ff]" />,
      title: "توصيات تداول رابحة",
      description: "توصيات مدروسة المخاطرة وذات نسب نجاح عالية تضمن لك أرباحاً في نهاية كل شهر."
    },
    {
      icon: <HiOutlineChat className="w-12 h-12 text-[#0084ff]" />,
      title: "خدمة عملاء 24/7",
      description: "دعم فوري وسريع للرد على أي استفسار أو لحل أي مشكلة على مدار اليوم."
    }
  ]

  return (
    <TonConnectUIProvider manifestUrl="https://exadooo-plum.vercel.app/tonconnect-manifest.json">
      <div dir="rtl" className="min-h-screen bg-white safe-area-padding pb-16 font-inter">
        {/* شريط التنقل */}
        <Navbar />

        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                className="mb-8 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <TonConnectButton className="!px-6 !py-2 !text-sm !rounded-xl" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight"
              >
                <span className="block text-blue-600 mt-2">تداول بذكاء</span>
                <br />
                مع توصيات خبرائنا في إكسادوا
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8 max-w-xl mx-auto text-base leading-relaxed text-center"
              >
                احصل على وصول فوري إلى تحليلات مباشرة وتوصيات تداول بنسب نجاح عالية!
              </motion.p>

              <motion.div
                className="flex justify-center"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <Link href="/shop">
                  <Button
                    className="bg-gradient-to-r from-[#0084ff] to-[#0066cc] text-white px-7 py-2.5 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    <span className="text-base font-semibold">اشترك معنا الآن</span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuresData.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3 }}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-center"
                >
                  <div className="mb-3 flex justify-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0084ff]/10 rounded-lg">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed px-2">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-center shadow-xl">
              <h2 className="text-xl font-bold text-white mb-3">
                انضم إلينا اليوم وحقق دخل إضافي من التداول!
              </h2>
              <div className="flex justify-center gap-3">
                <Link href="/shop">
                  <Button className="bg-white text-primary hover:bg-white/90 px-8 py-2 rounded-lg text-base font-semibold" size="sm">
                   خطط الاشتراك في قنوات التوصيات
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer className="border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between py-1 md:flex-row">
              <Footer.Copyright
                href="/"
                by="Exaado™"
                year={2025}
                className="text-gray-500 text-sm"
              />
              <div className="flex gap-5 mt-3 md:mt-0">
                {/* روابط إضافية */}
              </div>
            </div>
          </div>
        </Footer>
      </div>

      <style jsx global>{`
        .ton-connect-button {
          background: rgba(0, 132, 255, 0.1) !important;
          color: #0084ff !important;
          border: 1px solid rgba(0, 132, 255, 0.3) !important;
          border-radius: 0.75rem !important;
          padding: 0.5rem 1.25rem !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        }
        .ton-connect-button:hover {
          background: rgba(0, 132, 255, 0.15) !important;
          border-color: #0084ff !important;
        }
      `}</style>
    </TonConnectUIProvider>
  )
}

export default Home
