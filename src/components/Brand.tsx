import { Link } from "react-router-dom";

interface BrandProps {
  size?: "sm" | "lg";
}

export function Brand({ size = "sm" }: BrandProps) {
  return (
    <Link to="/" className={`brand brand-${size}`}>
      <img src="/logo.svg" alt="" className="brand-logo" />
      <span className="brand-name">TimeFind</span>
    </Link>
  );
}
