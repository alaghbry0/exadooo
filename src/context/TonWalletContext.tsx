'use client';
import { createContext, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ✅ تحميل `TonConnectUIProvider` فقط داخل المتصفح لمنع SSR
const TonConnectUIProvider = dynamic(
  () => import("@tonconnect/ui-react").then((mod) => mod.TonConnectUIProvider),
  { ssr: false }
);

// ✅ تعريف نوع بيانات `Context`
interface TonWalletContextType {
  walletAddress: string | null;
  tonConnectUI: any | null; // يمكنك استبداله لاحقًا بنوع محدد بعد التحقق
}

// ✅ إنشاء `Context`
const TonWalletContext = createContext<TonWalletContextType>({
  walletAddress: null,
  tonConnectUI: null,
});

export const TonWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tonConnectUI, setTonConnectUI] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false); // ✅ لمعرفة ما إذا كان الكود يعمل في المتصفح

  useEffect(() => {
    setIsClient(true); // ✅ تأكيد تحميل المتصفح

    if (typeof window !== "undefined") {
      import("@tonconnect/ui-react").then((mod) => {
        const tonConnectInstance = new mod.TonConnectUI({
          manifestUrl:
            "https://exadooo-git-main-mohammeds-projects-3d2877c6.vercel.app/tonconnect-manifest.json",
        });

        setTonConnectUI(tonConnectInstance);

        // ✅ تحديث عنوان المحفظة عند تغيّر الحالة
        tonConnectInstance.onStatusChange((wallet: any) => {
          setWalletAddress(wallet?.account?.address || null);
        });
      });
    }
  }, []);

  return (
    <TonWalletContext.Provider value={{ walletAddress, tonConnectUI }}>
      {isClient ? (
        <TonConnectUIProvider
          manifestUrl="https://exadooo-git-main-mohammeds-projects-3d2877c6.vercel.app/tonconnect-manifest.json"
        >
          {children}
        </TonConnectUIProvider>
      ) : (
        children
      )}
    </TonWalletContext.Provider>
  );
};

// ✅ دالة `useTonWallet` للوصول إلى بيانات المحفظة بسهولة في أي مكون
export const useTonWallet = () => useContext(TonWalletContext);
