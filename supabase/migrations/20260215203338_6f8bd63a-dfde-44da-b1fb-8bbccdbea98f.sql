-- Add unique constraint on descriptor_number for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cefr_descriptors_descriptor_number_key'
  ) THEN
    ALTER TABLE public.cefr_descriptors ADD CONSTRAINT cefr_descriptors_descriptor_number_key UNIQUE (descriptor_number);
  END IF;
END $$;
