import { scrapeWebsite, newsSiteConfigs, ScrapedItem, ScraperConfig, NewsSiteConfig } from '../utils/scraper';
import { newsAnalyzer, classifyNews, AnalysisResult } from '../utils/analyzer';

export interface NewsSearchQuery {
  siteName?: string;
  query?: string;
  url?: string;
  config?: ScraperConfig;
}

export interface NewsScrapingResult {
  scrapeTime: string;
  source: string;
  query?: string;
  items: ScrapedItem[];
  categories: { [category: string]: ScrapedItem[] };
  analysis: AnalysisResult;
}

export class NewsService {
  /**
   * Scrape news from a news site using a search query
   */
  async scrapeNewsSiteWithQuery(siteName: string, query: string): Promise<NewsScrapingResult> {
    const startTime = new Date();
    
    const siteConfig = newsSiteConfigs[siteName];
    if (!siteConfig) {
      throw new Error(`Unsupported news site: ${siteName}`);
    }
    
    // Construct search URL based on the site
    let searchUrl = '';
    
    switch (siteName) {
      case 'reuters':
        searchUrl = `${siteConfig.baseUrl}/site-search/?query=${encodeURIComponent(query)}&offset=0`;
        break;
      case 'nytimes':
        searchUrl = `${siteConfig.baseUrl}/search?query=${encodeURIComponent(query)}`;
        break;
      case 'bbc':
        searchUrl = `${siteConfig.baseUrl}/search?q=${encodeURIComponent(query)}&d=NEWS_GNL`;
        break;
      case 'theguardian':
        searchUrl = `${siteConfig.baseUrl}/search?q=${encodeURIComponent(query)}`;
        break;
      default:
        throw new Error(`Search URL not configured for site: ${siteName}`);
    }
    
    // Scrape data
    const items = await scrapeWebsite(searchUrl, siteConfig.config);
    
    // Add site info to results
    const enrichedItems = items.map(item => ({
      ...item,
      siteName
    }));
    
    // Categorize items
    const categories = classifyNews(enrichedItems);
    
    // Analyze content
    const analysis = await newsAnalyzer.analyzeNews(enrichedItems);
    
    return {
      scrapeTime: startTime.toISOString(),
      source: siteName,
      query,
      items: enrichedItems,
      categories,
      analysis
    };
  }
  
  /**
   * Scrape news from a website URL
   */
  async scrapeNewsWebsite(url: string, config?: ScraperConfig, siteName?: string): Promise<NewsScrapingResult> {
    const startTime = new Date();
    
    // Determine which site we're scraping based on URL if siteName not provided
    if (!siteName) {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Find matching site config based on hostname
      const matchedSite = Object.entries(newsSiteConfigs).find(
        ([_, config]) => hostname.includes(config.siteName) || 
                          config.baseUrl.includes(hostname)
      );
      
      if (matchedSite) {
        siteName = matchedSite[0];
      }
    }
    
    // Use provided config, site-specific config, or generic news config
    const scrapingConfig = config || 
      (siteName && newsSiteConfigs[siteName]?.config) || 
      newsSiteConfigs.newsGeneric.config;
    
    // Scrape data
    const items = await scrapeWebsite(url, scrapingConfig);
    
    // Add site info to results if available
    const enrichedItems = items.map(item => ({
      ...item,
      siteName: siteName || new URL(url).hostname
    }));
    
    // Categorize items
    const categories = classifyNews(enrichedItems);
    
    // Analyze content
    const analysis = await newsAnalyzer.analyzeNews(enrichedItems);
    
    return {
      scrapeTime: startTime.toISOString(),
      source: siteName || new URL(url).hostname,
      items: enrichedItems,
      categories,
      analysis
    };
  }
  
  /**
   * Get news from various sources based on query
   */
  async getNews(searchParams: NewsSearchQuery): Promise<NewsScrapingResult> {
    if (searchParams.siteName && searchParams.query) {
      return this.scrapeNewsSiteWithQuery(searchParams.siteName, searchParams.query);
    } else if (searchParams.url) {
      return this.scrapeNewsWebsite(searchParams.url, searchParams.config, searchParams.siteName);
    } else {
      throw new Error('Invalid search parameters. Must provide either siteName+query or url.');
    }
  }
  
  /**
   * Get supported news sites
   */
  getSupportedSites(): string[] {
    return Object.keys(newsSiteConfigs);
  }
}

// Export singleton instance
export const newsService = new NewsService(); 