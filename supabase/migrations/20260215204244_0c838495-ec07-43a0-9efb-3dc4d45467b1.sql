-- Create storage bucket for CEFR data files
INSERT INTO storage.buckets (id, name, public) VALUES ('cefr-data', 'cefr-data', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "CEFR data is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'cefr-data');