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
    return includeVat ? amount * 1.15 : amount;
  };

  const calculateVatAmount = (amount: number) => {
    return includeVat ? amount * 0.15 : 0;
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
