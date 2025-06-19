import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { Merge, Home, FileText, ShieldCheck } from 'lucide-react'; // Import icons

const FooterLink = ({ to, children, icon }: { to: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <Link
    to={to}
    className="text-xs text-gray-400 hover:text-cyan-400 transition-colors duration-200 ease-in-out flex items-center gap-1"
  >
    {icon}
    {children}
  </Link>
);

const Footer = () => {
  return (
    <footer className="w-full bg-black/30 border-t border-white/10 py-8 mt-16 text-center">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-6">
          <div className="text-left md:text-center">
            <p className="text-sm font-semibold text-white font-mono">
              DocEnclave
            </p>
            <p className="text-xs text-gray-500">
              Your Secure Document Fortress
            </p>
          </div>
          <nav className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
            <FooterLink to="/" icon={<Home size={14} />}>Home</FooterLink>
            <FooterLink to="/tools/pdf/merge" icon={<Merge size={14} />}>PDF Merge</FooterLink>
            {/* Add other main tool links here as they become available */}
          </nav>
          <nav className="flex flex-col md:flex-row justify-end items-center md:items-start gap-4 md:gap-6">
            <FooterLink to="/privacy-policy" icon={<ShieldCheck size={14} />}>Privacy Policy</FooterLink>
            <FooterLink to="/terms-of-service" icon={<FileText size={14} />}>Terms of Service</FooterLink>
          </nav>
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-gray-500 font-mono">
            © {new Date().getFullYear()} DocEnclave. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Built with privacy and security in mind. We never see your files.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
