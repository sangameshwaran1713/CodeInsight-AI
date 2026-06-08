import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-dark-300">404</h1>
        <h2 className="text-2xl font-semibold text-white mt-4 mb-2">Page Not Found</h2>
        <p className="text-dark-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center space-x-2">
          <FiHome className="w-4 h-4" />
          <span>Go Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
