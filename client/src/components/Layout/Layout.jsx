import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Starfield } from '@/components/ui/starfield';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen relative bg-dark-950 text-white">
      {/* Global space background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Starfield />
      </div>

      <Navbar />
      <main className="flex-1 relative z-10 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
