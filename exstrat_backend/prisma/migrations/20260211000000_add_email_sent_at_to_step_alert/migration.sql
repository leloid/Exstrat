-- Migration: Add email sent tracking fields to StepAlert
-- This migration adds fields to track when emails have been sent for beforeTP and tpReached alerts

-- Add beforeTPEmailSentAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'StepAlert' 
        AND column_name = 'beforeTPEmailSentAt'
    ) THEN
        ALTER TABLE "public"."StepAlert" 
        ADD COLUMN "beforeTPEmailSentAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add tpReachedEmailSentAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'StepAlert' 
        AND column_name = 'tpReachedEmailSentAt'
    ) THEN
        ALTER TABLE "public"."StepAlert" 
        ADD COLUMN "tpReachedEmailSentAt" TIMESTAMP(3);
    END IF;
END $$;
