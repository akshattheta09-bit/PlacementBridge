'use server';
import { currentUser } from '@/lib/auth';
import { createAnnouncement, transition } from '@/lib/announcements';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
async function actor() {
  const user = await currentUser();
  if (!user) throw new Error('Access denied');
  return user;
}
export async function create(form: FormData) {
  const user = await actor();
  try {
    await createAnnouncement(
      user,
      {
        title: form.get('title'),
        summary: form.get('summary'),
        content: form.get('content'),
        source: form.get('source'),
      },
      form.get('correctionOfId')
        ? {
            correctionOfId: form.get('correctionOfId'),
            changeReason: form.get('changeReason'),
            studentAction: form.get('studentAction'),
            effectiveDate: form.get('effectiveDate'),
          }
        : undefined,
    );
  } catch {
    const correction = form.get('correctionOfId');
    const params = new URLSearchParams({ view: 'compose', error: 'create' });
    if (typeof correction === 'string') params.set('correction', correction);
    redirect(`/portal?${params}`);
  }
  revalidatePath('/portal');
  redirect('/portal?view=announcements&result=created');
}
export async function change(form: FormData) {
  const user = await actor();
  const id = form.get('id'),
    action = form.get('action');
  if (
    typeof id !== 'string' ||
    (action !== 'submit' && action !== 'approve' && action !== 'publish')
  )
    throw new Error('Invalid request');
  const view = form.get('view') === 'review' ? 'review' : 'announcements';
  try {
    await transition(user, id, action);
  } catch {
    redirect(`/portal?view=${view}&error=transition`);
  }
  revalidatePath('/portal');
  const result = {
    submit: 'submitted',
    approve: 'approved',
    publish: 'published',
  }[action];
  redirect(`/portal?view=${view}&result=${result}`);
}
