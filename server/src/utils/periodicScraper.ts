import { scrapeWebsite, ScraperConfig, ScrapedItem } from './scraper';
import { classifyNews } from './analyzer';
import { newsAnalyzer } from './analyzer';
import { EventEmitter } from 'events';

interface PeriodicScraperOptions {
  url: string;
  intervalSeconds: number;
  config?: ScraperConfig;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface ScrapingResult {
  timestamp: string;
  source: string;
  items: ScrapedItem[];
  categories: { [category: string]: ScrapedItem[] };
  analysis: any;
}

class PeriodicScraper extends EventEmitter {
  private url: string;
  private intervalMs: number;
  private config: ScraperConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private lastItemIds: Set<string> = new Set();
  private maxRetries: number;
  private retryDelayMs: number;
  private running: boolean = false;

  constructor(options: PeriodicScraperOptions) {
    super();
    this.url = options.url;
    this.intervalMs = options.intervalSeconds * 1000;
    
    // Use provided config or default to a generic news config
    this.config = options.config || {
      selectors: {
        itemContainer: '.search-result-indiv',  // Main container for each search result
        title: '.search-result__heading',        // Article title
        content: '.search-result__highlight',    // Article snippet
        date: '.search-result__timestamp',       // Publication date
        url: 'a.search-result__title-link'       // Link to the full article
      },
      scrollToBottom: true                       // Ensure all results are loaded
    };
    
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 5000;
  }

  /**
   * Start periodic scraping
   */
  start(): void {
    if (this.running) {
      console.log('Scraper already running');
      return;
    }

    this.running = true;
    console.log(`Starting periodic scraper for ${this.url} every ${this.intervalMs/1000} seconds`);
    
    // Run immediately on start
    this.scrape();
    
    // Then schedule periodic runs
    this.intervalId = setInterval(() => {
      this.scrape();
    }, this.intervalMs);
  }

  /**
   * Stop periodic scraping
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.running = false;
      console.log('Periodic scraper stopped');
    }
  }

  /**
   * Perform a single scrape operation
   */
  private async scrape(retryCount = 0): Promise<void> {
    try {
      console.log(`Scraping ${this.url} at ${new Date().toISOString()}`);
      
      // Perform the scrape
      const items = await scrapeWebsite(this.url, this.config);
      
      // Find new items that we haven't seen before
      const newItems = this.filterNewItems(items);
      
      if (newItems.length > 0) {
        // Process and emit new items
        const result = await this.processItems(newItems);
        this.emit('newContent', result);
        console.log(`Found ${newItems.length} new items`);
      } else {
        console.log('No new content found');
      }
      
    } catch (error) {
      console.error('Error during scraping:', error);
      
      // Implement retry logic
      if (retryCount < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelayMs/1000} seconds (attempt ${retryCount + 1}/${this.maxRetries})`);
        setTimeout(() => {
          this.scrape(retryCount + 1);
        }, this.retryDelayMs);
      } else {
        this.emit('error', error);
      }
    }
  }

  /**
   * Filter out items we've already seen before
   */
  private filterNewItems(items: ScrapedItem[]): ScrapedItem[] {
    const newItems: ScrapedItem[] = [];
    
    // Create a unique ID for each item based on title and URL
    items.forEach(item => {
      const itemId = this.createItemId(item);
      
      if (!this.lastItemIds.has(itemId)) {
        this.lastItemIds.add(itemId);
        newItems.push(item);
      }
    });
    
    // Keep the set size manageable (keep only the last 1000 items)
    if (this.lastItemIds.size > 1000) {
      const idsArray = Array.from(this.lastItemIds);
      this.lastItemIds = new Set(idsArray.slice(idsArray.length - 1000));
    }
    
    return newItems;
  }

  /**
   * Create a unique ID for a scraped item
   */
  private createItemId(item: ScrapedItem): string {
    return `${item.title || ''}-${item.url || ''}`;
  }

  /**
   * Process scraped items
   */
  private async processItems(items: ScrapedItem[]): Promise<ScrapingResult> {
    // Categorize items
    const categories = classifyNews(items);
    
    // Analyze content
    const analysis = await newsAnalyzer.analyzeNews(items);
    
    return {
      timestamp: new Date().toISOString(),
      source: new URL(this.url).hostname,
      items,
      categories,
      analysis
    };
  }
}

export default PeriodicScraper; 