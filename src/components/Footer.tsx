import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-6 text-center text-xs text-white/60 font-mono border-t border-white/10 mt-12">
      © {new Date().getFullYear()} DocEnclave — Your Secure Document Fortress.
      {/* Add more footer content as needed, matching homepage theme */}
    </footer>
  );
};
export default Footer;
