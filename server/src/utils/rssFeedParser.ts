import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { ScrapedItem } from '../types';

/**
 * Interface for RSS feed items
 */
interface RssItem {
  title?: string[];
  description?: string[];
  link?: string[];
  pubDate?: string[];
  'media:content'?: Array<{
    $: {
      url: string;
      medium: string;
      type: string;
    };
  }>;
  category?: string[];
  guid?: string[];
  creator?: string[];
  'dc:creator'?: string[];
  author?: string[];
}

/**
 * Parse an RSS feed URL and return scraped items
 */
export async function parseRssFeed(feedUrl: string): Promise<ScrapedItem[]> {
  try {
    // Fetch the RSS feed
    const response = await axios.get(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    // Parse XML to JS object
    const result = await parseStringPromise(response.data, {
      explicitArray: true,
      explicitRoot: true
    });

    // Check if this is a valid RSS feed
    if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
      throw new Error('Invalid RSS feed format');
    }

    // Extract items from the feed
    const items = result.rss.channel[0].item;
    
    // Map RSS items to ScrapedItem format
    return items.map((item: RssItem) => {
      // Extract media URLs if available
      const mediaUrls: string[] = [];
      
      if (item['media:content']) {
        item['media:content'].forEach(media => {
          if (media.$ && media.$.url) {
            mediaUrls.push(media.$.url);
          }
        });
      }
      
      // Extract date and format as ISO string if possible
      let dateStr = '';
      if (item.pubDate && item.pubDate.length > 0) {
        try {
          const date = new Date(item.pubDate[0]);
          if (!isNaN(date.getTime())) {
            dateStr = date.toISOString();
          } else {
            dateStr = item.pubDate[0];
          }
        } catch (e) {
          dateStr = item.pubDate[0];
        }
      }
      
      // Extract author information from various possible fields
      let author = '';
      if (item.author && item.author.length > 0) {
        author = item.author[0];
      } else if (item['dc:creator'] && item['dc:creator'].length > 0) {
        author = item['dc:creator'][0];
      } else if (item.creator && item.creator.length > 0) {
        author = item.creator[0];
      }
      
      // Extract categories if available
      const categories = item.category ? item.category.map(cat => cat) : [];
      
      return {
        title: item.title ? item.title[0] : '',
        content: item.description ? item.description[0] : '',
        url: item.link ? item.link[0] : '',
        date: dateStr,
        author,
        mediaUrls,
        categories,
        id: item.guid && item.guid.length > 0 ? item.guid[0] : `${Date.now()}-${Math.random()}`
      };
    });
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * CNBC RSS feeds configuration
 */
export const cnbcRssFeeds = {
  topNews: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  worldNews: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
  business: 'https://www.cnbc.com/id/10001147/device/rss/rss.html',
  investing: 'https://www.cnbc.com/id/15839069/device/rss/rss.html',
  technology: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
  politics: 'https://www.cnbc.com/id/10000113/device/rss/rss.html',
  economy: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',
  finance: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
  health: 'https://www.cnbc.com/id/10000108/device/rss/rss.html',
  realestate: 'https://www.cnbc.com/id/10000115/device/rss/rss.html',
  wealth: 'https://www.cnbc.com/id/10001054/device/rss/rss.html',
  commentary: 'https://www.cnbc.com/id/100370673/device/rss/rss.html',
  earnings: 'https://www.cnbc.com/id/15839135/device/rss/rss.html',
  media: 'https://www.cnbc.com/id/10000110/device/rss/rss.html',
  energy: 'https://www.cnbc.com/id/19836768/device/rss/rss.html',
  retail: 'https://www.cnbc.com/id/10000116/device/rss/rss.html'
}; 