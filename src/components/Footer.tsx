import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[var(--background-lighter)] bg-[var(--background-light)]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Logo et description */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xl font-bold">
              <span>🎵</span>
              <span className="text-[var(--foreground)]">FillCrate</span>
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
                <Link to="/about" className="hover:text-[var(--foreground)]">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[var(--foreground)]">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[var(--foreground)]">
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
          <p>&copy; {new Date().getFullYear()} FillCrate. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}