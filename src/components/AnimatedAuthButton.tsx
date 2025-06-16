
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AnimatedAuthButton = () => {
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLogin(prev => !prev);
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="flex transition-transform duration-700 ease-in-out" 
           style={{ transform: showLogin ? 'translateX(0%)' : 'translateX(-100%)' }}>
        <Button
          variant="outline"
          className="text-black bg-white font-semibold border border-white/30 hover:bg-gray-200 ml-2 whitespace-nowrap min-w-[100px] animate-pulse"
          asChild
        >
          <Link to="/login">Login</Link>
        </Button>
        <Button
          variant="outline"
          className="text-black bg-white font-semibold border border-white/30 hover:bg-gray-200 ml-2 whitespace-nowrap min-w-[100px] animate-pulse"
          asChild
        >
          <Link to="/signup">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
};

export default AnimatedAuthButton;
