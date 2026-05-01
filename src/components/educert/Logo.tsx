import { Link } from "react-router-dom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display font-extrabold tracking-tight text-primary-deep ${className}`}>
      <span className="text-xl">GOKLY</span>
      <span className="rounded-sm bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">PRO</span>
    </Link>
  );
}
