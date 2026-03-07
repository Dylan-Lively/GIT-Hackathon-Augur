import { Link } from "react-router-dom";

const NAV_LINKS = ["Main", "Setup", "Settings"];

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-[#E2E8F0] px-6 h-14 flex items-center justify-between shadow-sm">

      {/* Company Name */}
      <Link to="/" className="text-[#0F172A] font-semibold text-lg tracking-tight hover:text-[#2563EB] transition-colors">
        Pivot
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link}
            to={link === "Main" ? "/" : `/${link.toLowerCase()}`}
            className="px-4 py-1.5 text-sm text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F3F5] rounded-md transition-colors transform hover:scale-110"
          >
            {link}
          </Link>
        ))}
      </div>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:bg-blue-500 transition-colors">
        DM
      </div>

    </nav>
  );
}
