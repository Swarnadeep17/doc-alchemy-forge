
import { LogoHorizontal } from "@/components/LogoHorizontal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import React from "react";
import { Link, useLocation } from "react-router-dom";

const roleStyles: Record<string, { className: string; label: string }> = {
  free: {
    className:
      "bg-gray-300 text-black font-bold border border-gray-500/50 hover:bg-gray-400/80",
    label: "Free",
  },
  premium: {
    className:
      "bg-gradient-to-br from-purple-500 via-blue-400 to-cyan-400 text-white font-bold border border-blue-300 hover:from-purple-600 hover:to-cyan-500 shadow-md",
    label: "Premium",
  },
  admin: {
    className:
      "bg-gradient-to-br from-cyan-700 via-cyan-400 to-sky-300 text-white font-bold border border-cyan-300 hover:from-cyan-800 hover:to-sky-500 shadow-md",
    label: "Admin",
  },
  superadmin: {
    className:
      "bg-gradient-to-r from-yellow-400 via-rose-400 to-fuchsia-500 text-white font-extrabold border-2 border-fuchsia-500 shadow-lg ring-4 ring-fuchsia-300/30 animate-pulse hover:from-yellow-500 hover:to-fuchsia-600",
    label: "Superadmin",
  },
};

const Header = () => {
  const { user } = useAuth();
  const userRole = user?.role || "free";
  const levelStyle = roleStyles[userRole] || roleStyles["free"];
  const location = useLocation();

  return (
    <header className="w-full flex items-center justify-between px-3 py-5 md:px-10 bg-transparent border-b border-white/10">
      <Link to="/" className="hover:opacity-90 transition-opacity">
        <LogoHorizontal size={38} />
      </Link>
      <nav className="flex items-center gap-2 md:gap-6">
        {user && (user.role === "admin" || user.role === "superadmin") && (
          <Button
            variant="ghost"
            className={`text-cyan-300 border border-cyan-400/60 bg-cyan-900/30 px-4 hover:bg-cyan-400/20 ml-2 font-mono uppercase font-extrabold transition-colors shadow ${
              location.pathname === "/admin-dashboard" ? "ring-2 ring-cyan-400" : ""
            }`}
            asChild
          >
            <Link to="/admin-dashboard">Dashboard</Link>
          </Button>
        )}

        {!user && (
          <>
            <Button
              variant="ghost"
              className="text-white hidden sm:inline border border-white/20 px-4 hover:bg-white/10 ml-2"
              asChild
            >
              <Link to="/login">Login</Link>
            </Button>
            <Button
              variant="outline"
              className="text-black bg-white font-semibold border border-white/30 hover:bg-gray-200 ml-2"
              asChild
            >
              <Link to="/signup">Sign Up</Link>
            </Button>
          </>
        )}
        {user && (
          <>
            <Button
              className={`ml-2 px-5 py-2 rounded-lg shadow-md font-mono uppercase tracking-widest text-base transition-all ${levelStyle.className}`}
              asChild
            >
              <Link to="/account">{levelStyle.label}</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
