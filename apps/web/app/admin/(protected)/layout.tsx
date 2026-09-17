import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { isAdminAuthenticated } from "../../../lib/adminAuth";
import { LogoutButton } from "../../../components/admin/LogoutButton";
import { BrandMark } from "../../../components/BrandMark";
import Link from "next/link";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <BrandMark />
          <span className="text-caption text-muted">— Editor</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/admin/today" className="font-headline font-medium text-label text-ink hover:text-gold">
            Today
          </Link>
          <Link href="/admin/insights" className="font-headline font-medium text-label text-ink hover:text-gold">
            Insights
          </Link>
          <Link href="/admin/tools" className="font-headline text-label text-muted hover:text-ink">
            Tools
          </Link>
          <LogoutButton />
        </nav>
      </header>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
