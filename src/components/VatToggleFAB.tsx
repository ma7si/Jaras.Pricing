import { useState } from 'react';
import { Percent } from 'lucide-react';
import { useVat } from '../contexts/VatContext';
import { useLanguage } from '../contexts/LanguageContext';

export function VatToggleFAB() {
    const { includeVat, toggleVat } = useVat();
    const { t } = useLanguage();
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = () => {
        setIsPressed(true);
        toggleVat();
        // Reset pressed state after spring animation completes
        setTimeout(() => setIsPressed(false), 600);
    };

    return (
        <button
            onClick={handleClick}
            aria-label={t('Toggle VAT', 'تبديل ضريبة القيمة المضافة')}
            className={`
        fixed bottom-6 right-6 z-[1000]
        flex items-center gap-3 px-6 py-4 rounded-full
        shadow-2xl hover:shadow-3xl
        transition-all duration-300
        levitating
        ${isPressed ? 'scale-75' : 'scale-100'}
        ${includeVat
                    ? 'bg-[#132ef5] text-white'
                    : 'bg-white text-[#132ef5] border-2 border-[#132ef5]'
                }
      `}
            style={{
                transitionTimingFunction: isPressed ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-out',
                transitionDuration: isPressed ? '600ms' : '300ms',
            }}
        >
            <Percent className="w-6 h-6" />
            <span className="font-semibold text-sm whitespace-nowrap">
                {t('VAT 15%', 'ضريبة 15%')}
            </span>
        </button>
    );
}
