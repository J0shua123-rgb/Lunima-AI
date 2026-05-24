import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditorLayout from "./EditorLayout";

export default async function EditorPage({ params }: { params: { projectId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    redirect("/dashboard");
  }

  return (
    <EditorLayout 
      project={project}
    />
  );
}
