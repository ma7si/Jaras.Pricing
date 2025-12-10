import { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { supabase, Plan, Addon } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useVat } from '../contexts/VatContext';

export function NewCustomerTab() {
  const { language, t } = useLanguage();
  const { includeVat, applyVat, calculateVatAmount } = useVat();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [unitsCount, setUnitsCount] = useState<number>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [plansResult, addonsResult] = await Promise.all([
        supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('addons').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (plansResult.data) setPlans(plansResult.data);
      if (addonsResult.data) setAddons(addonsResult.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (unitsCount > 0 && plans.length > 0) {
      const recommended = plans.find(plan => unitsCount <= plan.units_quota) || plans[plans.length - 1];
      setSelectedPlan(recommended);
    }
  }, [unitsCount, plans]);

  useEffect(() => {
    if (selectedPlan && selectedPlan.code === 'P-0026' && addons.length > 0) {
      const professionalAddons = new Set<string>();
      addons.forEach(addon => {
        if (addon.code !== 'ota_registration') {
          professionalAddons.add(addon.id);
        }
      });
      setSelectedAddons(professionalAddons);
    } else if (selectedPlan && selectedPlan.code !== 'P-0026') {
      setSelectedAddons(new Set());
    }
  }, [selectedPlan, addons]);

  const calculateExtraUnits = (plan: Plan) => {
    return Math.max(0, unitsCount - plan.units_quota);
  };

  const calculateExtraUnitsCost = (plan: Plan) => {
    const extraUnits = calculateExtraUnits(plan);
    return extraUnits * plan.additional_unit_price;
  };

  const calculatePlanBasePrice = (plan: Plan) => {
    const baseDiscount = (plan.yearly_price * plan.discount_percentage) / 100;
    const basePriceAfterDiscount = plan.yearly_price - baseDiscount;
    const additionalDiscount = (basePriceAfterDiscount * discountPercentage) / 100;
    return basePriceAfterDiscount - additionalDiscount;
  };

  const calculatePlanTotalWithExtras = (plan: Plan) => {
    const basePriceAfterDiscount = calculatePlanBasePrice(plan);
    const extraUnitsCost = calculateExtraUnitsCost(plan);
    return basePriceAfterDiscount + extraUnitsCost;
  };

  const getAddonPrice = (addon: Addon) => {
    return addon.is_onetime ? addon.onetime_price : addon.yearly_price;
  };

  const calculateAddonsTotal = () => {
    // If Professional Plan is selected, only charge for OTA Registration
    if (selectedPlan && selectedPlan.code === 'P-0026') {
      return addons
        .filter(addon => selectedAddons.has(addon.id) && addon.code === 'ota_registration')
        .reduce((sum, addon) => sum + getAddonPrice(addon), 0);
    }

    return addons
      .filter(addon => selectedAddons.has(addon.id))
      .reduce((sum, addon) => sum + getAddonPrice(addon), 0);
  };

  const calculateTotal = () => {
    if (!selectedPlan) return 0;
    return calculatePlanTotalWithExtras(selectedPlan) + calculateAddonsTotal();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#132ef5]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="bg-gradient-to-br from-[#f7f9fc] to-[#ffede2] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#021441] mb-2">
          {t('How many units do you have?', 'كم عدد الوحدات لديك؟')}
        </h2>
        <p className="text-[#8089a0] mb-6">
          {t('Enter your number of units and we\'ll recommend the best plan', 'أدخل عدد الوحدات وسنوصي بأفضل خطة')}
        </p>
        <input
          type="number"
          min="1"
          value={unitsCount}
          onChange={(e) => setUnitsCount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full md:w-64 px-6 py-4 text-xl font-semibold border-2 border-[#132ef5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#132ef5] focus:ring-opacity-50 transition-all"
        />
      </div>

      <div>
        <h3 className="text-xl font-bold text-[#021441] mb-4">
          {t('Choose Your Plan', 'اختر خطتك')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isRecommended = selectedPlan?.id === plan.id;
            const extraUnits = calculateExtraUnits(plan);
            const fitsUnits = unitsCount <= plan.units_quota;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${isRecommended
                  ? 'bg-[#132ef5] text-white shadow-xl scale-105 border-2 border-[#132ef5]'
                  : 'bg-white text-[#021441] shadow-md hover:shadow-lg border border-gray-200'
                  }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#021441] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    {t('Recommended', 'موصى به')}
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-bold">
                    {language === 'en' ? plan.name_en : plan.name_ar}
                  </h4>
                  {isRecommended && <Check className="w-6 h-6" />}
                </div>

                <p className={`text-sm mb-4 ${isRecommended ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                  {language === 'en' ? plan.target_customer_en : plan.target_customer_ar}
                </p>

                <div className="space-y-2 mb-4">
                  {plan.discount_percentage > 0 ? (
                    <>
                      <div className={`text-lg line-through ${isRecommended ? 'text-blue-200' : 'text-[#8089a0]'}`}>
                        {applyVat(plan.yearly_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-3xl font-bold ${isRecommended ? 'text-white' : 'text-[#132ef5]'}`}>
                        {applyVat(plan.yearly_price * (1 - plan.discount_percentage / 100)).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-sm ${isRecommended ? 'text-blue-100' : 'text-green-600'} font-semibold`}>
                        {t(`Save ${plan.discount_percentage}%`, `وفر ${plan.discount_percentage}٪`)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`text-3xl font-bold ${isRecommended ? 'text-white' : 'text-[#132ef5]'}`}>
                        {applyVat(plan.yearly_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                      </div>
                      <div className={`text-sm ${isRecommended ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                        {t('per year', 'سنوياً')}
                      </div>
                    </>
                  )}
                </div>

                <div className={`space-y-2 text-sm ${isRecommended ? 'text-blue-100' : 'text-[#8089a0]'}`}>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>
                      {fitsUnits ? (
                        <>{plan.units_quota} {t('units', 'وحدة')}</>
                      ) : (
                        <>{plan.units_quota} {t('units', 'وحدة')} + {extraUnits} {t('extra', 'إضافية')}</>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>{language === 'en' ? plan.support_type_en : plan.support_type_ar}</span>
                  </div>
                  {plan.reservations_quota === -1 ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{t('Unlimited reservations', 'حجوزات غير محدودة')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{plan.reservations_quota.toLocaleString()} {t('reservations', 'حجز')}</span>
                    </div>
                  )}
                  {!fitsUnits && plan.additional_unit_price > 0 && (
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      <span className="text-xs">
                        {plan.additional_unit_price} {t('SAR per extra unit', 'ريال لكل وحدة إضافية')}
                      </span>
                    </div>
                  )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const isSelected = selectedAddons.has(addon.id);
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
                <div className="text-lg font-bold text-[#132ef5]">
                  {applyVat(getAddonPrice(addon)).toLocaleString('en-US', { maximumFractionDigits: 0 })} {addon.is_onetime ? t('SAR (one-time)', 'ريال (مرة واحدة)') : t('SAR/year', 'ريال/سنة')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-[#021441] mb-6">
            {t('Pricing Summary', 'ملخص الأسعار')}
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[#8089a0]">
                {language === 'en' ? selectedPlan.name_en : selectedPlan.name_ar} ({selectedPlan.units_quota} {t('units', 'وحدة')})
              </span>
              <span className="font-semibold text-[#021441]">
                {applyVat(selectedPlan.yearly_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
              </span>
            </div>

            {selectedPlan.discount_percentage > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>
                  {t('Plan Discount', 'خصم الخطة')} ({selectedPlan.discount_percentage}%)
                </span>
                <span className="font-semibold">
                  -{applyVat((selectedPlan.yearly_price * selectedPlan.discount_percentage) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            )}

            {calculateExtraUnits(selectedPlan) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[#8089a0]">
                  {calculateExtraUnits(selectedPlan)} {t('extra units', 'وحدة إضافية')} × {applyVat(selectedPlan.additional_unit_price).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
                <span className="font-semibold text-[#021441]">
                  {applyVat(calculateExtraUnitsCost(selectedPlan)).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            )}

            {discountPercentage > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>
                  {t('Additional Discount', 'خصم إضافي')} ({discountPercentage}%)
                </span>
                <span className="font-semibold">
                  -{applyVat(((selectedPlan.yearly_price * (1 - selectedPlan.discount_percentage / 100)) * discountPercentage) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            )}

            {(calculateExtraUnits(selectedPlan) > 0 || discountPercentage > 0 || selectedPlan.discount_percentage > 0) && (
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-medium text-[#021441]">
                  {t('Plan Subtotal', 'المجموع الفرعي للخطة')}
                </span>
                <span className="font-bold text-[#021441]">
                  {applyVat(calculatePlanTotalWithExtras(selectedPlan)).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
                </span>
              </div>
            )}

            {selectedAddons.size > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-[#021441] mb-2">{t('Add-ons:', 'الإضافات:')}</p>
                {addons
                  .filter(addon => selectedAddons.has(addon.id))
                  .map(addon => {
                    const isProfessionalPlan = selectedPlan && selectedPlan.code === 'P-0026';
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
                          {isIncluded ? t('Included', 'مشمول') : `${applyVat(getAddonPrice(addon)).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${t('SAR', 'ريال')}`}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}

            <div className="pt-4">
              <label className="block text-sm font-medium text-[#021441] mb-2">
                {t('Additional Discount (%)', 'خصم إضافي (%)')}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#132ef5] transition-all"
                placeholder="0"
              />
              <p className="text-xs text-[#8089a0] mt-1">
                {t('Additional discount applies to discounted plan price only, not add-ons', 'الخصم الإضافي يطبق على سعر الخطة المخفض فقط، وليس على الإضافات')}
              </p>
            </div>
          </div>

          {includeVat && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-[#8089a0]">
                  {t('Subtotal', 'المجموع الفرعي')}
                </span>
                <span className="font-semibold text-[#021441]">
                  {(calculateTotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
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
              {t('Total', 'المجموع')}
            </span>
            <span className="text-3xl font-bold text-[#132ef5]">
              {applyVat(calculateTotal()).toLocaleString('en-US', { maximumFractionDigits: 0 })} {t('SAR', 'ريال')}
            </span>
          </div>
          <p className="text-sm text-[#8089a0] text-center mt-2">
            {t('Billed annually', 'يتم الدفع سنوياً')}
          </p>
        </div>
      )}
    </div>
  );
}
