import { googleSignInAction } from "@/app/actions/auth-actions";
import { CredentialsSignInForm } from "@/components/auth/CredentialsSignInForm";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

/* The sign-in card, on the landing itself. Email + password leads — it works
   for every role with a password — and Google follows as the student path. */
export function LandingSignIn() {
  return (
    <section className="band sunken" id="signin">
      <div className="wrap">
        <div className="signin-card reveal">
          <div className="eyebrow">Sign in</div>
          <h2>
            Pick up where the <em>class</em> left off.
          </h2>
          <div className="signin-form">
            <CredentialsSignInForm />
          </div>
          <div className="signin-or" aria-hidden="true">
            <span>or</span>
          </div>
          <form action={googleSignInAction}>
            <button type="submit" className="btn btn-outline signin-google">
              <GoogleIcon />
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
