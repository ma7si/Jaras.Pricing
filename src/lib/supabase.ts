import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Plan = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  target_customer_en: string;
  target_customer_ar: string;
  yearly_price: number;
  discount_percentage: number;
  units_quota: number;
  additional_unit_price: number;
  reservations_quota: number;
  support_type_en: string;
  support_type_ar: string;
  sort_order: number;
  is_active: boolean;
};

export type Addon = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  yearly_price: number;
  is_onetime: boolean;
  onetime_price: number;
  is_active: boolean;
  sort_order: number;
};

export type UserSubscription = {
  id: string;
  user_email: string;
  plan_id: string;
  subscription_start: string;
  subscription_end: string;
  units_count: number;
  total_paid: number;
  is_active: boolean;
};
