import Link from "next/link";
import styles from "./Landing.module.css";

export default function HomePageLayout() {
  return (
    <div className={styles.container}>
      {/* ── Hero Section ──────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} />
        <h1 className={styles.logo}>CrowdPulse AI</h1>
        <p className={styles.tagline}>
          AI-Powered Real-Time Crowd Risk Monitoring
        </p>
        <p className={styles.subtitle}>
          Detect. Analyze. Prevent. Keep every gathering safe with intelligent
          crowd density monitoring and instant risk alerts.
        </p>
      </header>
      
      {/* ── What It Does ─────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Is CrowdPulse AI?</h2>
        <p className={styles.sectionText}>
          CrowdPulse AI is a fixed-zone real-time crowd risk monitoring system.
          It uses a live camera feed powered by YOLOv8 object detection to
          continuously count people, estimate crowd density, detect sudden
          surges, and classify risk levels — all in real time.
        </p>
        <p className={styles.sectionText}>
          Unlike simple people counters, CrowdPulse AI is a{" "}
          <strong>live crowd risk prediction engine</strong> that combines
          density analysis, growth-rate tracking, and persistence monitoring to
          deliver actionable safety insights before dangerous situations
          escalate.
        </p>
      </section>

      {/* ── Key Features ─────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Key Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>👁</span>
            <h3 className={styles.featureTitle}>Real-Time Detection</h3>
            <p className={styles.featureDesc}>
              YOLOv8 processes live camera frames to detect and count people with
              high accuracy, every 2 seconds.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📊</span>
            <h3 className={styles.featureTitle}>Density Analysis</h3>
            <p className={styles.featureDesc}>
              Computes crowd density as a ratio of current count to zone
              capacity, giving a clear occupancy percentage.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>⚡</span>
            <h3 className={styles.featureTitle}>Surge Detection</h3>
            <p className={styles.featureDesc}>
              Tracks growth rate across time windows to instantly flag sudden
              crowd build-ups before they become dangerous.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🛡</span>
            <h3 className={styles.featureTitle}>Risk Classification</h3>
            <p className={styles.featureDesc}>
              Four-level risk engine (Low, Medium, High, Critical) with
              persistence monitoring for sustained overload alerts.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📈</span>
            <h3 className={styles.featureTitle}>Live Dashboard</h3>
            <p className={styles.featureDesc}>
              Interactive dashboard with live camera feed, metric cards, density
              bar, and real-time trend charts.
            </p>
          </div>

          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🗄</span>
            <h3 className={styles.featureTitle}>Data Logging</h3>
            <p className={styles.featureDesc}>
              Every detection is timestamped and logged for historical trend
              analysis, reporting, and auditing.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.stepsRow}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <h3 className={styles.stepTitle}>Capture</h3>
            <p className={styles.stepDesc}>
              A fixed camera continuously streams frames from the monitored
              zone.
            </p>
          </div>
          <div className={styles.stepDivider} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <h3 className={styles.stepTitle}>Detect</h3>
            <p className={styles.stepDesc}>
              YOLOv8 AI model identifies and counts every person in each frame.
            </p>
          </div>
          <div className={styles.stepDivider} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <h3 className={styles.stepTitle}>Analyze</h3>
            <p className={styles.stepDesc}>
              Risk engine computes density, growth rate, and persistence to
              classify threat level.
            </p>
          </div>
          <div className={styles.stepDivider} />
          <div className={styles.step}>
            <span className={styles.stepNumber}>4</span>
            <h3 className={styles.stepTitle}>Alert</h3>
            <p className={styles.stepDesc}>
              Dashboard displays live metrics and triggers alerts when risk
              thresholds are crossed.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Technology Stack</h2>
        <div className={styles.techGrid}>
          <div className={styles.techItem}>
            <strong>AI Model</strong>
            <span>YOLOv8 (Ultralytics)</span>
          </div>
          <div className={styles.techItem}>
            <strong>Backend</strong>
            <span>Python + Flask</span>
          </div>
          <div className={styles.techItem}>
            <strong>Frontend</strong>
            <span>Next.js + React</span>
          </div>
          <div className={styles.techItem}>
            <strong>Computer Vision</strong>
            <span>OpenCV</span>
          </div>
          <div className={styles.techItem}>
            <strong>Deep Learning</strong>
            <span>PyTorch</span>
          </div>
          <div className={styles.techItem}>
            <strong>Architecture</strong>
            <span>Microservices</span>
          </div>
        </div>
      </section>

      {/* ── CTA Footer ───────────────────────── */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaHeading}>Ready to Monitor?</h2>
        <p className={styles.ctaText}>
          Launch the real-time dashboard and start monitoring your zone now.
        </p>
        <Link href="/dashboard" className={styles.ctaButton}>
          Start Managing Crowd
        </Link>
      </section>

      <footer className={styles.footer}>
        <p>CrowdShield AI &mdash; AI-Based Fixed-Zone Crowd Risk Monitoring System</p>
      </footer>
    </div>
  );
}
