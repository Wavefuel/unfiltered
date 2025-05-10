import Header from "@/components/header";
import NewsLayout from "@/components/news-layout";
import MapboxInstructions from "@/components/news-map-instructions";

export default function Home() {
	return (
		<main className="flex h-[calc(100vh-172px)] flex-col">
			<NewsLayout />
		</main>
	);
}
