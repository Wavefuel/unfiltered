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
		<div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden w-full mx-auto">
			<div className="w-3/6 border-r-2 border-gray-900/75 overflow-hidden flex flex-col h-full ">
				<NewsList news={filteredNews} selectedNews={selectedNews} setSelectedNews={setSelectedNews} />
			</div>
			<div className="w-full p-5 border-r border-l-0 border-gray-900/75 h-full overflow-hidden">
				<NewsMap />
			</div>
		</div>
	);
}
