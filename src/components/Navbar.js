"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1" y="1" width="24" height="24" rx="3" style={{ fill: "var(--accent)" }} />
      <polyline
        points="4,14 9,14 11.5,8 14.5,19 17,12 19,14 22,14"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const path = usePathname();
  const onHome = path === "/";

  return (
    <header className="nav">
      <div className="container-wide nav-inner">
        <Link href="/" className="brand">
          <Mark />
          <span>CrowdPulse</span>
        </Link>
        <div className="nav-right">
          <nav className="nav-links" aria-label="Main">
            {onHome ? (
              <>
                <a href="#measures">What it measures</a>
                <a href="#capacity">Capacity</a>
                <a href="#cameras">Cameras</a>
                <a href="#setup">Setup</a>
              </>
            ) : (
              <Link href="/">Overview</Link>
            )}
            <Link href="/dashboard" className="btn btn-primary btn-small">
              Dashboard
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
