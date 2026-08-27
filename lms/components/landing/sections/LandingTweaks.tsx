export function LandingTweaks() {
  return (
    <div id="tweaks" aria-label="Tweaks">
      <div className="tk-head">
        <b>Tweaks</b>
        <button className="tk-x" id="tkClose" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="tk-body">
        <div className="tk-row">
          <div className="tk-label">Audience focus</div>
          <div className="seg" id="segAudience">
            <button data-v="everyone">Everyone</button>
            <button data-v="teachers">Teachers</button>
            <button data-v="students">Students</button>
          </div>
        </div>
        <div className="tk-row">
          <div className="tk-label">Primary accent</div>
          <div className="sw-row" id="swAccent">
            <button
              className="sw"
              data-v="#6E9461"
              style={{ background: "#6E9461" }}
              aria-label="Sage green"
            />
            <button
              className="sw"
              data-v="#836BA6"
              style={{ background: "#836BA6" }}
              aria-label="Muted plum"
            />
            <button
              className="sw"
              data-v="#587A4D"
              style={{ background: "#587A4D" }}
              aria-label="Deep forest"
            />
          </div>
        </div>
        <div className="tk-row tog">
          <span>Scroll animations</span>
          <button
            className="switch"
            id="tkAnim"
            aria-pressed="true"
            aria-label="Toggle scroll animations"
          />
        </div>
      </div>
    </div>
  );
}
