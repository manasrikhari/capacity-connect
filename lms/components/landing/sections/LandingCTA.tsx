import { googleSignInAction } from "@/app/actions/auth-actions";

export function LandingCTA() {
  return (
    <section className="band">
      <div className="wrap reveal">
        <div className="cta-band">
          <div className="eyebrow">Run your whole batch from one place</div>
          <h2>
            Live classes that <em>remember everything.</em>
          </h2>
          <p id="ctaP">
            Teach it, learn it, and never lose it — live classes that explain
            themselves, for everyone in the room.
          </p>
          <div className="hero-cta">
            <form action={googleSignInAction}>
              <button type="submit" className="btn btn-cream btn-lg">
                Start teaching free
              </button>
            </form>
            <button className="btn btn-line btn-lg">Book a walkthrough</button>
          </div>
        </div>
      </div>
    </section>
  );
}
