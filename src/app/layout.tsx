import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groovr - Réseau social pour passionnés de vinyles",
  description: "Partagez votre collection de vinyles, découvrez de nouveaux albums et connectez-vous avec d'autres passionnés de musique.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b border-[var(--background-lighter)] bg-[var(--background)]/95 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
              <span>🎵</span>
              <span className="text-[var(--foreground)]">Groovr</span>
            </Link>

            {/* Navigation links - Desktop */}
            <div className="hidden items-center gap-8 md:flex">
              <Link
                href="/feed"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Feed
              </Link>
              <Link
                href="/collection"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Collection
              </Link>
              <Link
                href="/wishlist"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Wishlist
              </Link>
              <Link
                href="/profil"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Profil
              </Link>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden text-[var(--foreground-muted)] hover:text-[var(--foreground)] md:block"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[var(--primary)] px-6 py-2 font-medium text-white hover:bg-[#d67118]"
              >
                Signup
              </Link>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--background-lighter)] bg-[var(--background-light)]">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Logo et description */}
              <div>
                <div className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <span>🎵</span>
                  <span className="text-[var(--foreground)]">Groovr</span>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Le réseau social pour les passionnés de vinyles.
                  Partagez votre collection et découvrez de nouveaux albums.
                </p>
              </div>

              {/* Liens rapides */}
              <div>
                <h3 className="mb-4 font-semibold text-[var(--foreground)]">Liens rapides</h3>
                <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  <li>
                    <Link href="/about" className="hover:text-[var(--foreground)]">
                      À propos
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-[var(--foreground)]">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[var(--foreground)]">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Réseaux sociaux */}
              <div>
                <h3 className="mb-4 font-semibold text-[var(--foreground)]">Communauté</h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Rejoignez notre communauté de passionnés de vinyles et de musique.
                </p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 border-t border-[var(--background-lighter)] pt-8 text-center text-sm text-[var(--foreground-muted)]">
              <p>&copy; {new Date().getFullYear()} Groovr. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
