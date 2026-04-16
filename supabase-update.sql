-- Supabase Update Script
-- Paste this into your Supabase SQL Editor and hit "RUN" to upgrade your schema for Phase 2

-- Add the new timezone/country columns to the wishes table
ALTER TABLE public.wishes
ADD COLUMN IF NOT EXISTS country text default 'India',
ADD COLUMN IF NOT EXISTS timezone text default 'Asia/Kolkata';

-- Just making sure existing data (if any) sets correctly
UPDATE public.wishes SET country = 'India', timezone = 'Asia/Kolkata' WHERE timezone IS NULL;
