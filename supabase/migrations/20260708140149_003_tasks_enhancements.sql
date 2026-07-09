/*
# Add category and time to tasks

## Overview
Adds category field and time field to the tasks table to support better organization.

## Changes
- Add `categoria` column with predefined categories
- Add `hora` column for task time

## Categories
- trabalho (Work)
- pessoal (Personal)
- saude (Health)
- financeiro (Financial)
- estudo (Study)
- lazer (Leisure)
- outro (Other)
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'pessoal' CHECK (
  categoria IN ('trabalho', 'pessoal', 'saude', 'financeiro', 'estudo', 'lazer', 'outro')
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS hora time;

CREATE INDEX IF NOT EXISTS idx_tasks_categoria ON tasks(categoria);
