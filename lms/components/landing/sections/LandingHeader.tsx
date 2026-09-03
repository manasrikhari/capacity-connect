export function LandingHeader() {
  return (
    <header className="site" id="hdr">
      <div className="wrap nav">
        <div className="brand">Capacity Connect</div>
        <nav className="nav-links">
          <a href="#features">Platform</a>
          <a href="#announcements">Announcements</a>
          <a href="#courses">Courses</a>
          <a href="#verify">Verify</a>
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
