-- Add DELETE policy for projects to allow hard deletions
CREATE POLICY "Users can delete own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = user_id);
