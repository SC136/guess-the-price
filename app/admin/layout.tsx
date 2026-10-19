import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

// This layout only decides whether to show "Log out". It is NOT the access check: layouts don't
// re-run on client-side navigation, so every admin page and action calls requireAdmin() itself.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const loggedIn = await isAdmin();

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <Link href="/admin" className="admin-title">
          Guess the Price <span>Admin</span>
        </Link>
        <nav>
          <Link href="/" target="_blank">
            View game ↗
          </Link>
          {loggedIn && (
            <form action={logoutAction}>
              <button type="submit" className="link-button">
                Log out
              </button>
            </form>
          )}
        </nav>
      </header>
      <main className="admin-main">
        {children}
        <Footer showAdmin={false} />
      </main>
    </div>
  );
}
