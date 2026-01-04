import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cs-bg-light">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="cs-icon-bg w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="cs-heading mb-6 text-6xl font-bold bg-gradient-to-r from-cs-primary-start to-cs-primary-end bg-clip-text text-transparent">
          404
        </h1>
        <p className="cs-body mb-8 text-xl">Oops! Page not found</p>
        <a 
          href="/" 
          className="cs-btn-primary text-cs-cta-text hover:text-cs-cta-text"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
