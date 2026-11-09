"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/sim", label: "Simulator" },
  { href: "/pricing", label: "Pricing" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav-links">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          data-active={pathname === link.href || pathname.startsWith(`${link.href}/`)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
