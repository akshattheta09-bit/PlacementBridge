export type Role = 'STUDENT' | 'OFFICER' | 'REVIEWER' | 'ADMIN';
export type Permission = 'announcement.read' | 'announcement.create' | 'announcement.review' | 'announcement.publish' | 'reviewer.enter' | 'admin.enter';
const permissions: Record<Role, Permission[]> = {
 STUDENT: ['announcement.read'], OFFICER: ['announcement.read','announcement.create','announcement.review','announcement.publish'], REVIEWER: ['reviewer.enter'], ADMIN: ['admin.enter']
};
export function can(roles: Role[], permission: Permission): boolean { return roles.some(role => permissions[role].includes(permission)); }
export function requirePermission(roles: Role[], permission: Permission) { if (!can(roles, permission)) throw new Error('Access denied'); }
export function assertTransition(roles: Role[], action: 'submit'|'approve'|'publish', status: string, creatorId: string, actorId: string) {
 const required = action === 'submit' ? 'announcement.create' : action === 'approve' ? 'announcement.review' : 'announcement.publish';
 requirePermission(roles, required);
 const expected = {submit:'DRAFT', approve:'PENDING_REVIEW', publish:'APPROVED'}[action];
 if (status !== expected || (action === 'submit' && creatorId !== actorId) || (action === 'approve' && creatorId === actorId)) throw new Error('Invalid or unauthorized transition');
}
