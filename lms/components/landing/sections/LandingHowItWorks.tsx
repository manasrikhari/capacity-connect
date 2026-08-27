export function LandingHowItWorks() {
  return (
    <section className="band sunken" id="how">
      <div className="wrap">
        <div className="sec-head center reveal">
          <div className="eyebrow">How it works</div>
          <h2>
            Five steps, <em>one place.</em>
          </h2>
        </div>
        <div className="steps" id="stepsRow">
          <span className="steps-fill" aria-hidden="true" />
          <div className="step">
            <div className="n">1</div>
            <h4>Schedule a class</h4>
            <p>Set up a live session from your dashboard.</p>
          </div>
          <div className="step">
            <div className="n">2</div>
            <h4>Teach live</h4>
            <p>Video, audio &amp; whiteboard, with AI listening in the background.</p>
          </div>
          <div className="step">
            <div className="n">3</div>
            <h4>AI captures it</h4>
            <p>Rolling summaries during class, a full recap at the end.</p>
          </div>
          <div className="step">
            <div className="n">4</div>
            <h4>Students revise</h4>
            <p>Ask OpenGrapes AI any doubt about any class, anytime.</p>
          </div>
          <div className="step">
            <div className="n">5</div>
            <h4>Manage the batch</h4>
            <p>Publish notes, assign tests, track fees in one place.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
