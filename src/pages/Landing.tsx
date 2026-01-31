import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="bg-[var(--background)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-7xl">
            Bienvenue sur{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              FillCrate
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--foreground-muted)] sm:text-xl">
            Le réseau social qui réunit les passionnés de vinyles.
            Partagez votre collection, découvrez de nouveaux albums et connectez-vous avec une communauté qui partage votre passion.
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-full bg-[var(--primary)] px-8 py-4 text-lg font-semibold text-white hover:bg-[#d67118] hover:scale-105 transition-transform"
          >
            Rejoindre FillCrate
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-64 w-64 rounded-full bg-[var(--secondary)] opacity-10 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Pourquoi rejoindre FillCrate ?
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1: Collection */}
            <div className="group rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8 transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20">
              <div className="mb-4 text-5xl">💿</div>
              <h3 className="mb-3 text-2xl font-semibold text-[var(--foreground)]">
                Collection
              </h3>
              <p className="text-[var(--foreground-muted)]">
                {'Cataloguez vos vinyles, ajoutez des notes d\'écoute et suivez l\'évolution de votre collection au fil du temps.'}
              </p>
            </div>

            {/* Feature 2: Communauté */}
            <div className="group rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8 transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20">
              <div className="mb-4 text-5xl">👥</div>
              <h3 className="mb-3 text-2xl font-semibold text-[var(--foreground)]">
                Communauté
              </h3>
              <p className="text-[var(--foreground-muted)]">
                {'Partagez vos dernières acquisitions, échangez des recommandations et connectez-vous avec d\'autres collectionneurs.'}
              </p>
            </div>

            {/* Feature 3: Découverte */}
            <div className="group rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8 transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/20">
              <div className="mb-4 text-5xl">🔍</div>
              <h3 className="mb-3 text-2xl font-semibold text-[var(--foreground)]">
                Découverte
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Explorez les collections des autres utilisateurs, créez votre wishlist et trouvez votre prochaine pépite musicale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--background-lighter)] bg-gradient-to-br from-[var(--background-light)] to-[var(--background-lighter)] p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Prêt à commencer votre aventure vinyle ?
          </h2>
          <p className="mb-8 text-lg text-[var(--foreground-muted)]">
            Rejoignez des milliers de passionnés qui partagent déjà leur amour pour les vinyles.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-block rounded-full bg-[var(--primary)] px-8 py-4 text-lg font-semibold text-white hover:bg-[#d67118] hover:scale-105 transition-transform"
            >
              Créer un compte
            </Link>
            <Link
              to="/login"
              className="inline-block rounded-full border-2 border-[var(--primary)] px-8 py-4 text-lg font-semibold text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}