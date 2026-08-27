import { googleSignInAction } from "@/app/actions/auth-actions";

export function LandingHero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <div className="eyebrow reveal">All-in-one live teaching platform</div>
          <h1 className="reveal d1" id="heroTitle">
            Live classes that
            <br />
            <em>remember</em>
            <br />
            everything.
          </h1>
          <p className="lede reveal d2" id="heroLede">
            A live classroom, a shared whiteboard, and an AI that remembers
            every session, one calm place for teachers to teach and students to
            never miss a thing.
          </p>
          <div className="hero-cta reveal d3">
            <form action={googleSignInAction}>
              <button type="submit" className="btn btn-primary btn-lg">
                Get Started
              </button>
            </form>
          </div>
          <div className="hero-note reveal d3">
            <i data-lucide="check-circle-2" /> One-click join · no installs ·
            reliable on any network
          </div>
        </div>

        <div className="mock reveal d2">
          <div className="mock-frame">
            <div className="mock-bar">
              <i /><i /><i />
              <span className="ttl">
                <span className="live">●</span> Physics · Batch A — Live
              </span>
            </div>
            <div className="mock-screen">
              <div className="mock-stage">
                <div className="mock-board">
                  <div className="bd-write q">
                    Q: A train covers 240 km in 3 hours. Find its speed.
                  </div>
                  <div className="bd-write a">
                    = 80 km/h
                  </div>
                  <div className="cursor">
                    <i data-lucide="mouse-pointer-2" />
                    <span>Ms.Iyer</span>
                  </div>
                  <div className="cursor green">
                    <i data-lucide="mouse-pointer-2" />
                    <span>Anya</span>
                  </div>
                  <div className="mock-teacher">
                    <b>Ms. Iyer</b>
                  </div>
                </div>
              </div>
              <div className="mock-rail">
                <div className="tile a" />
                <div className="tile b" />
                <div className="tile c" />
                <div className="tile a" />
              </div>
            </div>
          </div>
          <div className="ai-chip">
            <div className="h">
              <i data-lucide="sparkles" />
              <b>OpenGrapes AI</b>
              <span className="badge">LIVE</span>
            </div>
            <p>
              <span className="q">"What was the deadline she just mentioned?"</span>
              The lab report is due Friday, 6 PM — noted at 12:04 in today&apos;s
              class.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
