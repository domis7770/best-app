import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "./components/Nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promptly — learn AI by doing",
  description:
    "Short, practical lessons on using AI at work, a prompt and code lab, and a business simulator that scores your decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <div className="spread">
              <span>promptly · learn AI by doing</span>
              <div className="row">
                <Link href="/learn">Learn</Link>
                <Link href="/lab">Lab</Link>
                <Link href="/sim">Simulator</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/account">Account</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
