'use server';
import { currentUser } from '@/lib/auth';
import { createAnnouncement, transition } from '@/lib/announcements';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
async function actor(){const user=await currentUser();if(!user) throw new Error('Access denied');return user;}
export async function create(form:FormData){const user=await actor();try{await createAnnouncement(user,{title:form.get('title'),summary:form.get('summary'),content:form.get('content'),source:form.get('source')});}catch{redirect('/portal?error=create');}revalidatePath('/portal');redirect('/portal');}
export async function change(form:FormData){const user=await actor();const id=form.get('id'), action=form.get('action');if(typeof id!=='string'||(action!=='submit'&&action!=='approve'&&action!=='publish')) throw new Error('Invalid request');try{await transition(user,id,action);}catch{redirect('/portal?error=transition');}revalidatePath('/portal');redirect('/portal');}
