import Image from "next/image";
import type { NewsItem } from "@/types/news";

interface NewsDetailProps {
  news: NewsItem;
}

export default function NewsDetail({ news }: NewsDetailProps) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="news-category text-orange-500">{news.category}</div>
        <h2 className="news-title mt-2 uppercase">{news.title}</h2>
        <div className="news-date mt-1">{news.date}</div>
      </div>

      <div className="relative w-full h-48 mb-4">
        <Image
          src={news.image || "/placeholder.svg"}
          alt={news.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="space-y-4">
        {news.content.map((paragraph, index) => (
          <p key={index} className="text-sm">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
