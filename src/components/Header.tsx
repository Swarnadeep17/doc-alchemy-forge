
import { LogoHorizontal } from "@/components/LogoHorizontal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import React from "react";

const NAV_LINKS = [
  { label: "Tools", href: "#tools" },
  { label: "Why Us", href: "#whyus" },
];

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="w-full flex items-center justify-between px-3 py-5 md:px-10 bg-transparent border-b border-white/10">
      <a href="/" className="hover:opacity-90 transition-opacity">
        <LogoHorizontal size={38} />
      </a>
      <nav className="flex items-center gap-2 md:gap-6">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-white/80 text-base font-mono uppercase tracking-widest hover:text-white transition-colors px-2"
          >
            {label}
          </a>
        ))}
        {!user && (
          <>
            <Button variant="ghost" className="text-white hidden sm:inline border border-white/20 px-4 hover:bg-white/10 ml-2" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button variant="outline" className="text-black bg-white font-semibold border border-white/30 hover:bg-gray-200 ml-2" asChild>
              <a href="/signup">Sign Up</a>
            </Button>
          </>
        )}
        {user && (
          <>
            <Button variant="ghost" className="text-white border border-white/20 px-4 hover:bg-white/10 ml-2" asChild>
              <a href="/profile">Profile</a>
            </Button>
            <Button variant="outline" className="text-black bg-white font-semibold border border-white/30 hover:bg-gray-200 ml-2" asChild>
              <a href="/account">Account</a>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
