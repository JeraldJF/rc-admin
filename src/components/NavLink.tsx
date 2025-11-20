import { Link, useLocation, LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
}

export const NavLink = ({ to, className, activeClassName, children, ...props }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
                   (to === "/registry" && location.pathname.startsWith("/entity")) ||
                   (to === "/claims" && location.pathname.startsWith("/claim")) ||
                   (to === "/pending-claims" && location.pathname.startsWith("/pending-claim")) ||
                   (to === "/approved-claims" && location.pathname.startsWith("/approved-claim"));

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  );
};
