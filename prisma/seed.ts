import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
const db = new PrismaClient();
async function main() {
 if (process.env.APP_MODE !== 'development' || process.env.NODE_ENV === 'production' || !process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 12) throw new Error('Seed requires development mode and a local demo password of at least 12 characters');
 if (!process.env.DATABASE_URL || !['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname)) throw new Error('Demo seed requires a local database');
 const institution = await db.institution.upsert({where:{id:'demo-institution'},update:{},create:{id:'demo-institution',name:'Synthetic demonstration institution'}});
 const passwordHash = await hash(process.env.DEMO_PASSWORD,12);
 for (const [email,name,role] of [['student@example.test','Avery Student','STUDENT'],['officer@example.test','Morgan Officer','OFFICER'],['approver@example.test','Jordan Approver','OFFICER'],['reviewer@example.test','Sam Reviewer','REVIEWER'],['admin@example.test','Taylor Administrator','ADMIN']] as const) {
  const user = await db.user.upsert({where:{email},update:{},create:{institutionId:institution.id,email,name,passwordHash}});
  await db.roleAssignment.upsert({where:{userId_role:{userId:user.id,role}},update:{},create:{userId:user.id,role}});
 }
}
main().finally(()=>db.$disconnect());
