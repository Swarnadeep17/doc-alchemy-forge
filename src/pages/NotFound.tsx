
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-2 py-8">
      <div className="w-full max-w-md mx-auto bg-gray-900/95 border border-cyan-300/20 shadow-xl rounded-xl py-12 px-8 text-center">
        <h1 className="text-5xl text-white font-bold font-mono mb-3 tracking-widest animate-fade-in">404</h1>
        <p className="text-xl text-white/70 mb-6 font-mono">Oops! Page not found</p>
        <a
          href="/"
          className="inline-block rounded bg-white hover:bg-gray-200 text-black px-6 py-2 font-mono uppercase text-sm tracking-wider font-bold shadow transition-all"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
