"use client";

import Image from "next/image";
import type { NewsItem } from "@/types/news";

interface NewsListProps {
  news: NewsItem[];
  selectedNews: NewsItem | null;
  setSelectedNews: (news: NewsItem) => void;
}

export default function NewsList({
  news,
  selectedNews,
  setSelectedNews,
}: NewsListProps) {
  return (
    <div className="border-t border-border font-Playfair">
      {news.map((item) => (
        <div
          key={item.id}
          className={`p-4 border-b border-gray-900/75 cursor-pointer hover:bg-secondary/50 transition-colors ${
            selectedNews?.id === item.id ? "bg-secondary/50" : ""
          }`}
          onClick={() => setSelectedNews(item)}
        >
          <div className="flex gap-4">
            <div className="w-28 h-28 relative flex-shrink-0">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">{item.title}</h3>
              <p className="news-excerpt line-clamp-2 mt-1">{item.excerpt}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
