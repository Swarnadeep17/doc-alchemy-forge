
import { Button } from "@/components/ui/button";

const Header = () => (
  <header className="w-full flex items-center justify-between px-3 py-4 md:px-8 bg-transparent">
    <div className="flex items-center gap-2 select-none">
      <span className="text-white text-2xl md:text-3xl font-extrabold tracking-widest font-mono">docenclave</span>
    </div>
    <nav className="flex gap-2">
      <Button variant="ghost" className="text-white border border-white/20 px-4 hover:bg-white/10 transition-colors">Login</Button>
      <Button variant="outline" className="text-black bg-white px-4 font-semibold border border-white/30 hover:bg-gray-200 transition-colors">Sign Up</Button>
    </nav>
  </header>
);

export default Header;
