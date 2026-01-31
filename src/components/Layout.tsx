import { Outlet } from 'react-router-dom'
import Navigation from './Navigation'
import Footer from './Footer'

export default function Layout() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}