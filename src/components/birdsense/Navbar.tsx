import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

export default function Navbar() {
    const path = useRouterState({ select: (s) => s.location.pathname });
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const link = (to: string, label: string) => (
        <Link to={to} className={`nav-link ${path === to ? "active" : ""}`}>
            {label}
        </Link>
    );

    return (
        <header className={`navbar${scrolled ? " scrolled" : ""}`}>
            <Link to="/" className="navbar-brand">
                <span className="navbar-logo">
                    <span style={{ color: "#04140a", fontWeight: 900, fontSize: 15 }}>B</span>
                </span>
                <span className="navbar-brand-text font-display">BirdSense</span>
            </Link>

            <nav className="nav-links">
                {link("/", "Home")}
                {link("/app", "Analyzer")}
                {link("/about", "About")}
                <Link
                    to="/app"
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: "none", marginLeft: 8 }}
                >
                    🚀 Launch
                </Link>
            </nav>
        </header>
    );
}
