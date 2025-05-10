"use client";

import { useState, useEffect } from "react";
import NewsCategories from "@/components/news-categories";
import NewsList from "@/components/news-list";
import NewsDetail from "@/components/news-detail";
import type { NewsItem } from "@/types/news";
import { newsData } from "@/data/news-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import NewsMap from "./news-map";

interface NewsMapProps {
	news: NewsItem[];
	selectedNews: NewsItem | null;
	timelineDate: string;
	setTimelineDate: React.Dispatch<React.SetStateAction<string>>;
	setSelectedNews: React.Dispatch<React.SetStateAction<NewsItem | null>>;
}

export default function NewsLayout() {
	const [selectedCategory, setSelectedCategory] = useState("ALL");
	const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
	const [filteredNews, setFilteredNews] = useState<NewsItem[]>(newsData);
	const [timelineDate, setTimelineDate] = useState<string>("2021-01-10");

	useEffect(() => {
		if (selectedCategory === "ALL") {
			setFilteredNews(newsData);
		} else {
			setFilteredNews(newsData.filter((news) => news.category === selectedCategory));
		}
	}, [selectedCategory]);

	useEffect(() => {
		if (filteredNews.length > 0 && !selectedNews) {
			setSelectedNews(filteredNews[0]);
		}
	}, [filteredNews, selectedNews]);

	return (
		<div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden max-w-8xl mx-auto">
			<div className="w-2/6 border-r border-gray-900/75 overflow-hidden flex flex-col h-full ">
				<ScrollArea className="h-full">
					<div className="">
						<NewsList news={filteredNews} selectedNews={selectedNews} setSelectedNews={setSelectedNews} />
					</div>
				</ScrollArea>
			</div>

			<div className="w-full md:w-4/5 border-r border-gray-900/75 h-full overflow-hidden">
				{/* News outline grid */}
				<div className="grid grid-cols-3 border-b border-gray-900/75">
					<div className="border-r border-gray-900/75 p-4">
						<div className="text-sm font-semibold mb-2">Culture</div>
						<h3 className="font-serif text-lg font-bold">Incongruous Jeepers Jellyfish One Far Well Known</h3>
					</div>

					<div className="border-r border-gray-900/75 p-4">
						<div className="text-sm font-semibold mb-2">Uncategorized</div>
						<h3 className="font-serif text-lg font-bold">This Nudged Jeepers Ded Sesulky Oite Ten Around Style3</h3>
					</div>

					<div className="border-r border-gray-900/75 p-4">
						<div className="text-sm font-semibold mb-2">Culture . Europe</div>
						<h3 className="font-serif text-lg font-bold">Timmediately Quail Was Inverse Much So Remade Dimly Salmon</h3>
					</div>
				</div>

				<NewsMap />
			</div>
		</div>
	);
}
