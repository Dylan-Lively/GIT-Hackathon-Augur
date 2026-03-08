import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Main", path: "/" },
  { label: "Setup", path: "/setup" },
  { label: "Settings", path: "/settings" },
  { label: "Best Results", path: "/best-results" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="w-full bg-white border-b border-[#E2E8F0] px-6 h-14 flex items-center justify-between shadow-sm">
      <Link to="/" className="text-[#0F172A] font-semibold text-lg tracking-tight hover:text-[#2563EB] transition-colors">
        Pivot
      </Link>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors
                ${isActive
                  ? "text-[#2563EB] bg-[#EFF6FF] font-medium"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F3F5]"
                }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:bg-[#1D4ED8] transition-colors">
        DM
      </div>
    </nav>
  );
}
