import { db } from './db';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export async function provisionIdentity(identity: SupabaseUser) {
  if (
    !identity.email ||
    !identity.email_confirmed_at ||
    identity.app_metadata.provider !== 'google'
  )
    return null;
  const existing = await db.user.findUnique({
    where: { authSubject: identity.id },
  });
  if (existing) return existing;
  const institutionId = process.env.INSTITUTION_ID;
  if (!institutionId) throw new Error('INSTITUTION_ID is required');
  const email = identity.email.toLowerCase();
  const name =
    typeof identity.user_metadata.full_name === 'string'
      ? identity.user_metadata.full_name.slice(0, 100)
      : email;
  // Do not link an existing account by email: identities must be bound explicitly.
  return db.$transaction(async (tx) => {
    const institution = await tx.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new Error('Configured institution does not exist');
    const user = await tx.user.create({
      data: { institutionId, email, name, authSubject: identity.id },
    });
    await tx.roleAssignment.create({
      data: { userId: user.id, role: 'STUDENT' },
    });
    // Bootstrap requires the exact Supabase user UUID, never an email address.
    if (identity.id === process.env.BOOTSTRAP_ADMIN_SUBJECT) {
      await tx.roleAssignment.create({
        data: { userId: user.id, role: 'ADMIN' },
      });
      await tx.auditEvent.create({
        data: {
          institutionId,
          actorId: user.id,
          action: 'role.bootstrap_admin',
          resourceId: user.id,
        },
      });
    }
    return user;
  });
}
