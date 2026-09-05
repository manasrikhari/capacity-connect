import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot">
          <div>
            <div className="brand">
              <span className="dot" />
              Capacity Connect
            </div>
            <p>
              The Ministry of Earth Sciences &amp; India Meteorological Department&apos;s platform for digital capacity building
              in weather and climate services. Train live. Certify. Track national capacity.
            </p>
          </div>
          <div>
            <h6>Platform</h6>
            <ul>
              <li><a href="#features">Live classroom</a></li>
              <li><a href="#features">MeghDoot AI</a></li>
              <li><a href="#courses">Courses</a></li>
              <li><a href="#announcements">Announcements</a></li>
            </ul>
          </div>
          <div>
            <h6>For members</h6>
            <ul>
              <li><a href="#signin">Trainees</a></li>
              <li><a href="#signin">Trainers</a></li>
              <li><a href="#signin">Ministry admins</a></li>
              <li><Link href="/verify">Verify a certificate</Link></li>
            </ul>
          </div>
          <div>
            <h6>Ministry</h6>
            <ul>
              <li><a href="#">About the Ministry</a></li>
              <li><a href="#signin">Sign in</a></li>
              <li><a href="#announcements">Advisories</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <span>© 2026 Ministry of Earth Sciences · India Meteorological Department.</span>
          <span>Digital capacity building for India&apos;s weather and climate services.</span>
        </div>
        <div className="foot-credit">Capacity Connect — a national training platform</div>
      </div>
    </footer>
  );
}
