-- TABLES

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Project',
  description text,
  canvas_data jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text,
  width integer NOT NULL DEFAULT 1200,
  height integer NOT NULL DEFAULT 1200,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. generated_images
CREATE TABLE public.generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  width integer DEFAULT 1024,
  height integer DEFAULT 1024,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_user_id_deleted_at ON public.projects(user_id, deleted_at);
CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id);
CREATE INDEX idx_generated_images_project_id ON public.generated_images(project_id);

-- TRIGGERS

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();


-- ROW LEVEL SECURITY

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- profiles RLS
CREATE POLICY "Users can read their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- projects RLS
CREATE POLICY "Users can read own not-deleted projects" 
  ON public.projects FOR SELECT 
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
  ON public.projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = user_id);

-- generated_images RLS
CREATE POLICY "Users can read own generated images" 
  ON public.generated_images FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated images" 
  ON public.generated_images FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated images" 
  ON public.generated_images FOR DELETE 
  USING (auth.uid() = user_id);


-- STORAGE BUCKETS

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-thumbnails', 'project-thumbnails', false, 5242880, '{image/jpeg,image/png,image/webp}'),
  ('generated-images', 'generated-images', false, 10485760, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS (Requires enabling RLS on storage.objects if not already enabled, but Supabase enables it by default)
-- However we will just add the policies directly.

-- project-thumbnails
CREATE POLICY "Users can access their own thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can insert their own thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

-- generated-images
CREATE POLICY "Users can access their own generated images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can insert their own generated images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own generated images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own generated images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- GRANTS

-- Explicitly grant privileges to anon and authenticated to prevent 403 Forbidden
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_images TO authenticated, anon;
