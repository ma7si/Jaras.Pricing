import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
    >
      <Globe className="w-5 h-5 text-[#132ef5]" />
      <span className="font-medium text-gray-700">
        {language === 'en' ? 'العربية' : 'English'}
      </span>
    </button>
  );
}
