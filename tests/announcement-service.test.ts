import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
 record: null as null | { id:string; institutionId:string; createdById:string; status:string },
 audits: [] as string[],
}));
vi.mock('../src/lib/db', () => {
 const tx = {
  announcement: {
   findFirst: async ({where}:{where:{id:string;institutionId:string}}) => state.record?.id === where.id && state.record.institutionId === where.institutionId ? {...state.record} : null,
   updateMany: async ({where,data}:{where:{id:string;institutionId:string;status:string};data:{status:string}}) => {
    if (!state.record || state.record.id !== where.id || state.record.institutionId !== where.institutionId || state.record.status !== where.status) return {count:0};
    state.record = {...state.record, ...data}; return {count:1};
   },
  },
  auditEvent: {create: async ({data}:{data:{action:string}}) => {state.audits.push(data.action);}},
 };
 return {db: {$transaction: async (fn:(client:typeof tx)=>Promise<unknown>) => fn(tx)}};
});
import { transition } from '../src/lib/announcements';
import type { Actor } from '../src/lib/announcements';
const author:Actor={id:'author',institutionId:'one',roles:['OFFICER']};
const reviewer:Actor={id:'reviewer',institutionId:'one',roles:['OFFICER']};
const student:Actor={id:'student',institutionId:'one',roles:['STUDENT']};
const outsider:Actor={id:'outside',institutionId:'two',roles:['OFFICER']};
beforeEach(()=>{state.record={id:'notice',institutionId:'one',createdById:'author',status:'DRAFT'};state.audits=[];});
describe('announcement service authorization',()=>{
 it('enforces the full independent review sequence and records actions',async()=>{
  await transition(author,'notice','submit');
  await expect(transition(author,'notice','approve')).rejects.toThrow();
  await transition(reviewer,'notice','approve');
  await transition(reviewer,'notice','publish');
  expect(state.record?.status).toBe('PUBLISHED');
  expect(state.audits).toEqual(['announcement.submit','announcement.approve','announcement.publish']);
 });
 it('rejects a student calling the service directly',async()=>{
  await expect(transition(student,'notice','submit')).rejects.toThrow();
  expect(state.record?.status).toBe('DRAFT'); expect(state.audits).toEqual([]);
 });
 it('rejects an officer from another institution even with a known identifier',async()=>{
  await expect(transition(outsider,'notice','submit')).rejects.toThrow('Resource unavailable');
  expect(state.record?.status).toBe('DRAFT'); expect(state.audits).toEqual([]);
 });
 it('rejects publication without approval',async()=>{
  await expect(transition(reviewer,'notice','publish')).rejects.toThrow();
  expect(state.record?.status).toBe('DRAFT');
 });
});
