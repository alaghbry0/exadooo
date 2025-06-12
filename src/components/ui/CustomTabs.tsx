'use client'; // إذا كنت تخطط لاستخدامه في مكونات العميل في App Router

import React, { createContext, useContext, useState, ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils'; // افترض أن لديك دالة cn (clsx + tailwind-merge)

// --- Context ---
interface TabsContextProps {
  activeValue: string;
  setActiveValue: (value: string) => void;
  baseId: string; // للمساعدة في إنشاء IDs فريدة للـ accessibility
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a <Tabs> component');
  }
  return context;
};

// --- المكونات ---

// 1. Tabs (المكون الحاوي الرئيسي)
interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, onValueChange, children, className, ...props }, ref) => {
    const [activeValue, setActiveValue] = useState(defaultValue);
    const baseId = React.useId(); // لتوليد IDs فريدة

    const handleValueChange = (newValue: string) => {
      setActiveValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <TabsContext.Provider value={{ activeValue, setActiveValue: handleValueChange, baseId }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

// 2. TabsList (حاوية لأزرار التبويب)
export const TabsList = React.forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal" // أو يمكن جعله prop
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        // أضف أنماطك الافتراضية هنا إذا أردت
        // مثال من الكود الخاص بك: "grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0 p-1.5 bg-slate-100 rounded-none border-b"
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
TabsList.displayName = "TabsList";

// 3. TabsTrigger (زر التبويب)
interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeValue, setActiveValue, baseId } = useTabs();
    const isActive = activeValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`${baseId}-content-${value}`}
        id={`${baseId}-trigger-${value}`}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => setActiveValue(value)}
        disabled={props.disabled || isActive} // يمكن تعطيل الزر النشط
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          // أضف أنماطك الافتراضية هنا إذا أردت
          // مثال من الكود الخاص بك لـ active: "data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600"
          // مثال من الكود الخاص بك لـ inactive: "text-slate-700 text-xs sm:text-sm font-medium py-2.5 px-2 h-auto"
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

// 4. TabsContent (محتوى التبويب)
interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeValue, baseId } = useTabs();
    const isActive = activeValue === value;

    if (!isActive) return null; // لا تعرض المحتوى إذا لم يكن التبويب نشطًا

    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-labelledby={`${baseId}-trigger-${value}`}
        id={`${baseId}-content-${value}`}
        tabIndex={0} // لجعله قابلًا للتركيز
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // أضف أنماطك الافتراضية هنا
          // مثال من الكود الخاص بك: "p-4 md:p-6 bg-white rounded-b-lg mt-0"
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";