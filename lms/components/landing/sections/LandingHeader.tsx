import { googleSignInAction } from "@/app/actions/auth-actions";

export function LandingHeader() {
  return (
    <header className="site" id="hdr">
      <div className="wrap nav">
        <div className="brand">OpenGrapes</div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#ai">Platform</a>
        </nav>
        <div className="nav-actions">
          <form action={googleSignInAction}>
            <button type="submit" className="btn btn-primary">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
