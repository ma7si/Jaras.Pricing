import { useState } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { VatProvider } from './contexts/VatContext';
import { LanguageToggle } from './components/LanguageToggle';
import { NewCustomerTab } from './components/NewCustomerTab';
import { ExistingCustomerTab } from './components/ExistingCustomerTab';
import { useLanguage } from './contexts/LanguageContext';
import { Bell } from 'lucide-react';

function AppContent() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#ffede2]">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#132ef5] p-3 rounded-2xl shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#021441]">
                {t('Jaras Platform', 'منصة جرس')}
              </h1>
              <p className="text-[#8089a0]">
                {t('Pricing Calculator', 'حاسبة الأسعار')}
              </p>
            </div>
          </div>
          <LanguageToggle />
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-2 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'new'
                ? 'bg-[#132ef5] text-white shadow-lg'
                : 'text-[#8089a0] hover:text-[#021441]'
            }`}
          >
            {t('New Customers', 'عملاء جدد')}
          </button>
          <button
            onClick={() => setActiveTab('existing')}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'existing'
                ? 'bg-[#132ef5] text-white shadow-lg'
                : 'text-[#8089a0] hover:text-[#021441]'
            }`}
          >
            {t('Existing Customers', 'العملاء الحاليون')}
          </button>
        </div>

        <div className="transition-all duration-500 ease-in-out">
          {activeTab === 'new' ? <NewCustomerTab /> : <ExistingCustomerTab />}
        </div>

        <footer className="mt-16 text-center text-[#8089a0] text-sm">
          <p>© 2025 {t('Jaras Platform. All rights reserved.', 'منصة جرس. جميع الحقوق محفوظة.')}</p>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <VatProvider>
        <AppContent />
      </VatProvider>
    </LanguageProvider>
  );
}

export default App;
