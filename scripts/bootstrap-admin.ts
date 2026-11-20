import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
async function main() {
  const subject = process.env.BOOTSTRAP_ADMIN_SUBJECT;
  const institutionId = process.env.INSTITUTION_ID;
  if (!subject || !institutionId)
    throw new Error('Set BOOTSTRAP_ADMIN_SUBJECT and INSTITUTION_ID');
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { authSubject: subject } });
    if (!user || user.institutionId !== institutionId || !user.active)
      throw new Error(
        'Active registered user not found in the configured institution',
      );
    await tx.roleAssignment.upsert({
      where: { userId_role: { userId: user.id, role: 'ADMIN' } },
      create: { userId: user.id, role: 'ADMIN' },
      update: { revokedAt: null, expiresAt: null },
    });
    await tx.auditEvent.create({
      data: {
        institutionId,
        actorId: user.id,
        action: 'role.bootstrap_admin',
        resourceId: user.id,
      },
    });
  });
  console.log('Administrator role assigned to the configured identity.');
}
main().finally(() => db.$disconnect());
