import { useState, useEffect } from 'react';
import { Check, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import { supabase, Plan, Addon } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useVat } from '../contexts/VatContext';

export function ExistingCustomerTab() {
  const { language, t } = useLanguage();
  const { includeVat, applyVat, calculateVatAmount } = useVat();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<Plan | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [plansResult, addonsResult] = await Promise.all([
        supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('addons').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (plansResult.data) {
        setPlans(plansResult.data);
        if (plansResult.data.length > 0) {
          setCurrentPlan(plansResult.data[0]);
          setSelectedNewPlan(plansResult.data[0]);
        }
      }
      if (addonsResult.data) setAddons(addonsResult.data);

      const today = new Date();
      setSubscriptionStartDate(today.toISOString().split('T')[0]);
      const futureDate = new Date(today.setMonth(today.getMonth() + 6));
      setSubscriptionEndDate(futureDate.toISOString().split('T')[0]);

      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNewPlan && selectedNewPlan.code === 'P-0026' && addons.length > 0) {
      const professionalAddons = new Set<string>();
      addons.forEach(addon => {
        if (addon.code !== 'ota_registration') {
          professionalAddons.add(addon.id);
        }
      });
      setSelectedAddons(professionalAddons);
    } else if (selectedNewPlan && selectedNewPlan.code !== 'P-0026') {
      setSelectedAddons(new Set());
    }
  }, [selectedNewPlan, addons]);

  const calculateRemainingDays = () => {
    if (!subscriptionStartDate || !subscriptionEndDate) return 0;
    const startDate = new Date(subscriptionStartDate);
    const endDate = new Date(subscriptionEndDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateProratedAmount = (price: number) => {
    const remainingDays = calculateRemainingDays();
    const totalDaysInYear = 365;
    return (price * remainingDays) / totalDaysInYear;
  };

  const getDiscountedPrice = (plan: Plan) => {
    return plan.yearly_price * (1 - plan.discount_percentage / 100);
  };

  const calculatePlanDifference = () => {
    if (!currentPlan || !selectedNewPlan) return 0;

    const currentPrice = getDiscountedPrice(currentPlan);
    const newPrice = getDiscountedPrice(selectedNewPlan);
    const priceDiff = newPrice - currentPrice;

    return calculateProratedAmount(priceDiff);
  };

  const getAddonPrice = (addon: Addon) => {
    return addon.is_onetime ? addon.onetime_price : addon.yearly_price;
  };

  const calculateAddonsTotal = () => {
    // If Professional Plan is selected, only charge for OTA Registration
    if (selectedNewPlan && selectedNewPlan.code === 'P-0026') {
      return addons
        .filter(addon => selectedAddons.has(addon.id) && addon.code === 'ota_registration')
        .reduce((sum, addon) => {
          const price = getAddonPrice(addon);
          return sum + (addon.is_onetime ? price : calculateProratedAmount(price));
        }, 0);
    }

    return addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => {
        const price = getAddonPrice(addon);
        // One-time add-ons are not prorated
        return sum + (addon.is_onetime ? price : calculateProratedAmount(price));
      }, 0);
  };

  const calculateTotal = () => {
    return calculatePlanDifference() + calculateAddonsTotal();
  };

  const toggleAddon = (addonId: string) => {
    const newSet = new Set(selectedAddons);
    if (newSet.has(addonId)) {
      newSet.delete(addonId);
    } else {
      newSet.add(addonId);
    }
    setSelectedAddons(newSet);
  };

  const isUpgrade = () => {
    if (!currentPlan || !selectedNewPlan) return false;
    return selectedNewPlan.yearly_price > currentPlan.yearly_price;
  };

  const isDowngrade = () => {
    if (!currentPlan || !selectedNewPlan) return false;
    return selectedNewPlan.yearly_price < currentPlan.yearly_price;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#132ef5]"></div>
      </div>
    );
  }

  const remainingDays = calculateRemainingDays();

  return (
    <div className="space-y-8">

      <div className="bg-gradient-to-br from-[#f7f9fc] to-[#ffede2] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#021441] mb-6">
          {t('Current Subscription Details', 'تفاصيل الاشتراك الحالي')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#021441] mb-2">
              {t('Current Plan', 'الخطة الحالية')}
            </label>
            <select
              value={currentPlan?.id || ''}
              onChange={(e) => {
                const plan = plans.find(p => p.id === e.target.value);
                setCurrentPlan(plan || null);
              }}
              className="w-full px-4 py-3 border-2 border-[#132ef5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#132ef5] focus:ring-opacity-50 transition-all bg-white"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {language === 'en' ? plan.name_en : plan.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#021441] mb-2">
              {t('Subscription Start Date', 'تاريخ بداية الاشتراك')}
            </label>
            <input
              type="date"
              value={subscriptionStartDate}
              onChange={(e) => setSubscriptionStartDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#132ef5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#132ef5] focus:ring-opacity-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#021441] mb-2">
              {t('Subscription End Date', 'تاريخ انتهاء الاشتراك')}
            </label>
            <input
              type="date"
              value={subscriptionEndDate}
              onChange={(e) => setSubscriptionEndDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#132ef5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#132ef5] focus:ring-opacity-50 transition-all"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
          <Calendar className="w-5 h-5 text-[#132ef5]" />
          <div>
            <span className="text-sm text-[#8089a0]">
              {t('Days remaining:', 'الأيام المتبقية:')}
            </span>
            <span className="ml-2 text-lg font-bold text-[#132ef5]">
              {remainingDays} {t('days', 'يوم')}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-[#021441] mb-4">
          {t('Select New Plan', 'اختر الخطة الجديدة')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedNewPlan?.id === plan.id;
            const isCurrent = currentPlan?.id === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedNewPlan(plan)}
                className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${isSelected
                  ? 'bg-[#132ef5] text-white shadow-xl scale-105 border-2 border-[#132ef5]'
                  : 'bg-white text-[#021441] shadow-md hover:shadow-lg border border-gray-200'
                  }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#8089a0] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    {t('Current', 'الحالية')}
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-bold">
                    {language === 'en' ? plan.name_en : plan.name_ar}
                  </h4>
                  {isSelected && <Check className="w-6 h-6" />}
                </div>

                <p className={`text-sm mb-4 ${isSelected ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                  {language === 'en' ? plan.target_customer_en : plan.target_customer_ar}
                </p>

                <div className="space-y-2 mb-4">
                  {plan.discount_percentage > 0 ? (
                    <>
                      <div className={`text-lg line-through ${isSelected ? 'text-blue-200' : 'text-[#8089a0]'}`}>
                        {applyVat(plan.yearly_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-[#132ef5]'}`}>
                        {applyVat(plan.yearly_price * (1 - plan.discount_percentage / 100)).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-green-600'} font-semibold`}>
                        {t(`Save ${plan.discount_percentage}%`, `وفر ${plan.discount_percentage}٪`)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-[#132ef5]'}`}>
                        {applyVat(plan.yearly_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                        {t('per year', 'سنوياً')}
                      </div>
                    </>
                  )}
                </div>

                <div className={`space-y-2 text-sm ${isSelected ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{plan.units_quota} {t('units', 'وحدة')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{language === 'en' ? plan.support_type_en : plan.support_type_ar}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-[#021441] mb-4">
          {t('Add-ons', 'الإضافات')}
        </h3>
        <p className="text-sm text-[#8089a0] mb-4">
          {t('Add-ons will be prorated based on remaining subscription days', 'سيتم احتساب الإضافات بناءً على الأيام المتبقية من الاشتراك')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const isSelected = selectedAddons.has(addon.id);
            const addonPrice = getAddonPrice(addon);
            const displayPrice = addon.is_onetime ? addonPrice : calculateProratedAmount(addonPrice);

            return (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                className={`cursor-pointer rounded-xl p-5 transition-all duration-200 border-2 ${isSelected
                  ? 'border-[#132ef5] bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#132ef5] hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-semibold text-[#021441]">
                    {language === 'en' ? addon.name_en : addon.name_ar}
                  </h5>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#132ef5] border-[#132ef5]' : 'border-gray-300'
                    }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <p className="text-sm text-[#8089a0] mb-3">
                  {language === 'en' ? addon.description_en : addon.description_ar}
                </p>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-[#132ef5]">
                    {applyVat(displayPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                  </div>
                  <div className="text-xs text-[#8089a0]">
                    {addon.is_onetime
                      ? t('One-time payment', 'دفعة واحدة')
                      : `${t('Prorated for', 'محسوب لـ')} ${remainingDays} ${t('days', 'يوم')}`
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentPlan && selectedNewPlan && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-[#021441] mb-6">
            {t('Payment Summary', 'ملخص الدفع')}
          </h3>

          <div className="space-y-4 mb-6">
            {currentPlan.id !== selectedNewPlan.id && (
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  {isUpgrade() && <ArrowUpCircle className="w-5 h-5 text-green-600" />}
                  {isDowngrade() && <ArrowDownCircle className="w-5 h-5 text-orange-600" />}
                  <span className="text-[#8089a0]">
                    {isUpgrade() && t('Plan Upgrade', 'ترقية الخطة')}
                    {isDowngrade() && t('Plan Downgrade', 'تخفيض الخطة')}
                  </span>
                </div>
                <span className={`font-semibold ${isUpgrade() ? 'text-green-600' : 'text-orange-600'}`}>
                  {isUpgrade() && '+'}
                  {applyVat(calculatePlanDifference()).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            )}

            {selectedAddons.size > 0 && (
              <div className="space-y-2">
                {addons
                  .filter(addon => selectedAddons.has(addon.id))
                  .map(addon => {
                    const addonPrice = getAddonPrice(addon);
                    const displayPrice = addon.is_onetime ? addonPrice : calculateProratedAmount(addonPrice);
                    const isProfessionalPlan = selectedNewPlan && selectedNewPlan.code === 'P-0026';
                    const isIncluded = isProfessionalPlan && addon.code !== 'ota_registration';

                    return (
                      <div key={addon.id} className="flex justify-between items-center">
                        <span className="text-[#8089a0]">
                          {language === 'en' ? addon.name_en : addon.name_ar}
                          {addon.is_onetime && !isIncluded && (
                            <span className="ml-1 text-xs text-green-600">
                              ({t('one-time', 'مرة واحدة')})
                            </span>
                          )}
                          {isIncluded && (
                            <span className="ml-1 text-xs text-green-600">
                              ({t('included', 'مشمول')})
                            </span>
                          )}
                        </span>
                        <span className={`font-semibold ${isIncluded ? 'text-green-600' : 'text-[#021441]'}`}>
                          {isIncluded ? t('Included', 'مشمول') : `${applyVat(displayPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${t('SAR', 'ريال')}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#f7f9fc] to-white rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-[#8089a0] mb-2">
              <Calendar className="w-4 h-4" />
              <span>
                {t('Prorated for remaining', 'محسوب للأيام المتبقية')} {remainingDays} {t('days', 'يوم')}
              </span>
            </div>
          </div>

          {includeVat && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-[#8089a0]">
                  {t('Subtotal', 'المجموع الفرعي')}
                </span>
                <span className="font-semibold text-[#021441]">
                  {calculateTotal().toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-600">
                <span>
                  {t('VAT 15% (inclusive)', 'ضريبة القيمة المضافة 15٪ (مشمولة)')}
                </span>
                <span className="font-semibold">
                  +{calculateVatAmount(calculateTotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
            <span className="text-2xl font-bold text-[#021441]">
              {t('Amount Due', 'المبلغ المستحق')}
            </span>
            <span className={`text-3xl font-bold ${applyVat(calculateTotal()) >= 0 ? 'text-[#132ef5]' : 'text-green-600'}`}>
              {applyVat(calculateTotal()) >= 0 && '+'}
              {applyVat(calculateTotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
            </span>
          </div>
          <p className="text-sm text-[#8089a0] text-center mt-2">
            {applyVat(calculateTotal()) < 0
              ? t('Credit will be applied to your account', 'سيتم إضافة الرصيد إلى حسابك')
              : t('Payment due immediately', 'الدفع مطلوب فوراً')
            }
          </p>
        </div>
      )}
    </div>
  );
}
