import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error('Supabase authentication is not configured');
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (updates) => {
        try {
          updates.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server components cannot write cookies; middleware handles refresh.
        }
      },
    },
  });
}
