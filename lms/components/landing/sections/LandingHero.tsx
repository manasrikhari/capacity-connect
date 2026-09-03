export function LandingHero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <div className="eyebrow reveal">MoES · India Meteorological Department</div>
          <h1 className="reveal d1" id="heroTitle">
            Capacity building that
            <br />
            <em>remembers</em>
            <br />
            every session.
          </h1>
          <p className="lede reveal d2" id="heroLede">
            Capacity Connect is IMD&apos;s training platform — live classrooms, assessments,
            competency mapping, and MeghDoot, an AI that recalls everything taught. Digital
            capacity building for India&apos;s weather and climate services.
          </p>
          <div className="hero-cta reveal d3">
            <a href="#signin" className="btn btn-primary btn-lg">
              Sign in to begin
            </a>
          </div>
          <div className="hero-note reveal d3">
            <i data-lucide="check-circle-2" /> Demo — trainer / 1234 · trainee / 1234 · admin /
            Admin@2026
          </div>
        </div>

        <div className="mock reveal d2">
          <div className="mock-frame">
            <div className="mock-bar">
              <i /><i /><i />
              <span className="ttl">
                <span className="live">●</span> Radar Meteorology · DWR Cohort — Live
              </span>
            </div>
            <div className="mock-screen">
              <div className="mock-stage">
                <div className="mock-board">
                  <div className="bd-write q">
                    Q: A Doppler radar reads 240 km range in 3 sweeps. Find the sweep spacing.
                  </div>
                  <div className="bd-write a">
                    = 80 km
                  </div>
                  <div className="cursor">
                    <i data-lucide="mouse-pointer-2" />
                    <span>Dr.Rao</span>
                  </div>
                  <div className="cursor green">
                    <i data-lucide="mouse-pointer-2" />
                    <span>Anya</span>
                  </div>
                  <div className="mock-teacher">
                    <b>Dr. Rao</b>
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
              <b>MeghDoot AI</b>
              <span className="badge">LIVE</span>
            </div>
            <p>
              <span className="q">&ldquo;What was the cyclone-warning lead time she just mentioned?&rdquo;</span>
              48 hours for the RMC bulletin — noted at 12:04 in today&apos;s session.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
