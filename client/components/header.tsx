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
					<svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
					<span className="font-bold text-xs">LATEST</span>
				</div>
				<div className="py-2 flex-1 overflow-hidden">
					<div className="whitespace-nowrap px-4 text-sm" style={{ transform: `translateX(${position}px)` }}>
						{latestNews.map((news, i) => (
							<span key={i} className="inline-block mr-8">
								{news} <span className="mx-3 text-gray-300">|</span>
							</span>
						))}
					</div>
				</div>
			</div>

			{/* Logo and social media section */}
			<div className="flex justify-center w-full items-center py-4 px-4 md:px-20">
				<div className="text-center">
					<h1 className="text-5xl font-bold font-Playfair">THE UNFILTERED</h1>
				</div>
			</div>

			{/* Main navigation */}
			<nav className="border-t border-b border-gray-900/75">
				<div className="px-4 md:px-20">
					<ul className="flex flex-wrap items-center justify-center">
						{menuItems.map((item, index) => (
							<li key={index} className="relative">
								<Link
									href={"#"}
									className={`px-4 py-4 inline-flex items-center text-sm font-medium ${item.active ? "text-red-600" : ""}`}
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
