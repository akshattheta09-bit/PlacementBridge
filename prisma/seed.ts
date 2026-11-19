import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();
const accounts = [
  ['student@example.test', 'Avery Student', 'STUDENT'],
  ['officer@example.test', 'Morgan Officer', 'OFFICER'],
  ['approver@example.test', 'Jordan Approver', 'OFFICER'],
  ['reviewer@example.test', 'Sam Reviewer', 'REVIEWER'],
  ['admin@example.test', 'Taylor Administrator', 'ADMIN'],
] as const;

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (
    process.env.APP_MODE !== 'development' ||
    process.env.NODE_ENV === 'production' ||
    !password ||
    password.length < 12
  ) {
    throw new Error(
      'Seed requires development mode and a local demo password of at least 12 characters',
    );
  }
  if (
    !process.env.DATABASE_URL ||
    !['localhost', '127.0.0.1'].includes(
      new URL(process.env.DATABASE_URL).hostname,
    )
  ) {
    throw new Error('Demo seed requires a local database');
  }
  const passwordHash = await hash(password, 12);
  await db.$transaction(async (tx) => {
    const institution = await tx.institution.upsert({
      where: { id: 'demo-institution' },
      update: {},
      create: {
        id: 'demo-institution',
        name: 'Synthetic demonstration institution',
      },
    });
    const seeded = new Map<string, string>();
    for (const [email, name, role] of accounts) {
      const user = await tx.user.upsert({
        where: { email },
        update: {},
        create: { institutionId: institution.id, email, name, passwordHash },
      });
      if (user.institutionId !== institution.id)
        throw new Error('Demo email belongs to another institution');
      await tx.roleAssignment.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      });
      seeded.set(email, user.id);
    }
    const officer = seeded.get(accounts[1][0])!;
    const approver = seeded.get(accounts[2][0])!;
    const samples = [
      {
        id: 'a0010000-0000-4000-8000-000000000001',
        title: 'Interview practice session moved',
        summary: 'The demo practice session now starts at 2:00 pm IST.',
        content:
          'Students who planned to attend can use the updated time. This synthetic exercise does not correspond to an actual university event.',
        source: 'Synthetic training memo PB-01',
        status: 'PUBLISHED' as const,
        approvedById: approver,
        publishedById: approver,
        publisherName: accounts[2][1],
        publishedAt: new Date('2026-11-18T05:00:00Z'),
      },
      {
        id: 'a0010000-0000-4000-8000-000000000002',
        title: 'Résumé clinic check-in instructions',
        summary:
          'Bring a copy of your résumé to the synthetic practice clinic.',
        content:
          'The fictional clinic will open for check-in 15 minutes before the practice session. This is sample content for the independent officer review workflow.',
        source: 'Synthetic training memo PB-02',
        status: 'PENDING_REVIEW' as const,
      },
    ];
    for (const sample of samples) {
      const existing = await tx.announcement.findUnique({
        where: { id: sample.id },
        select: { institutionId: true },
      });
      if (existing && existing.institutionId !== institution.id)
        throw new Error('Demo notice ID belongs to another institution');
      await tx.announcement.upsert({
        where: { id: sample.id },
        update: {},
        create: {
          ...sample,
          institutionId: institution.id,
          createdById: officer,
        },
      });
    }
  });
}

main().finally(() => db.$disconnect());
