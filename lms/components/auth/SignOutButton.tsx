import { signOutAction } from "@/app/actions/auth-actions";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function SignOutButton(props: ButtonProps) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" {...props}>
        Sign out
      </Button>
    </form>
  );
}
