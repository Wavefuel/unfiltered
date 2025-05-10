import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';
import { Browser, Page } from 'puppeteer';
import { executablePath } from 'puppeteer';

// Apply stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

export interface ScraperConfig {
  selectors: { [key: string]: string };
  waitForSelector?: string;
  scrollToBottom?: boolean;
  delay?: number;
  clickSelectors?: string[];
  pagination?: {
    nextButtonSelector: string;
    maxPages: number;
  };
  loginRequired?: boolean;
  loginCredentials?: {
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
    username: string;
    password: string;
  };
  extractMedia?: boolean;
  summarizeContent?: boolean;
  summarizeLength?: number;
  customEvaluation?: (page: Page) => Promise<any[]>;
}

export interface NewsSiteConfig {
  siteName: string;
  baseUrl: string;
  config: ScraperConfig;
}

export interface ScrapedItem {
  title?: string | null;
  content?: string | null;
  author?: string | null;
  date?: string | null;
  url?: string | null;
  siteName?: string;
  summary?: string | null;
  mediaUrls?: string[] | null;
  location?: string | null;
  category?: string | null;
  [key: string]: any;
}

// Add a global browser instance that will be reused
let browserInstance: Browser | null = null;

// Function to get or create a browser instance
async function getBrowser(): Promise<Browser> {
  // Check if we need to create a new browser instance
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({ 
      headless: true, // Using false for better stealth
      executablePath: executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ]
    });
    return browserInstance;
  }
  
  // Check if existing browser is still usable
  try {
    // Simply try to create a new page as a test
    const testPage = await browserInstance.newPage();
    await testPage.close();
    return browserInstance;
  } catch (error) {
    // Browser is not usable, create a new one
    try {
      browserInstance = await puppeteer.launch({ 
        headless: false,
        executablePath: executablePath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1920,1080'
        ]
      });
    } catch (launchError) {
      console.error('Error launching browser:', launchError);
      throw launchError;
    }
    return browserInstance;
  }
}

// Function to cleanup browser instance (can be called when app is shutting down)
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      console.error('Error closing browser:', error);
    } finally {
      browserInstance = null;
    }
  }
}

async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  
  // Set random user agent using random-useragent
  const randomUA = randomUseragent.getRandom();
  await page.setUserAgent(randomUA);
  
  // Set viewport to match a desktop browser
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Add additional headers that browsers typically include
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });
  
  return page;
}

async function login(page: Page, config: ScraperConfig): Promise<void> {
  if (!config.loginRequired || !config.loginCredentials) return;
  
  const { usernameSelector, passwordSelector, submitSelector, username, password } = config.loginCredentials;
  
  await page.type(usernameSelector, username);
  await page.type(passwordSelector, password);
  await page.click(submitSelector);
  // Wait for login to complete
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Helper function to create a simple summary (used when summarizeContent is true)
function generateSummary(text: string, maxLength: number = 150): string {
  if (!text) return '';
  
  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Find the last space before the maxLength
  const lastSpaceIndex = cleanText.lastIndexOf(' ', maxLength);
  
  if (lastSpaceIndex === -1) {
    return cleanText.substring(0, maxLength) + '...';
  }
  
  return cleanText.substring(0, lastSpaceIndex) + '...';
}

export async function scrapeWebsite(url: string, config: ScraperConfig): Promise<ScrapedItem[]> {
  // Get or create browser instance instead of launching a new one
  const browser = await getBrowser();
  
  // Create a new page (tab) in the browser
  const page = await setupPage(browser);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    
    if (config.loginRequired) {
      await login(page, config);
    }
    
    if (config.waitForSelector) {
      await page.waitForSelector(config.waitForSelector, { timeout: 60000 });
    }
    
    // Execute click actions if specified
    if (config.clickSelectors && config.clickSelectors.length > 0) {
      for (const selector of config.clickSelectors) {
        await page.click(selector);
        // Wait for possible UI updates
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Scroll to load dynamic content if needed
    if (config.scrollToBottom) {
      await autoScroll(page);
    }
    
    // Add delay if specified
    if (config.delay) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
    
    let allResults: ScrapedItem[] = [];
    
    // If custom evaluation function is provided, use it
    if (config.customEvaluation) {
      allResults = await config.customEvaluation(page);
    } else {
      // Handle pagination if specified
      const pagesToScrape = config.pagination ? config.pagination.maxPages : 1;
      
      for (let i = 0; i < pagesToScrape; i++) {
        // Extract data from current page
        const currentPageData = await page.evaluate((selectors) => {
          // For multiple items (like posts or articles)
          const itemSelector = selectors.itemContainer;
          let results: any[] = [];
          
          if (itemSelector) {
            // Multiple items on page (news articles list)
            const items = document.querySelectorAll(itemSelector);
            
            items.forEach(item => {
              const result: any = {};
              
              for (const key in selectors) {
                if (key === 'itemContainer') continue;
                
                // Check if this is a list selector (for comments, etc.)
                if (key.endsWith('List') && selectors[key]) {
                  const listItems = Array.from(item.querySelectorAll(selectors[key]));
                  result[key.replace('List', '')] = listItems.map(li => (li as HTMLElement).innerText.trim());
                  continue;
                }
                
                // Regular field
                const el = item.querySelector(selectors[key]);
                if (el) {
                  result[key] = (el as HTMLElement).innerText.trim();
                  
                  // Try to parse date strings
                  if (key === 'date' && result[key]) {
                    try {
                      const dateObj = new Date(result[key] as string);
                      if (!isNaN(dateObj.getTime())) {
                        result[key] = dateObj.toISOString();
                      }
                    } catch (e) {
                      // Keep original date string
                    }
                  }
                } else {
                  result[key] = null;
                }
              }
              
              // Extract media URLs if selector is provided
              if (selectors.mediaList) {
                const mediaElements = item.querySelectorAll(selectors.mediaList);
                result.mediaUrls = Array.from(mediaElements).map(el => {
                  // For images
                  if (el.tagName === 'IMG') {
                    return (el as HTMLImageElement).src;
                  }
                  // For videos
                  if (el.tagName === 'VIDEO') {
                    return (el as HTMLVideoElement).src;
                  }
                  // For elements with background-image
                  const style = window.getComputedStyle(el);
                  if (style.backgroundImage && style.backgroundImage !== 'none') {
                    return style.backgroundImage.slice(4, -1).replace(/["']/g, '');
                  }
                  return null;
                }).filter(url => url !== null);
              }
              
              // Extract article URL from link element if available
              if (selectors.url) {
                const urlEl = item.querySelector(selectors.url) as HTMLAnchorElement;
                if (urlEl && urlEl.href) {
                  result.url = urlEl.href;
                } else {
                  result.url = window.location.href;
                }
              } else {
                result.url = window.location.href;
              }
              
              results.push(result);
            });
            
            return results;
          } else {
            // Single item page (article detail)
            const result: any = {};
            
            for (const key in selectors) {
              if (key === 'itemContainer') continue;
              
              const el = document.querySelector(selectors[key]);
              result[key] = el ? (el as HTMLElement).innerText.trim() : null;
              
              // Handle date parsing
              if (key === 'date' && result[key]) {
                try {
                  const dateObj = new Date(result[key] as string);
                  if (!isNaN(dateObj.getTime())) {
                    result[key] = dateObj.toISOString();
                  }
                } catch (e) {
                  // Keep original date string
                }
              }
            }
            
            // Extract media URLs if selector is provided
            if (selectors.mediaList) {
              const mediaElements = document.querySelectorAll(selectors.mediaList);
              result.mediaUrls = Array.from(mediaElements).map(el => {
                // For images
                if (el.tagName === 'IMG') {
                  return (el as HTMLImageElement).src;
                }
                // For videos
                if (el.tagName === 'VIDEO') {
                  return (el as HTMLVideoElement).src;
                }
                // For elements with background-image
                const style = window.getComputedStyle(el);
                if (style.backgroundImage && style.backgroundImage !== 'none') {
                  return style.backgroundImage.slice(4, -1).replace(/["']/g, '');
                }
                return null;
              }).filter(url => url !== null);
            }
            
            // Set current URL
            result.url = window.location.href;
            
            return [result];
          }
        }, config.selectors);
        
        // Post-process the data if needed
        if (config.summarizeContent) {
          currentPageData.forEach(item => {
            if (item.content) {
              item.summary = generateSummary(item.content, config.summarizeLength || 150);
            }
          });
        }
        
        allResults = [...allResults, ...currentPageData];
        
        // Navigate to next page if pagination is configured and we're not on the last page
        if (config.pagination && i < pagesToScrape - 1) {
          const hasNextPage = await page.$(config.pagination.nextButtonSelector);
          if (hasNextPage) {
            await page.click(config.pagination.nextButtonSelector);
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            // Allow some time for the next page to load
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            break; // No more pages
          }
        }
      }
    }
    
    return allResults;
  } finally {
    // Close the page (tab) instead of the browser
    await page.close();
  }
}

// Pre-configured news site configs
export const newsSiteConfigs: { [key: string]: NewsSiteConfig } = {
  newsGeneric: {
    siteName: 'news',
    baseUrl: '',
    config: {
      selectors: {
        title: 'h1',
        content: 'article p, .article-body p, .story-body p',
        author: '.author, .byline, [rel="author"]',
        date: 'time, .date, .published-date',
      }
    }
  },
  reuters: {
    siteName: 'reuters',
    baseUrl: 'https://www.reuters.com',
    config: {
      selectors: {
        itemContainer: 'li[data-testid="StoryCard"]',
        title: 'span[data-testid="TitleHeading"]',
        date: 'time[data-testid="DateLineText"]',
        url: 'a[data-testid="TitleLink"]',
        category: 'span[data-testid="KickerLabel"]',
        mediaList: 'div[data-testid="Image"] img'
      },
      scrollToBottom: true,
      waitForSelector: 'li[data-testid="StoryCard"]',
      summarizeContent: true,
      summarizeLength: 150,
    }
  },
  nytimes: {
    siteName: 'nytimes',
    baseUrl: 'https://www.nytimes.com',
    config: {
      selectors: {
        itemContainer: 'article',
        title: 'h2',
        content: 'p.css-1echdzn',
        date: 'time',
        url: 'a',
        mediaList: 'img'
      },
      scrollToBottom: true,
      summarizeContent: true
    }
  },
  bbc: {
    siteName: 'bbc',
    baseUrl: 'https://www.bbc.co.uk',
    config: {
      selectors: {
        itemContainer: '.gs-c-promo',
        title: '.gs-c-promo-heading__title',
        content: '.gs-c-promo-summary',
        date: 'time',
        url: 'a.gs-c-promo-heading',
        mediaList: 'img'
      },
      scrollToBottom: true,
      summarizeContent: true
    }
  },
  theguardian: {
    siteName: 'theguardian',
    baseUrl: 'https://www.theguardian.com',
    config: {
      selectors: {
        itemContainer: '.fc-item',
        title: '.fc-item__title',
        content: '.fc-item__standfirst',
        date: 'time',
        url: 'a.fc-item__link',
        mediaList: '.fc-item__image-container img'
      },
      scrollToBottom: true,
      summarizeContent: true
    }
  },
  apnews: {
    siteName: 'apnews',
    baseUrl: 'https://apnews.com',
    config: {
      selectors: {
        itemContainer: '.fc-item',
        title: '.fc-item__title',
        content: '.fc-item__standfirst',
        date: 'time',
        url: 'a.fc-item__link',
        mediaList: '.fc-item__image-container img'
      },
      scrollToBottom: true,
      summarizeContent: true
    }
  }
};