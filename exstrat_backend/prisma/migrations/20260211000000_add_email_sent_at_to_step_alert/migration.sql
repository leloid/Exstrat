-- Migration: Add email sent tracking fields to StepAlert
-- This migration adds fields to track when emails have been sent for beforeTP and tpReached alerts

ALTER TABLE "public"."StepAlert" 
ADD COLUMN IF NOT EXISTS "beforeTPEmailSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "tpReachedEmailSentAt" TIMESTAMP(3);

