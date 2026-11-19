import { db } from './db';
import { assertTransition, requirePermission, type Role } from './permissions';
import { z } from 'zod';
export type Actor = {id:string; institutionId:string; roles:Role[]};
export const announcementSchema = z.object({title:z.string().trim().min(5).max(160),summary:z.string().trim().min(10).max(400),content:z.string().trim().min(20).max(10000),source:z.string().trim().min(5).max(500)});
export async function createAnnouncement(actor:Actor, input:unknown) {
 requirePermission(actor.roles,'announcement.create');
 const data = announcementSchema.parse(input);
 return db.$transaction(async tx => { const item = await tx.announcement.create({data:{...data,institutionId:actor.institutionId,createdById:actor.id}}); await tx.auditEvent.create({data:{institutionId:actor.institutionId,actorId:actor.id,action:'announcement.create',resourceId:item.id}}); return item; });
}
export async function transition(actor:Actor, id:string, action:'submit'|'approve'|'publish') {
 return db.$transaction(async tx => {
  const item = await tx.announcement.findFirst({where:{id,institutionId:actor.institutionId}});
  if (!item) throw new Error('Resource unavailable');
  assertTransition(actor.roles,action,item.status,item.createdById,actor.id);
  const data = action === 'submit' ? {status:'PENDING_REVIEW' as const} : action === 'approve' ? {status:'APPROVED' as const,approvedById:actor.id} : {status:'PUBLISHED' as const,publishedById:actor.id,publishedAt:new Date()};
  const updated = await tx.announcement.updateMany({where:{id,institutionId:actor.institutionId,status:item.status},data});
  if (updated.count !== 1) throw new Error('Announcement changed; retry');
  await tx.auditEvent.create({data:{institutionId:actor.institutionId,actorId:actor.id,action:`announcement.${action}`,resourceId:id}});
 });
}
