import Header from "@/components/header";
import NewsLayout from "@/components/news-layout";
import MapboxInstructions from "@/components/news-map-instructions";

export default function Home() {
  return (
    <main className="max-h-[730px] flex flex-col">
      {/* <div className="container mx-auto px-4 py-2">
        <MapboxInstructions />
      </div> */}
      <NewsLayout />
    </main>
  );
}
