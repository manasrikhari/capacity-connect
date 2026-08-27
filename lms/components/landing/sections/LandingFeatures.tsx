export function LandingFeatures() {
  return (
    <section className="band" id="features">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">The main attractions</div>
          <h2 id="featuresHead">
            Classes run better
            <br />
            <em>for everyone.</em>
          </h2>
        </div>
        <div className="bento">

          {/* Large tile: Whiteboard */}
          <article className="feat lg reveal">
            <div className="lg-split">
              <div className="lg-copy">
                <div className="ficon green">
                  <i data-lucide="pen-tool" />
                </div>
                <h3>Seamless collaborative whiteboard</h3>
                <p>
                  Recreate the classroom experience online with a collaborative
                  whiteboard. Teachers can invite students to the board to solve
                  live, backed by smart permissions that prevent classroom chaos.
                </p>
                <div className="meta">
                  <span className="chip">Live cursors</span>
                  <span className="chip">Infinite canvas</span>
                  <span className="chip">Lag-free sync</span>
                  <span className="chip">Draw together</span>
                </div>
              </div>
              <div className="wb-mock">
                <div className="wb-write eq">
                  x² – 5x + 6 = 0
                </div>
                <div className="wb-write roots">
                  x = 2 ,&nbsp; x = 3
                </div>
                <div className="wb-cursor p">
                  <i data-lucide="mouse-pointer-2" />
                  <span>Mr.Manas</span>
                </div>
                <div className="wb-cursor g">
                  <i data-lucide="mouse-pointer-2" />
                  <span>Rohit</span>
                </div>
                <div className="wb-face">
                  <b>Mr.Manas</b>
                </div>
              </div>
            </div>
          </article>

          {/* Small tile: In-meeting AI */}
          <article className="feat sm reveal d1">
            <div className="ficon green">
              <i data-lucide="radio" />
            </div>
            <h3>In-meeting AI</h3>
            <p>
              Zoned out for a minute? AI didn&apos;t. Ask about deadlines,
              explanations, or anything your teacher said — without interrupting
              the class.
            </p>
            <div className="mini-live">
              <div className="ml-head">
                <span className="ml-dot" /> Listening · 12:04
              </div>
              <div className="ml-line">
                <b>Ms. Iyer:</b> …the lab report is due Friday, 6 PM.
              </div>
              <div className="ml-ask">
                <i data-lucide="corner-down-right" /> Ask anything you missed
              </div>
            </div>
            <div className="meta">
              <span className="chip">Rolling summaries</span>
              <span className="chip">End-of-class MoM</span>
            </div>
          </article>

          {/* Half tile: Dashboard */}
          <article className="feat half reveal d2">
            <div className="ficon plum">
              <i data-lucide="layout-dashboard" />
            </div>
            <h3 id="featD_h3">One calm place for the whole class</h3>
            <p id="featD_p">
              Classes, notes, tests, and fees in one clean, fast place —
              teachers run the batch and students always know what&apos;s next,
              what&apos;s due, and where to revise.
            </p>
            <div className="place-list">
              <div className="pl-item">
                <i data-lucide="notebook-pen" />
                <span>Notes &amp; material</span>
                <em>4 new</em>
              </div>
              <div className="pl-item">
                <i data-lucide="list-checks" />
                <span>Tests</span>
                <em>2 live</em>
              </div>
              <div className="pl-item">
                <i data-lucide="wallet" />
                <span>Fees</span>
                <em>on track</em>
              </div>
              <div className="pl-item">
                <i data-lucide="users" />
                <span>Students</span>
                <em>28 active</em>
              </div>
            </div>
          </article>

          {/* Half tile: AI chat */}
          <article className="feat half reveal d3">
            <div className="ficon plum">
              <i data-lucide="sparkles" />
            </div>
            <h3>OpenGrapes AI — an assistant that knows your classes</h3>
            <p>
              It pulls context from any meeting in the batch, including past
              sessions, and answers grounded in what was actually taught.
            </p>
            <div className="ai-thread">
              <div className="bub you">
                What did we cover about Newton&apos;s third law last week?
              </div>
              <div className="bub ai">
                Action–reaction pairs, with the rocket-thrust example from
                Tuesday&apos;s class.
                <span className="src">↳ grounded in Batch A · 3 past sessions</span>
              </div>
              <div className="bub you">
                And the deadline she mentioned today?
              </div>
              <div className="bub ai">
                Lab report — Friday, 6 PM.
                <span className="src">↳ noted at 12:04 in today&apos;s class</span>
              </div>
            </div>
            <div className="ai-foot">
              <i data-lucide="sparkles" /> Every past class becomes a knowledge
              base your batch can query
            </div>
          </article>

        </div>
      </div>
    </section>
  );
}
