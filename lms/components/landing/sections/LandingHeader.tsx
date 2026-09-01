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
          <a href="#signin" className="btn btn-primary">
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}
