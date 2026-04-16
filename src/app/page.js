import Link from "next/link";
import "./page.css";

export default function Home() {
  return (
    <div className="home-container">
      {/* Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <nav className="navbar glass-panel">
        <div className="logo text-gradient-primary">Midnightwish</div>
        <div className="nav-links">
          <Link href="/login" className="btn-secondary">Log In</Link>
          <Link href="/signup" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <h1 className="title text-gradient">
            Never Miss A <span className="text-gradient-primary">Midnight</span> Again
          </h1>
          <p className="subtitle">
            Living abroad? Daylight savings messing up your timing? 
            We calculate exactly when it's 12:00 AM IST. Get an automatic Gmail reminder to wish your friends and family at the perfect moment.
          </p>
          <div className="cta-group">
            <Link href="/signup" className="btn-primary cta-btn">
              Start Free Today
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="clock-glass glass-panel">
            <div className="clock-ring">
              <div className="clock-hand"></div>
            </div>
            <h3 className="timezone-text">12:00 AM <span style={{color: "var(--primary-light)"}}>IST</span></h3>
            <p className="local-time-text">Your local time: Auto-calculated</p>
          </div>
        </div>
      </main>
    </div>
  );
}
