import { Link } from "react-router-dom";

const FreeTierBadge = () => {
  return (
    <Link
      to="/"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-5 py-2.5 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl backdrop-blur-sm"
    >
      <span className="text-sm font-semibold tracking-wide">Made with siteforge.ai</span>
    </Link>
  );
};

export default FreeTierBadge;
