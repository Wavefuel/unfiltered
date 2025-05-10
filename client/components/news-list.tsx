"use client";

import Image from "next/image";
import type { NewsItem } from "@/types/news";

interface NewsListProps {
	news: NewsItem[];
	selectedNews: NewsItem | null;
	setSelectedNews: (news: NewsItem) => void;
}

export default function NewsList({ news, selectedNews, setSelectedNews }: NewsListProps) {
	return (
		<div className="border-t-0 overflow-y-auto">
			{news.map((item) => (
				<div
					key={item.id}
					className={`p-4 border-r-0 border-b border-gray-900/75 cursor-pointer transition-colors group`}
					onClick={() => setSelectedNews(item)}
				>
					<div className="flex gap-4">
						<div className="w-44 relative flex-shrink-0">
							<Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover grayscale" />
						</div>
						<div>
							<h3 className="header-text text-lg font-bold group-hover:text-[#e47659] transition-colors">{item.title}</h3>
							<p className="excerpt-text mt-1 text-wrap text-xs">{item.excerpt}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
