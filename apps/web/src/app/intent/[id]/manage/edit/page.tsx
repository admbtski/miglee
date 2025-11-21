import { redirect } from 'next/navigation';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Main edit page - redirects to first step (basics)
 */
export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;
  redirect(`/intent/${id}/manage/edit/basics`);
}

