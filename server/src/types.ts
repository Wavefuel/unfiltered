/**
 * Represents a single scraped news item
 */
export interface ScrapedItem {
  title: string;
  content: string;
  url: string;
  date: string;
  author?: string;
  mediaUrls?: string[];
  categories?: string[];
  id?: string;
  siteName?: string;
}

/**
 * Configuration for web scrapers
 */
export interface ScraperConfig {
  selectors: {
    itemContainer?: string;
    title: string;
    content?: string;
    date?: string;
    author?: string;
    url?: string;
    mediaList?: string;
    [key: string]: string | undefined;
  };
  waitForSelector?: string;
  scrollToBottom?: boolean;
  summarizeContent?: boolean;
  summarizeLength?: number;
  maxItems?: number;
}

/**
 * Result of news scraping operation
 */
export interface NewsScrapingResult {
  scrapeTime: string;
  source: string;
  query?: string;
  items: ScrapedItem[];
  categories?: { [key: string]: string[] };
  analysis?: any;
}

/**
 * News search query parameters
 */
export interface NewsSearchQuery {
  siteName?: string;
  query?: string;
  url?: string;
  config?: ScraperConfig;
} 