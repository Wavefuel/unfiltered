"use client";

import { useState, useEffect } from "react";
import { ChevronDown, CircleUser, Menu, Search } from "lucide-react";
import Link from "next/link";

export default function Header() {
	const menuItems = [
		{ name: "INDIA", path: "/", active: true },
		{ name: "UKRAINE", path: "/blog" },
		{ name: "PALESTINE", path: "/category-layouts" },
		{ name: "TAIWAN", path: "/tags-layout" },
		{ name: "NORTH KOREA", path: "/tags-layout" },
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
			{/* <div className="text-black border-b-2 border-gray-900/75 flex items-center">
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
			</div> */}

			{/* Logo and social media section */}
			<div className="flex justify-between h-28 w-full items-center py-4 px-36">
				<div className="flex items-center">
					<div className="relative">
						<button className="flex items-center text-sm font-bold header-buttons">
							ENGLISH <ChevronDown className="ml-1 h-3 w-3" />
						</button>
					</div>
				</div>
				<div className="text-center">
					<h1 className="text-6xl font-normal header-title text-gray-800">Unfiltered</h1>
				</div>
				<div className="flex items-center header-buttons">
					<Link href="#" className="text-sm font-bold hover:underline underline-offset-auto">
						LOGIN
					</Link>
					<span className="mx-2">|</span>
					<Link href="#" className="text-sm font-bold hover:underline underline-offset-auto">
						SIGN IN
					</Link>
				</div>
			</div>

			{/* Filter Section */}
			<div className="flex justify-between items-center border-t-2 border-b border-gray-900/75 h-10">
				<div className="flex items-center border-r-2 justify-center border-gray-900/75 h-full w-14">
					<i className="text-gray-800 fa-solid fa-circle-user text-[24px]" />
				</div>

				<div className="flex items-center h-full">
					<button className="flex justify-center items-center text-gray-800 border-l-2 border-gray-900/75 h-full w-14">
						<Search className="text-[20px]" />
					</button>
					<button className="flex justify-center items-center text-gray-800 border-l-2 border-gray-900/75 h-full w-14">
						<Menu className="text-[20px]" />
					</button>
				</div>
			</div>

			{/* Main navigation */}
			<nav className="border-t border-b-2 border-gray-900/75">
				<div className="px-4 md:px-20">
					<ul className="flex flex-wrap items-center justify-center gap-4">
						{menuItems.map((item, index) => (
							<>
								<li key={index} className="flex items-center relative header-text">
									<Link
										href={"#"}
										className={`px-4 py-4 inline-flex items-center text-lg font-extrabold ${item.active ? "text-[#e47659]" : ""}`}
									>
										{item.name}
									</Link>
								</li>
								{index < menuItems.length - 1 && <span className="text-lg font-bold pb-[6px] text-gray-600">•</span>}
							</>
						))}
					</ul>
				</div>
			</nav>
		</header>
	);
}
