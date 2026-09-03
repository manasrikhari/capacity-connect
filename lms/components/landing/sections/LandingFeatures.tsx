import { ROLE_DESCRIPTION } from "@/lib/roles";

export function LandingFeatures() {
  return (
    <section className="band" id="features">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">One platform, three roles</div>
          <h2 id="featuresHead">
            Training that runs better
            <br />
            <em>for everyone.</em>
          </h2>
        </div>
        <div className="bento">

          {/* Large tile: Live classroom + whiteboard */}
          <article className="feat lg reveal">
            <div className="lg-split">
              <div className="lg-copy">
                <div className="ficon green">
                  <i data-lucide="pen-tool" />
                </div>
                <h3>Live classrooms with a shared whiteboard</h3>
                <p>
                  Recreate the training centre online. Trainers run live sessions on an infinite
                  collaborative whiteboard and invite trainees to solve at the board — backed by smart
                  permissions that keep large cohorts calm.
                </p>
                <div className="meta">
                  <span className="chip">Live cursors</span>
                  <span className="chip">Infinite canvas</span>
                  <span className="chip">Lag-free sync</span>
                  <span className="chip">WebRTC video</span>
                </div>
              </div>
              <div className="wb-mock">
                <div className="wb-write eq">
                  Reflectivity Z = a·Rᵇ
                </div>
                <div className="wb-write roots">
                  a = 200 ,&nbsp; b = 1.6
                </div>
                <div className="wb-cursor p">
                  <i data-lucide="mouse-pointer-2" />
                  <span>Dr.Menon</span>
                </div>
                <div className="wb-cursor g">
                  <i data-lucide="mouse-pointer-2" />
                  <span>Rohit</span>
                </div>
                <div className="wb-face">
                  <b>Dr.Menon</b>
                </div>
              </div>
            </div>
          </article>

          {/* Small tile: In-session AI */}
          <article className="feat sm reveal d1">
            <div className="ficon green">
              <i data-lucide="radio" />
            </div>
            <h3>MeghDoot — in-session AI</h3>
            <p>
              Missed a figure while taking notes? MeghDoot didn&apos;t. Ask about warning thresholds,
              equations, or anything the trainer said — without interrupting the session.
            </p>
            <div className="mini-live">
              <div className="ml-head">
                <span className="ml-dot" /> Listening · 12:04
              </div>
              <div className="ml-line">
                <b>Dr. Rao:</b> …the cyclone-warning lead time is 48 hours.
              </div>
              <div className="ml-ask">
                <i data-lucide="corner-down-right" /> Ask anything you missed
              </div>
            </div>
            <div className="meta">
              <span className="chip">Rolling summaries</span>
              <span className="chip">End-of-session notes</span>
            </div>
          </article>

          {/* Half tile: roles */}
          <article className="feat half reveal d2">
            <div className="ficon plum">
              <i data-lucide="layout-dashboard" />
            </div>
            <h3 id="featD_h3">One place for every role</h3>
            <p id="featD_p">
              Trainees, trainers, and the ministry each get a purpose-built home — enrol and learn,
              teach and assess, or govern the whole national programme.
            </p>
            <div className="place-list">
              <div className="pl-item">
                <i data-lucide="graduation-cap" />
                <span>Trainee</span>
                <em>learn</em>
              </div>
              <div className="pl-item">
                <i data-lucide="presentation" />
                <span>Trainer</span>
                <em>teach</em>
              </div>
              <div className="pl-item">
                <i data-lucide="landmark" />
                <span>Admin (MoES)</span>
                <em>govern</em>
              </div>
              <div className="pl-item">
                <i data-lucide="badge-check" />
                <span>Verifiable certificates</span>
                <em>on record</em>
              </div>
            </div>
          </article>

          {/* Half tile: knowledge graph / GraphRAG */}
          <article className="feat half reveal d3">
            <div className="ficon plum">
              <i data-lucide="sparkles" />
            </div>
            <h3>MeghDoot — grounded in a national knowledge graph</h3>
            <p>
              Answers are grounded in a curated graph of instruments, models, hazards, and WMO standards —
              plus everything taught across sessions — so guidance cites real sources.
            </p>
            <div className="ai-thread">
              <div className="bub you">
                {ROLE_DESCRIPTION.STUDENT}
              </div>
              <div className="bub ai">
                {ROLE_DESCRIPTION.ADMIN}
                <span className="src">↳ trainer tools grounded in the batch</span>
              </div>
              <div className="bub you">
                What does the ministry see?
              </div>
              <div className="bub ai">
                {ROLE_DESCRIPTION.SUPER_ADMIN}
                <span className="src">↳ national capacity metrics, live</span>
              </div>
            </div>
            <div className="ai-foot">
              <i data-lucide="sparkles" /> Every session and standard becomes a knowledge base the
              programme can query
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}
