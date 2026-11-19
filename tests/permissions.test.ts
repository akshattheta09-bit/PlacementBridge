import { describe, expect, it } from 'vitest';
import { assertTransition, can } from '../src/lib/permissions';
describe('announcement authorization',()=>{
 it('does not let students create, approve or publish',()=>{for(const action of ['submit','approve','publish'] as const) expect(()=>assertTransition(['STUDENT'],action,action==='submit'?'DRAFT':action==='approve'?'PENDING_REVIEW':'APPROVED','author','student')).toThrow();});
 it('prevents self approval and invalid transitions',()=>{expect(()=>assertTransition(['OFFICER'],'approve','PENDING_REVIEW','author','author')).toThrow();expect(()=>assertTransition(['OFFICER'],'publish','DRAFT','author','other')).toThrow();});
 it('permits a separate officer to approve and publish an approved notice',()=>{expect(()=>assertTransition(['OFFICER'],'approve','PENDING_REVIEW','author','other')).not.toThrow();expect(()=>assertTransition(['OFFICER'],'publish','APPROVED','author','other')).not.toThrow();});
 it('does not give administrators or reviewers publication permissions',()=>{expect(can(['ADMIN'],'announcement.publish')).toBe(false);expect(can(['REVIEWER'],'announcement.publish')).toBe(false);});
});
