-- Add new status 'in_store' to equipment_status enum
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'in_store';