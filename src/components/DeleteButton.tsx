"use client";

import { useActionState } from "react";

export interface DeleteActionState {
  error?: string;
}

const initialState: DeleteActionState = {};

export function DeleteButton({
  action,
  label = "Delete",
  pendingLabel = "Deleting…",
}: {
  action: (prevState: DeleteActionState, formData: FormData) => Promise<DeleteActionState>;
  label?: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        >
          {pending ? pendingLabel : label}
        </button>
      </form>
      {state.error && <p className="max-w-xs text-right text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
