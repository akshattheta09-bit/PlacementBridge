'use server';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { can } from '@/lib/permissions';

const privileged = [Role.OFFICER, Role.REVIEWER, Role.ADMIN] as const;
function requestedRole(value: FormDataEntryValue | null) {
  return privileged.find((role) => role === value);
}

export async function requestRole(form: FormData) {
  const actor = await currentUser();
  if (!actor) redirect('/login');
  const role = requestedRole(form.get('role'));
  if (!role || actor.roles.includes(role))
    redirect('/portal?view=profile&error=role');
  try {
    await db.roleRequest.create({ data: { userId: actor.id, role } });
  } catch {
    redirect('/portal?view=profile&error=role');
  }
  revalidatePath('/portal');
  redirect('/portal?view=profile&result=requested');
}

export async function reviewRole(form: FormData) {
  const actor = await currentUser();
  if (!actor || !can(actor.roles, 'admin.enter'))
    throw new Error('Access denied');
  const id = form.get('id');
  const decision = form.get('decision');
  if (typeof id !== 'string' || (decision !== 'approve' && decision !== 'deny'))
    throw new Error('Invalid request');
  await db.$transaction(async (tx) => {
    const request = await tx.roleRequest.findFirst({
      where: {
        id,
        status: 'PENDING',
        user: { institutionId: actor.institutionId },
      },
    });
    if (!request || request.userId === actor.id)
      throw new Error('Request unavailable');
    const changed = await tx.roleRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: decision === 'approve' ? 'APPROVED' : 'DENIED',
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      },
    });
    if (changed.count !== 1) throw new Error('Request already reviewed');
    if (decision === 'approve')
      await tx.roleAssignment.upsert({
        where: { userId_role: { userId: request.userId, role: request.role } },
        update: { revokedAt: null, expiresAt: null },
        create: { userId: request.userId, role: request.role },
      });
    await tx.auditEvent.create({
      data: {
        institutionId: actor.institutionId,
        actorId: actor.id,
        action: 'role.' + decision,
        resourceId: request.userId,
      },
    });
  });
  revalidatePath('/portal');
  redirect('/portal?view=accounts');
}

export async function revokeRole(form: FormData) {
  const actor = await currentUser();
  if (!actor || !can(actor.roles, 'admin.enter'))
    throw new Error('Access denied');
  const userId = form.get('userId');
  const role = requestedRole(form.get('role'));
  if (typeof userId !== 'string' || !role || userId === actor.id)
    throw new Error('Invalid request');
  await db.$transaction(async (tx) => {
    const changed = await tx.roleAssignment.updateMany({
      where: {
        userId,
        role,
        revokedAt: null,
        user: { institutionId: actor.institutionId },
      },
      data: { revokedAt: new Date() },
    });
    if (changed.count !== 1) throw new Error('Role unavailable');
    await tx.auditEvent.create({
      data: {
        institutionId: actor.institutionId,
        actorId: actor.id,
        action: 'role.revoke.' + role,
        resourceId: userId,
      },
    });
  });
  revalidatePath('/portal');
  redirect('/portal?view=accounts');
}

export async function assignRole(form: FormData) {
  const actor = await currentUser();
  if (!actor || !can(actor.roles, 'admin.enter'))
    throw new Error('Access denied');
  const userId = form.get('userId');
  const role = requestedRole(form.get('role'));
  if (typeof userId !== 'string' || !role || userId === actor.id)
    throw new Error('Invalid request');
  await db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: userId, institutionId: actor.institutionId, active: true },
    });
    if (!user) throw new Error('Account unavailable');
    await tx.roleAssignment.upsert({
      where: { userId_role: { userId, role } },
      update: { revokedAt: null, expiresAt: null },
      create: { userId, role },
    });
    await tx.roleRequest.updateMany({
      where: { userId, role, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedBy: actor.id,
        reviewedAt: new Date(),
      },
    });
    await tx.auditEvent.create({
      data: {
        institutionId: actor.institutionId,
        actorId: actor.id,
        action: 'role.assign.' + role,
        resourceId: userId,
      },
    });
  });
  revalidatePath('/portal');
  redirect('/portal?view=accounts');
}
