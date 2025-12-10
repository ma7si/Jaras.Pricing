/*
  # Jaras Platform Pricing System

  1. New Tables
    - `plans`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Plan code (P-0027, P-0023, etc.)
      - `name_en` (text) - Plan name in English
      - `name_ar` (text) - Plan name in Arabic
      - `target_customer_en` (text) - Target customer description in English
      - `target_customer_ar` (text) - Target customer description in Arabic
      - `yearly_price` (numeric) - Base yearly price
      - `discount_percentage` (numeric) - Default discount percentage
      - `units_quota` (integer) - Number of units included
      - `additional_unit_price` (numeric) - Price per additional unit
      - `reservations_quota` (integer) - Number of reservations (-1 for unlimited)
      - `support_type_en` (text) - Support type in English
      - `support_type_ar` (text) - Support type in Arabic
      - `sort_order` (integer) - Display order
      - `is_active` (boolean) - Whether plan is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `addons`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Addon code
      - `name_en` (text) - Addon name in English
      - `name_ar` (text) - Addon name in Arabic
      - `description_en` (text) - Description in English
      - `description_ar` (text) - Description in Arabic
      - `yearly_price` (numeric) - Yearly price
      - `is_active` (boolean) - Whether addon is active
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_email` (text) - User email
      - `plan_id` (uuid, foreign key) - Current plan
      - `subscription_start` (timestamptz) - Subscription start date
      - `subscription_end` (timestamptz) - Subscription end date
      - `units_count` (integer) - Number of units
      - `total_paid` (numeric) - Total amount paid
      - `is_active` (boolean) - Whether subscription is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_subscription_addons`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, foreign key) - Reference to subscription
      - `addon_id` (uuid, foreign key) - Reference to addon
      - `added_at` (timestamptz) - When addon was added
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (for pricing calculator)
    - Add policies for authenticated users to manage their subscriptions
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  target_customer_en text,
  target_customer_ar text,
  yearly_price numeric NOT NULL,
  discount_percentage numeric DEFAULT 0,
  units_quota integer NOT NULL,
  additional_unit_price numeric NOT NULL,
  reservations_quota integer DEFAULT -1,
  support_type_en text,
  support_type_ar text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  yearly_price numeric NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  subscription_start timestamptz NOT NULL,
  subscription_end timestamptz NOT NULL,
  units_count integer NOT NULL,
  total_paid numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscription_addons table
CREATE TABLE IF NOT EXISTS user_subscription_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  addon_id uuid REFERENCES addons(id) NOT NULL,
  added_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscription_addons ENABLE ROW LEVEL SECURITY;

-- Public read access for plans and addons (needed for pricing calculator)
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view active addons"
  ON addons FOR SELECT
  TO public
  USING (is_active = true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users can view own subscription addons"
  ON user_subscription_addons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_subscriptions.id = user_subscription_addons.subscription_id
      AND user_subscriptions.user_email = auth.jwt()->>'email'
    )
  );

-- Insert plans data based on the spreadsheet
INSERT INTO plans (code, name_en, name_ar, target_customer_en, target_customer_ar, yearly_price, discount_percentage, units_quota, additional_unit_price, reservations_quota, support_type_en, support_type_ar, sort_order) VALUES
('P-0027', 'Beginner Plan', 'الخطة الابتدائية', 'Small private units and studios', 'ملاك الوحدات الخاصة والاستديوهات', 833, 10, 7, 96, 3500, 'Chat', 'شات', 1),
('P-0023', 'Basic Plan', 'الخطة الأساسية', 'Small and medium hotels', 'الفنادق المتوسطة', 1222, 10, 45, 72, -1, 'Chat', 'شات', 2),
('P-0024', 'Growth Plan', 'خطة النمو', 'Small and medium hotels and private buildings', 'الفنادق الصغيرة والمتوسطة ومرافق الإيواء السياحي الخاصة', 1522, 10, 100, 60, -1, 'Account Manager', 'مدير حساب', 3),
('P-0025', 'Scale Plan', 'خطة التوسع', 'Medium and large hotels', 'الفنادق المتوسطة والكبيرة', 2333, 10, 200, 48, -1, 'Account Manager', 'مدير حساب', 4),
('P-0026', 'Professional Plan', 'الخطة الاحترافية', 'Large hotel groups and real estate management', 'المجموعات الفندقية الكبرى وإدارة محافظ العقارات الفندقية', 5390, 10, 500, 0, -1, 'Account Manager', 'مدير حساب', 5);

-- Insert addons data based on the spreadsheet
INSERT INTO addons (code, name_en, name_ar, description_en, description_ar, yearly_price, sort_order) VALUES
('shomoos', 'Shomoos Integration', 'الربط مع شموس', 'Link with Shomoos', 'الربط مع شموس', 800, 1),
('tourims', 'Tourism Integration', 'الربط مع منصة السياحة', 'Link with tourism platform', 'الربط مع منصة السياحة', 300, 2),
('einvoicelv2', 'E-Invoice v2 Integration', 'التوافق مع المرحلة الثانية من الفاتورة الإلكترونية', 'E-Invoice Phase 2 Integration', 'التوافق مع المرحلة الثانية من الفاتورة الإلكترونية', 480, 3),
('bookingengine', 'Booking Engine', 'الموقع الإلكتروني', 'Website booking engine', 'الموقع الإلكتروني', 348, 4),
('channelmanager', 'Channel Manager', 'مواقع الحجوزات', 'Booking sites integration', 'مواقع الحجوزات', 1116, 5),
('jaraspay', 'Jaras Pay', 'ج رابط الدفع', 'Payment link for one-time payments', 'رابط الدفع لمرة واحدة', 240, 6),
('training', 'Training', 'تدريب', 'Training sessions', 'تدريب', 340, 7);
