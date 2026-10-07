import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/CrowdPulse-logo.svg"
          alt="CrowdPulse AI Logo"
          width={40}
          height={40}
          priority
        />
        {/* <span className={styles.brandName}>CrowdPulse AI</span> */}
      </Link>
      <div className={styles.navLinks}>
        <Link href="/" className={styles.navLink}>Home</Link>
        <Link href="/dashboard" className={styles.dashboardBtn}>Dashboard</Link>
      </div>
    </nav>
  );
}
