export function LandingPlatform() {
  return (
    <section className="band" id="ai">
      <div className="wrap">
        <div className="spy-pin" id="spyPin">
          <div className="spy-stage">
            <div className="sec-head reveal">
              <div className="eyebrow">The full set</div>
              <h2>
                Everything that makes a class
                <br />
                run itself.
              </h2>
              <p>
                Grouped the way a teaching day actually flows — the live room,
                the AI layer that remembers it, and the backend that keeps the
                batch organized.
              </p>
            </div>

            <div className="spy">
              {/* Sticky rail */}
              <nav className="spy-rail reveal" aria-label="Feature groups">
                <a
                  className="spy-link is-active"
                  href="#grp-live"
                  data-target="grp-live"
                >
                  <span className="spy-n">01</span>
                  <span className="spy-t">
                    <b>Live classroom</b>
                    <i>An HD room built for teaching, reliable anywhere.</i>
                  </span>
                </a>
                <a
                  className="spy-link"
                  href="#grp-ai"
                  data-target="grp-ai"
                >
                  <span className="spy-n">02</span>
                  <span className="spy-t">
                    <b>The AI layer</b>
                    <i>Listens, remembers, and explains every class.</i>
                  </span>
                </a>
                <a
                  className="spy-link"
                  href="#grp-lms"
                  data-target="grp-lms"
                >
                  <span className="spy-n">03</span>
                  <span className="spy-t">
                    <b>Batch management</b>
                    <i>Notes, tests, scheduling, fees — computed live.</i>
                  </span>
                </a>
                <span className="spy-progress">
                  <span className="spy-progress-fill" />
                </span>
              </nav>

              {/* Content panels */}
              <div className="spy-panels">

                <article
                  className="spy-panel is-active"
                  id="grp-live"
                  data-spy="grp-live"
                >
                  <header className="spy-head">
                    <span className="eyebrow">01 — Live classroom</span>
                  </header>
                  <div className="cat-grid">
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="video" /></div>
                      <div>
                        <h5>Live video &amp; audio</h5>
                        <p>Real-time HD for the whole batch on a scalable media server.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="pen-tool" /></div>
                      <div>
                        <h5>Collaborative whiteboard</h5>
                        <p>Real-time shared infinite canvas for the whole room.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="mouse-pointer-2" /></div>
                      <div>
                        <h5>Live cursor presence</h5>
                        <p>Every cursor shows with its participant&apos;s name label.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="door-open" /></div>
                      <div>
                        <h5>One-click join</h5>
                        <p>Name, room, allow camera — you&apos;re in. No installs.</p>
                      </div>
                    </div>
                  </div>
                </article>

                <article
                  className="spy-panel"
                  id="grp-ai"
                  data-spy="grp-ai"
                >
                  <header className="spy-head">
                    <span className="eyebrow">02 — The AI layer</span>
                  </header>
                  <div className="cat-grid">
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="brain" /></div>
                      <div>
                        <h5>Knowledge assistant</h5>
                        <p>Context-aware Q&amp;A across any and all of the batch&apos;s meetings.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="message-circle-question" /></div>
                      <div>
                        <h5>In-meeting doubt solver</h5>
                        <p>Ask about anything you missed, live during class.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="timer" /></div>
                      <div>
                        <h5>Rolling summaries</h5>
                        <p>A fresh recap roughly every ten minutes of the session.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="file-text" /></div>
                      <div>
                        <h5>End-of-class minutes</h5>
                        <p>A detailed AI recap delivered like minutes of the meeting.</p>
                      </div>
                    </div>
                  </div>
                </article>

                <article
                  className="spy-panel"
                  id="grp-lms"
                  data-spy="grp-lms"
                >
                  <header className="spy-head">
                    <span className="eyebrow">03 — Batch management</span>
                  </header>
                  <div className="cat-grid">
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="notebook-pen" /></div>
                      <div>
                        <h5>Notes &amp; study material</h5>
                        <p>Write, publish, edit and delete material in a click.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="list-checks" /></div>
                      <div>
                        <h5>MCQ tests, auto-graded</h5>
                        <p>Marks per question, instant graded breakdown per student.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="calendar-clock" /></div>
                      <div>
                        <h5>Meeting scheduling</h5>
                        <p>Upcoming · Live · Ended status, joinable in one tap.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="wallet" /></div>
                      <div>
                        <h5>Fees management</h5>
                        <p>Live status, balances and full payment history.</p>
                      </div>
                    </div>
                    <div className="row-feat">
                      <div className="ic"><i data-lucide="user-check" /></div>
                      <div>
                        <h5>Students &amp; approvals</h5>
                        <p>Approve, reject, revoke or restore access anytime.</p>
                      </div>
                    </div>
                    <div className="row-feat" id="lms">
                      <div className="ic"><i data-lucide="shield-check" /></div>
                      <div>
                        <h5>Secure access</h5>
                        <p>Every action verified server-side by teacher/student role.</p>
                      </div>
                    </div>
                  </div>
                </article>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
