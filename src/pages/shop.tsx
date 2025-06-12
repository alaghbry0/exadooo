// src/pages/shop.tsx
'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import SubscriptionModal from '../components/SubscriptionModal'
import { FaLayerGroup, FaTags, FaStar as FaStarRecommended, FaClock } from 'react-icons/fa'
import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import Navbar from '../components/Navbar'

import { useQuery } from '@tanstack/react-query'
import { getAllPublicSubscriptionData } from '../services/api'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star as StarFeature } from 'lucide-react';

import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import type {
  ApiPublicSubscriptionGroup,
  ApiPublicSubscriptionType,
  ApiPublicPlan,
  SubscriptionOption,
  SubscriptionUIData,
  SubscriptionPlan
} from '../typesPlan';

const defaultStyles: { [key: number]: {
  tagline: string;
  primaryColor: string;
  accentColor: string;
  backgroundPattern: string;
  color: string;
} } = {
  1: {
    tagline: 'إشارات نخبة الفوركس لتحقيق أقصى قدر من الأرباح',
    primaryColor: '#2390f1',
    accentColor: '#eab308',
    backgroundPattern: 'bg-none',
    color: '#2390f1'
  },
  2: {
    tagline: 'استثمر بذكاء في عالم الكريبتو المثير',
    primaryColor: '#2390f1',
    accentColor: '#eab308',
    backgroundPattern: 'bg-none',
    color: '#2390f1'
  },
};

const ShopComponent: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [typeId: number]: SubscriptionOption }>({});
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [initialGroupSelected, setInitialGroupSelected] = useState(false);
  const [selectedTypeInGroup, setSelectedTypeInGroup] = useState<{ [groupId: number]: number }>({});

  const subscriptionsSectionRef = useRef<HTMLElement>(null);
  const groupTabsContainerRef = useRef<HTMLDivElement>(null);

  const {
    data: allSubscriptionData,
    isLoading,
    error,
  } = useQuery<ApiPublicSubscriptionGroup[]>({
    queryKey: ['allPublicSubscriptionData'],
    queryFn: getAllPublicSubscriptionData,
    staleTime: 5 * 60 * 1000,
  });

  const processSubscriptionType = (type: ApiPublicSubscriptionType): SubscriptionUIData => {
  const style = defaultStyles[type.id] || {
    tagline: 'اكتشف مزايا هذا الاشتراك',
    primaryColor: '#4a90e2',
    accentColor: '#f5a623',
    backgroundPattern: 'bg-none',
    color: '#4a90e2'
  };
  return {
    ...type,
    tagline: type.description || style.tagline,
    primaryColor: style.primaryColor,
    accentColor: style.accentColor,
    backgroundPattern: style.backgroundPattern,
    color: style.color,
  };
};

  const convertPlanToOption = (plan: ApiPublicPlan, allPlansForType: ApiPublicPlan[]): SubscriptionOption => {
    const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    const originalPriceNum = plan.original_price ?
      (typeof plan.original_price === 'string' ? parseFloat(plan.original_price) : plan.original_price) : null;

    const hasDiscount = originalPriceNum !== null && originalPriceNum > price;
    const discountPercentage = hasDiscount && originalPriceNum ?
      Math.round(((originalPriceNum - price) / originalPriceNum) * 100) : 0;

    let savingsText: string | undefined = undefined;
    if (plan.name === '3 شهور' && !hasDiscount) {
      const monthlyPlan = allPlansForType.find(p => p.name === 'شهري');
      if (monthlyPlan) {
        const monthlyPrice = typeof monthlyPlan.price === 'string' ? parseFloat(monthlyPlan.price) : monthlyPlan.price;
        if (!isNaN(monthlyPrice) && monthlyPrice > 0 && (monthlyPrice * 3 > price)) {
          const savings = ((monthlyPrice * 3 - price) / (monthlyPrice * 3)) * 100;
          if (savings > 0) {
            savingsText = `وفر ${savings.toFixed(0)}%`;
          }
        }
      }
    }

    return {
      id: plan.id,
      duration: plan.name,
      price: !isNaN(price) ? price.toFixed(0) + '$' : 'N/A',
      originalPrice: originalPriceNum?.toFixed(0) + '$' || null,
      discountedPrice: price,
      discountPercentage,
      hasDiscount,
      telegramStarsPrice: plan.telegram_stars_price,
      savings: savingsText,
      duration_days: plan.duration_days
    };
  };

  useEffect(() => {
    if (!allSubscriptionData) return;

    const newSelectedOptions: { [typeId: number]: SubscriptionOption } = {};
    const newSelectedTypeInGroup: { [groupId: number]: number } = {};

    allSubscriptionData.forEach(group => {
      if (group.display_as_single_card && group.subscription_types.length > 0) {
        const sortedTypes = [...group.subscription_types].sort((a,b) => (a.sort_order || 99) - (b.sort_order || 99));
        newSelectedTypeInGroup[group.id!] = sortedTypes[0].id;
      }

      group.subscription_types.forEach(type => {
        if (type.subscription_options.length > 0) {
          const allPlans = type.subscription_options;
          const sortedOptions = allPlans
            .map(plan => convertPlanToOption(plan, allPlans))
            .sort((a, b) => a.duration_days - b.duration_days);

          const defaultOption = sortedOptions.find(opt => opt.duration === 'شهري') || sortedOptions[0];
          newSelectedOptions[type.id] = defaultOption;
        }
      });
    });

    setSelectedOptions(newSelectedOptions);
    setSelectedTypeInGroup(newSelectedTypeInGroup);
  }, [allSubscriptionData]);

  useEffect(() => {
    if (allSubscriptionData && !initialGroupSelected) {
      if (allSubscriptionData.length > 0) {
        setSelectedGroupId(null);
      }
      setInitialGroupSelected(true);
    }
  }, [allSubscriptionData, initialGroupSelected]);

  useEffect(() => {
    import('@twa-dev/sdk').then(() => {}).catch(() => {});
  }, []);

  const handleGroupSelect = (groupId: number | null, eventTarget: HTMLElement) => {
    setSelectedGroupId(groupId);
    eventTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const filteredData = useMemo(() => {
    if (!allSubscriptionData) return [];

    if (selectedGroupId === null) {
      return allSubscriptionData.filter(group => group.subscription_types.length > 0);
    } else {
      return allSubscriptionData.filter(group => group.id === selectedGroupId && group.subscription_types.length > 0);
    }
  }, [allSubscriptionData, selectedGroupId]);

  const cardsToRender = useMemo(() => {
    const cards: Array<{
      type: 'single' | 'group';
      data: SubscriptionUIData;
      groupData?: ApiPublicSubscriptionGroup;
      groupName?: string;
    }> = [];

    filteredData.forEach(group => {
      if (group.display_as_single_card && group.subscription_types.length > 0) {
        const selectedTypeId = selectedTypeInGroup[group.id!] || group.subscription_types[0].id;
        const selectedType = group.subscription_types.find(t => t.id === selectedTypeId) || group.subscription_types[0];

        cards.push({
  type: 'group',
  data: processSubscriptionType(selectedType), // احذف group.name
  groupData: group,
  groupName: group.name
});
      } else {
        group.subscription_types.forEach(type => {
  cards.push({
    type: 'single',
    data: processSubscriptionType(type), // احذف group.name
    groupName: group.name
  });
});
      }
    });

    return cards;
  }, [filteredData, selectedTypeInGroup]);

  if (isLoading && !error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-gray-300 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700">جاري تحميل ...</p>
      </div>
    );
  }

  if (error) {
    const errorMsg = `خطأ في تحميل البيانات: ${(error as Error).message}`;
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">حدث خطأ</h3>
        <p className="text-gray-600 mb-6 max-w-md">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          إعادة تحميل الصفحة
        </button>
      </div>
    );
  }

  return (
    <TonConnectUIProvider manifestUrl="https://exadooo-plum.vercel.app/tonconnect-manifest.json">
      <div dir="rtl" className="min-h-screen bg-gray-50 safe-area-padding pb-32 font-inter">
        <Navbar />

        <motion.div
          className="w-full py-12 md:py-16 bg-gradient-to-br from-blue-50 to-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
           <div className="container mx-auto px-4 text-center">
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              اختر الاشتراك الأنسب لك!
              <span className="block text-blue-600 mt-2">واستثمر بذكاء مع خبرائنا</span>
            </motion.h1>

            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-transparent w-1/3 mx-auto mb-6 rounded-full"></div>
              <p className="text-gray-600 text-base leading-relaxed">
                مع إكسادو، أصبح التداول أسهل مما تتخيل – جرّب بنفسك الآن!
              </p>
            </motion.div>
          </div>
        </motion.div>

        {(allSubscriptionData && allSubscriptionData.filter(g => g.id !== null).length > 1) && (
          <section className="sticky top-0 z-30 bg-white border-b shadow-sm pt-2 pb-0.5npm run build">
            <div
              ref={groupTabsContainerRef}
              className="container mx-auto px-3 flex overflow-x-auto gap-1.5 pb-3 scrollbar-hide"
            >
              <button
                onClick={(e) => handleGroupSelect(null, e.currentTarget)}
                data-group-id="all"
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all relative  ${
                  selectedGroupId === null
                    ? 'text-blue-700 font-semibold'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaLayerGroup size={14} />
                  الكل
                </div>
                {selectedGroupId === null && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                    layoutId="activeTabIndicator"
                  />
                )}
              </button>

              {allSubscriptionData
                .filter(group => group.id !== null)
                .map((group) => (
                  <button
                    key={group.id}
                    data-group-id={group.id}
                    onClick={(e) => handleGroupSelect(group.id, e.currentTarget)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all relative ${
                      selectedGroupId === group.id
                        ? 'text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaTags size={14} className="text-gray-500" />
                      {group.name}
                    </div>
                    {selectedGroupId === group.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"
                        layoutId="activeTabIndicator"
                      />
                    )}
                  </button>
                ))}
            </div>
          </section>
        )}

        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <motion.section
          ref={subscriptionsSectionRef}
          className="container mx-auto px-3 pb-8 md:pb-12 lg:pb-16 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {!isLoading && cardsToRender.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedGroupId ? "لا توجد اشتراكات لهذه المجموعة" : "لا توجد اشتراكات متاحة حاليًا"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {selectedGroupId ? "يرجى اختيار مجموعة أخرى أو التحقق لاحقًا." : "يرجى التحقق مرة أخرى في وقت لاحق."}
              </p>
            </div>
          )}

          {cardsToRender.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {cardsToRender.map((card, index) => {
                const cardData = card.data;
                const isGroupCard = card.type === 'group';
                const groupData = card.groupData;

                const selectedOption = selectedOptions[cardData.id];

                const allPlanOptions = cardData.subscription_options
                    .map(p => convertPlanToOption(p, cardData.subscription_options))
                    .sort((a, b) => a.duration_days - b.duration_days);

                if (!selectedOption) return null;

                const hasImage = !!cardData.image_url;
                const placeholderHeight = "120px";

                return (
                  <motion.div
                    key={`${cardData.id}-${selectedGroupId}-${selectedOption.id}-${isGroupCard ? 'group' : 'single'}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
                    whileHover={{ y: -5 }}
                    className="flex flex-col h-full"
                  >
                    <Card className={`
                      w-full bg-white shadow-md hover:shadow-lg transition-all duration-300
                      flex flex-col flex-grow relative rounded-xl
                      ${hasImage ? 'border-0 overflow-hidden' : 'border border-gray-200'}
                      ${cardData.is_recommended && !hasImage ? 'ring-2 ring-blue-500 ring-opacity-60' : ''}
                    `}>
                      {hasImage && (
                        <div
                          className="relative w-full group"
                          style={{
                            height: placeholderHeight,
                            backgroundColor: '#e0e0e0'
                          }}
                        >
                          <LazyLoadImage
                            alt={cardData.name}
                            src={cardData.image_url!}
                            effect="blur"
                            threshold={100}
                            wrapperClassName="w-full h-full"
                            className="w-full h-full object-cover"
                            style={{ display: 'block' }}
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                          {cardData.is_recommended && (
                            <div className="absolute top-3 left-3 z-10">
                              <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
                                <FaStarRecommended className="h-3 w-3" fill="currentColor" />
                                الأكثر طلباً
                              </Badge>
                            </div>
                          )}
                          {(selectedOption?.hasDiscount && selectedOption.discountPercentage && selectedOption.discountPercentage > 0) && (
                            <div className="absolute bottom-3 right-3 z-10">
                              <Badge className="bg-yellow-500 hover:bg-yellow-500 text-black border-0 shadow-lg px-2.5 py-1 text-xs font-bold">
                                خصم {selectedOption.discountPercentage}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {!hasImage && cardData.is_recommended && (
                        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                          <FaStarRecommended className="text-yellow-300" /> الأكثر طلباً
                        </div>
                      )}

                      <CardHeader className={`text-center ${hasImage ? 'pt-3 pb-2' : 'pt-4 pb-2'}`}>
                        {/* تعديل رقم 1: عرض اسم نوع الاشتراك دائما */}
                        <CardTitle className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                          {cardData.name}
                        </CardTitle>
                        {cardData.tagline && (
                          // تعديل رقم 2: إصلاح قص الوصف
                          <CardDescription className="mb-2 text-sm text-gray-600 line-clamp-2 min-h-10">
                            {cardData.tagline}
                          </CardDescription>
                        )}
                        <div className="flex items-end justify-center gap-0.5 mb-0.5">
                          <span className="text-xl font-bold text-gray-900">{selectedOption?.price}</span>
                          <span className="text-xs text-gray-500 mb-0.5">/ {selectedOption?.duration}</span>
                        </div>
                        {(selectedOption?.hasDiscount && selectedOption.originalPrice) && (
                          <div className="flex items-center justify-center gap-2 mt-1">
                            {!hasImage && selectedOption.discountPercentage && selectedOption.discountPercentage > 0 && (
                                <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-100 px-2.5 py-1 text-xs">
                                  خصم {selectedOption.discountPercentage}%
                                </Badge>
                            )}
                            <span className="text-sm text-gray-400 line-through">
                              {selectedOption.originalPrice}
                            </span>
                          </div>
                        )}
                        {!selectedOption?.hasDiscount && selectedOption?.savings && (
                          <div className="mt-2">
                            <span className="text-sm text-green-700 bg-green-100 px-2.5 py-1 rounded-md font-medium">
                              {selectedOption.savings}
                            </span>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex flex-col flex-grow pt-0 px-3 sm:px-4">
                        <div className="space-y-3 flex-grow mb-4">
                          {isGroupCard && groupData && groupData.subscription_types.length > 1 && (
                            <div className="space-y-2 pb-3">
                              <h3 className="font-semibold text-gray-700 text-xs text-center">الخدمات:</h3>
                              <div className="flex flex-col gap-1.5">
                                {groupData.subscription_types.sort((a,b) => (a.sort_order || 99) - (b.sort_order || 99)).map((type) => (
                                  <button
                                    key={type.id}
                                    onClick={() => {
                                      setSelectedTypeInGroup(prev => ({
                                        ...prev,
                                        [groupData.id!]: type.id
                                      }));
                                    }}
                                    className={`
                                      w-full px-2 py-1.5 rounded text-xs transition-all border text-center font-medium
                                      ${selectedTypeInGroup[groupData.id!] === type.id
                                        ? 'bg-blue-100 text-blue-800 font-semibold border-blue-300 ring-1 ring-blue-300'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'}
                                    `}
                                  >
                                    {type.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {(selectedOption?.hasDiscount || (cardData.is_recommended && !selectedOption?.hasDiscount)) && (
                              <div className={`
                                  border rounded p-2 text-center text-xs
                                  ${selectedOption?.hasDiscount
                                      ? 'bg-red-50 border-red-100 text-red-700'
                                      : 'bg-blue-50 border-blue-100 text-blue-700'}
                              `}>
                                  <div className="flex items-center justify-center gap-1">
                                      <FaClock className="h-3 w-3" />
                                      <span>
                                          {selectedOption?.hasDiscount ? "ينتهي قريباً!" : "خيار ممتاز!"}
                                      </span>
                                  </div>
                              </div>
                          )}

                          {cardData.features.length > 0 && (
                            <div className="space-y-2 text-right">
                              <h3 className="font-semibold text-gray-700 mb-1 text-sm">المميزات:</h3>
                              {cardData.features.slice(0, 2).map((feature, idx) =>
                                <div key={idx} className="flex items-start gap-2">
                                  <StarFeature className="h-3.5 w-3.5 text-blue-500 mt-1 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                                    {feature}
                                  </span>
                                </div>
                              )}
                              {cardData.features.length > 2 && (
                                <button
  onClick={() => {
    if (selectedOption) {
      setSelectedPlan({
        id: cardData.id,
        name: cardData.name,
        isRecommended: cardData.is_recommended ?? false, // تحويل نوع الحقل
        tagline: cardData.tagline,
        description: cardData.description ?? '',
        features: cardData.features,
        primaryColor: cardData.primaryColor,
        accentColor: cardData.accentColor,
        image_url: cardData.image_url ?? null,
        icon: () => null, // يمكنك استبداله بمكون أيقونة مناسب إذا كان متوفر
        backgroundPattern: cardData.backgroundPattern,
        usp: cardData.usp ?? '',
        color: cardData.color,
        subscriptionOptions: cardData.subscription_options
          ? cardData.subscription_options.map(p => convertPlanToOption(p, cardData.subscription_options))
          : [],
        group_id: cardData.group_id ?? null,
        terms_and_conditions: cardData.terms_and_conditions ?? [],
        selectedOption,
      });
    }
  }}
  className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
>
  عرض المزيد ...
</button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          {allPlanOptions.length > 1 && (
                            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
                              {allPlanOptions.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOptions(prev => ({ ...prev, [cardData.id]: option }));
                                  }}
                                  className={`
                                    px-2.5 py-1 text-xs rounded-lg transition-all border
                                    ${selectedOption?.id === option.id
                                      ? 'bg-blue-100 text-blue-700 font-semibold border-blue-300 ring-1 ring-blue-300'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}
                                  `}
                                >
                                  {option.duration}
                                </button>
                              ))}
                            </div>
                          )}

                          <Button
  onClick={() => {
    if (selectedOption) {
      setSelectedPlan({
        // SubscriptionCard fields
        id: cardData.id,
        name: cardData.name,
        isRecommended: cardData.is_recommended ?? false, // تحويل الحقل من snake_case لـ camelCase
        tagline: cardData.tagline,
        description: cardData.description ?? '',
        features: cardData.features,
        primaryColor: cardData.primaryColor,
        accentColor: cardData.accentColor,
        image_url: cardData.image_url ?? null,
        icon: () => null, // قم بتعيين أي مكون أيقونة مناسب
        backgroundPattern: cardData.backgroundPattern,
        usp: cardData.usp ?? '',
        color: cardData.color,
        subscriptionOptions: cardData.subscription_options
          ? cardData.subscription_options.map(p => convertPlanToOption(p, cardData.subscription_options))
          : [],
        group_id: cardData.group_id ?? null,
        terms_and_conditions: cardData.terms_and_conditions ?? [],
        // SubscriptionPlan field:
        selectedOption,
      });
    }
  }}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm"
  size="sm"
  disabled={!selectedOption}
>
                            اشترك الآن
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        <AnimatePresence>
          {selectedPlan && (
            <SubscriptionModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
          )}
        </AnimatePresence>
      </div>
    </TonConnectUIProvider>
  );
};

// تعديل رقم 3: تمت إزالة السطر الذي يضيف الإطار ring-1 ring-blue-400 من مكون Card أعلاه

const Shop = dynamic(() => Promise.resolve(ShopComponent), { ssr: false });
export default Shop;