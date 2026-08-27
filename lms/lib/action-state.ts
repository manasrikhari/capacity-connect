/** Shared shape returned by server actions used with useActionState. */
export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
} | null;

export const initialActionState: ActionState = null;
