/*
  # Add One-Time Payment Support for Add-ons

  1. Changes
    - Add `is_onetime` column to `addons` table to distinguish between yearly and one-time add-ons
    - Add `onetime_price` column to store the one-time payment price
    - Insert new "OTA Registration" add-on with one-time payment

  2. Notes
    - Existing add-ons default to `is_onetime = false` (yearly subscription)
    - One-time add-ons use `onetime_price` instead of `yearly_price`
*/

-- Add columns to support one-time payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addons' AND column_name = 'is_onetime'
  ) THEN
    ALTER TABLE addons ADD COLUMN is_onetime boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addons' AND column_name = 'onetime_price'
  ) THEN
    ALTER TABLE addons ADD COLUMN onetime_price numeric DEFAULT 0;
  END IF;
END $$;

-- Insert OTA Registration add-on
INSERT INTO addons (
  code,
  name_en,
  name_ar,
  description_en,
  description_ar,
  yearly_price,
  onetime_price,
  is_onetime,
  is_active,
  sort_order
) VALUES (
  'ota_registration',
  'OTA Registration',
  'إنشاء حسابات في مواقع الحجوزات',
  'Create accounts on booking platforms',
  'إنشاء حسابات في مواقع الحجوزات',
  0,
  1200,
  true,
  true,
  3
) ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  onetime_price = EXCLUDED.onetime_price,
  is_onetime = EXCLUDED.is_onetime,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();