'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isStartPage, workspaceNavigation } from '@/lib/workspace';

const preferences = z.object({
  preferredName: z
    .string()
    .trim()
    .max(60)
    .regex(/^[^\p{Cc}]*$/u),
  startPage: z.string().max(30),
});

export async function savePreferences(form: FormData) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const parsed = preferences.safeParse({
    preferredName: form.get('preferredName'),
    startPage: form.get('startPage'),
  });
  const allowedPage = parsed.success
    ? workspaceNavigation(user.roles).find(
        ({ view }) => view === parsed.data.startPage && isStartPage(view),
      )?.view
    : undefined;

  if (!parsed.success || !allowedPage || !isStartPage(allowedPage)) {
    redirect('/portal?view=profile&error=profile-input');
  }

  try {
    const updated = await db.user.updateMany({
      where: { id: user.id, institutionId: user.institutionId, active: true },
      data: {
        preferredName: parsed.data.preferredName || null,
        startPage: allowedPage,
      },
    });
    if (updated.count !== 1) throw new Error('Account no longer available');
  } catch {
    redirect('/portal?view=profile&error=profile-save');
  }

  revalidatePath('/portal');
  redirect('/portal?view=profile&result=profile-saved');
}
