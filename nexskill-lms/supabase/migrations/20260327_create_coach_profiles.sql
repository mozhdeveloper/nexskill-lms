-- Migration: Create coach_profiles table
-- Run this in your Supabase SQL Editor at: https://app.supabase.com/project/_/sql

-- Create coach_profiles table
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT,
  bio TEXT,
  experience_level TEXT CHECK (experience_level IN ('Beginner', 'Intermediate', 'Expert')),
  content_areas TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  portfolio_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for coach_profiles
-- Allow authenticated users to view their own coach profile
CREATE POLICY "Users can view own coach profile"
  ON public.coach_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to update their own coach profile
CREATE POLICY "Users can update own coach profile"
  ON public.coach_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own coach profile
CREATE POLICY "Users can insert own coach profile"
  ON public.coach_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow admins to view all coach profiles
CREATE POLICY "Admins can view all coach profiles"
  ON public.coach_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'platform_owner')
    )
  );

-- Allow admins to update all coach profiles
CREATE POLICY "Admins can update all coach profiles"
  ON public.coach_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'platform_owner')
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coach_profiles_verification_status 
  ON public.coach_profiles(verification_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
