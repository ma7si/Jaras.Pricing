import { createContext, useContext, useState, ReactNode } from 'react';

type VatContextType = {
  includeVat: boolean;
  toggleVat: () => void;
  applyVat: (amount: number) => number;
  calculateVatAmount: (amount: number) => number;
};

const VatContext = createContext<VatContextType | undefined>(undefined);

export function VatProvider({ children }: { children: ReactNode }) {
  const [includeVat, setIncludeVat] = useState(false);

  const toggleVat = () => {
    setIncludeVat(prev => !prev);
  };

  const applyVat = (amount: number) => {
    // Database prices include VAT, so when includeVat is true, show original amount
    // When includeVat is false, divide by 1.15 to remove the VAT
    return includeVat ? amount : amount / 1.15;
  };

  const calculateVatAmount = (amount: number) => {
    // When VAT is included, show the VAT amount (original - price without VAT)
    // When VAT is excluded, show 0
    return includeVat ? amount - (amount / 1.15) : 0;
  };

  return (
    <VatContext.Provider value={{ includeVat, toggleVat, applyVat, calculateVatAmount }}>
      {children}
    </VatContext.Provider>
  );
}

export function useVat() {
  const context = useContext(VatContext);
  if (context === undefined) {
    throw new Error('useVat must be used within a VatProvider');
  }
  return context;
}
