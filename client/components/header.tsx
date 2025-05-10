"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const menuItems = [
    { name: "HOME", path: "/", active: true },
    { name: "BLOG", path: "/blog" },
    { name: "CATEGORY LAYOUTS", path: "/category-layouts", hasDropdown: true },
    { name: "TAGS LAYOUT", path: "/tags-layout", hasDropdown: true },
    { name: "POST STYLES", path: "/post-styles", hasDropdown: true },
    { name: "MODULE", path: "/module" },
    { name: "CPT", path: "/cpt", hasDropdown: true },
    { name: "AUTHOR", path: "/author" },
    { name: "404", path: "/404" },
  ];

  const latestNews = [
    "Was inverse much so remade dimly in this societal landscape",
    "Unanimous haltered loud one trod trigly style four",
    "Breaking: Technology giant announces revolutionary AI assistant",
    "Global leaders agree on climate change initiative at summit",
    "Sports team wins championship after 20-year drought",
    "New study reveals surprising benefits of daily meditation",
    "Economic report shows unexpected growth in third quarter",
    "Local community comes together to rebuild after disaster",
    "Scientists discover potentially habitable planet in nearby star system",
    "Film director wins prestigious award for groundbreaking documentary",
    "Health officials recommend new guidelines for preventative care",
    "Tech startup raises record funding in latest investment round",
    "Cultural festival attracts thousands of visitors from around the world",
    "Election results show significant shift in political landscape",
    "Archaeological discovery sheds new light on ancient civilization",
  ];

  const [position, setPosition] = useState(0);
  const [activeNews, setActiveNews] = useState(0);

  useEffect(() => {
    const tickerWidth = 1000; // Approximate width of the ticker container
    const animationFrame = requestAnimationFrame(animate);

    function animate() {
      setPosition((prev) => {
        // Reset position when text has moved completely out of view
        if (prev <= -tickerWidth) {
          // Switch to next news item
          setActiveNews((prev) => (prev + 1) % latestNews.length);
          return 0;
        }
        return prev - 1; // Move text from right to left
      });
      requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [latestNews.length]);

  return (
    <header>
      {/* Top ticker */}
      <div className="bg-amber-50 text-black border-b-2 border-gray-900/75 flex items-center">
        <div className="bg-black text-white px-3 py-2 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-bold text-xs">LATEST</span>
        </div>
        <div className="py-2 flex-1 overflow-hidden">
          <div
            className="whitespace-nowrap px-4 text-sm"
            style={{ transform: `translateX(${position}px)` }}
          >
            {latestNews.map((news, i) => (
              <span key={i} className="inline-block mr-8">
                {news} <span className="mx-3 text-gray-300">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Logo and social media section */}
      <div className="flex justify-between items-center py-4 px-4 md:px-20">
        <div className="flex space-x-2">
          {/* Hamburger menu */}
          <button className="w-8 h-8 border border-black flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Theme toggle */}
          <button className="w-8 h-8 border border-black flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>

          {/* Dark mode */}
          <button className="w-8 h-8 bg-black text-white border border-black flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-bold" style={{ fontFamily: "serif" }}>
            THE UNFILTERED
          </h1>
        </div>

        {/* Social media icons */}
        <div className="flex items-center gap-2">
          <Link
            href="#"
            className="w-8 h-8 rounded-full border border-black flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
          <Link
            href="#"
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="9" r="3" />
              <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
            </svg>
          </Link>
          <Link
            href="#"
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
            </svg>
          </Link>
          <Link
            href="#"
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="border-t border-b border-gray-900/75">
        <div className="px-4 md:px-20">
          <ul className="flex flex-wrap items-center justify-center">
            {menuItems.map((item, index) => (
              <li key={index} className="relative">
                <Link
                  href={item.path}
                  className={`px-4 py-4 inline-flex items-center text-sm font-medium ${
                    item.active ? "text-red-600" : ""
                  }`}
                >
                  {item.name}
                  {item.hasDropdown && <ChevronDown className="ml-1 h-3 w-3" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
