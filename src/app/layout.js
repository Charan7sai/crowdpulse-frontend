import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "CrowdPulse AI: crowd risk monitoring",
  description:
    "Counts people on a CCTV or phone camera feed, compares the count with the detected floor area, and shows a live risk level.",
};

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('crowdpulse_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
