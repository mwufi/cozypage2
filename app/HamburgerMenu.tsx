'use client'

import { useState } from "react";

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const menuItems = [
        { href: "#features", label: "Features" },
        { href: "#why", label: "Why Ara" },
        { href: "#beta", label: "Early Access" },
        { href: "#contact", label: "Contact" },
    ];

    return (
        <>
            {/* Desktop menu */}
            <div className="hidden md:flex gap-8">
                {menuItems.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="uppercase text-sm tracking-wider hover:text-blue-300 transition-colors"
                    >
                        {item.label}
                    </a>
                ))}
            </div>

            {/* Mobile hamburger icon */}
            <button
                className="md:hidden text-white focus:outline-none"
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                    />
                </svg>
            </button>

            {/* Mobile menu overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 bg-[#0A0B2E]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <button
                        className="absolute top-4 right-4 text-white focus:outline-none"
                        onClick={toggleMenu}
                        aria-label="Close menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                    <div className="flex flex-col items-center gap-8">
                        {menuItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                className="uppercase text-xl tracking-wider hover:text-blue-300 transition-colors"
                                onClick={toggleMenu}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
