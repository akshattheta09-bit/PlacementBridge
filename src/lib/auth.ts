import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from './db';
import { z } from 'zod';
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(input) {
        if (
          process.env.APP_MODE !== 'development' ||
          process.env.NODE_ENV === 'production'
        )
          return null;
        const parsed = z
          .object({
            email: z.string().email().max(200),
            password: z.string().min(1).max(200),
          })
          .safeParse(input);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (
          !user?.active ||
          user.institutionId !== 'demo-institution' ||
          !(await compare(parsed.data.password, user.passwordHash))
        )
          return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: { signIn: '/login' },
});
export async function currentUser() {
  const session = await auth();
  if (
    process.env.APP_MODE !== 'development' ||
    process.env.NODE_ENV === 'production' ||
    !session?.user?.email
  )
    return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { roles: true },
  });
  if (!user?.active) return null;
  const roles = user.roles
    .filter((r) => !r.revokedAt && (!r.expiresAt || r.expiresAt > new Date()))
    .map((r) => r.role);
  if (!roles.length) return null;
  return {
    id: user.id,
    institutionId: user.institutionId,
    name: user.name,
    roles,
  };
}
