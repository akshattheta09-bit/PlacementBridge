'use client';

import { useFormStatus } from 'react-dom';

export function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </button>
  );
}
