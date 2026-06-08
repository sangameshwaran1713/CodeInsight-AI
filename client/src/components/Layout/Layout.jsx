import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Starfield } from '@/components/ui/starfield';

const NO_STARFIELD = ['/login', '/register'];

const Layout = () => {
  const { pathname } = useLocation();
  const showStarfield = !NO_STARFIELD.includes(pathname);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Global space background — hidden on login/register */}
      {showStarfield && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Starfield />
        </div>
      )}

      <Navbar />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
