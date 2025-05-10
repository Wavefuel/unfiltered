import { Request, Response } from 'express';
import PeriodicScraper from '../utils/periodicScraper';
import { ScraperConfig, newsSiteConfigs } from '../utils/scraper';
import { newsService } from '../services/newsService';

// Store active scrapers by ID
const activeScrapers: Map<string, PeriodicScraper> = new Map();

// WebSocket connections for real-time updates
const wsConnections: Set<any> = new Set();

// Pre-configured scraping tasks to start automatically
interface ScrapingTask {
  name: string;
  siteName: string;
  query: string;
  intervalSeconds: number;
  enabled: boolean;
}

// Default scraping tasks that will start automatically when the server starts
export const defaultScrapingTasks: ScrapingTask[] = [
  // Add your default scraping tasks here, for example:
  {
    name: "Reuters Dog News",
    siteName: "reuters",
    query: "dogs",
    intervalSeconds: 300, // every 5 minutes
    enabled: true
  },
];

/**
 * Initialize default scraping tasks
 */
export const initializeDefaultScrapers = async (): Promise<void> => {
  console.log('Initializing default scrapers...');
  
  for (const task of defaultScrapingTasks) {
    if (task.enabled) {
      try {
        // Check if site is supported
        if (!newsSiteConfigs[task.siteName]) {
          console.error(`Unsupported site '${task.siteName}' for default scraper: ${task.name}`);
          continue;
        }

        const scraperId = `${task.name}-${Date.now()}`;
        
        // Determine search URL
        let searchUrl = '';
        try {
          // Use the newsService to determine the URL for the search query
          searchUrl = constructSearchUrl(task.siteName, task.query);
        } catch (error) {
          console.error(`Error constructing search URL for ${task.name}:`, error);
          continue;
        }
        
        const config = newsSiteConfigs[task.siteName].config;
        
        // Create and start the scraper
        const scraper = new PeriodicScraper({
          url: searchUrl,
          intervalSeconds: task.intervalSeconds,
          config: config
        });
        
        // Set up event handlers
        scraper.on('newContent', (data) => {
          console.log(`New content found for ${task.name} (${searchUrl})`);
          
          // Notify all connected WebSocket clients
          wsConnections.forEach(ws => {
            if (ws.readyState === 1) { // OPEN
              ws.send(JSON.stringify({
                type: 'newContent',
                scraperId,
                data
              }));
            }
          });
          
          // Here you would add code to store the data in your database
          // saveToDatabase(data);
        });
        
        scraper.on('error', (error) => {
          console.error(`Error in scraper for ${task.name}:`, error);
        });
        
        // Start the scraper
        scraper.start();
        
        // Store the scraper
        activeScrapers.set(scraperId, scraper);
        
        console.log(`Started default scraper: ${task.name}`);
      } catch (error) {
        console.error(`Failed to start default scraper ${task.name}:`, error);
      }
    }
  }
  
  console.log(`${Array.from(activeScrapers.keys()).length} default scrapers started.`);
};

/**
 * Helper function to construct a search URL based on the site
 */
function constructSearchUrl(siteName: string, query: string): string {
  const siteConfig = newsSiteConfigs[siteName];
  if (!siteConfig) {
    throw new Error(`Unsupported news site: ${siteName}`);
  }
  
  switch (siteName) {
    case 'reuters':
      return `${siteConfig.baseUrl}/site-search/?query=${encodeURIComponent(query)}&offset=0`;
    case 'nytimes':
      return `${siteConfig.baseUrl}/search?query=${encodeURIComponent(query)}`;
    case 'bbc':
      return `${siteConfig.baseUrl}/search?q=${encodeURIComponent(query)}&d=NEWS_GNL`;
    case 'theguardian':
      return `${siteConfig.baseUrl}/search?q=${encodeURIComponent(query)}`;
    default:
      throw new Error(`Search URL not configured for site: ${siteName}`);
  }
}

/**
 * Start a new periodic scraper
 */
export const startPeriodicScraper = async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteName, query, url, intervalSeconds = 30, config, name } = req.body;
    
    if ((!siteName || !query) && !url) {
      res.status(400).json({ error: 'Missing required parameters. Provide either siteName+query or url.' });
      return;
    }
    
    // Create a unique ID for this scraper
    const scraperId = name ? `${name}-${Date.now()}` : 
                     siteName ? `${siteName}-${query}-${Date.now()}` : 
                     `${url}-${Date.now()}`;
    
    // Check if we already have a scraper for this name
    for (const [id, scraper] of activeScrapers.entries()) {
      if (name && id.startsWith(name)) {
        res.status(400).json({ 
          error: 'A scraper with this name is already running',
          scraperId: id
        });
        return;
      }
    }
    
    // Determine the URL and configuration
    let scraperUrl = url;
    let scraperConfig: ScraperConfig | undefined = config as ScraperConfig;
    
    if (siteName && query) {
      try {
        // Use the site-specific logic to construct the search URL
        scraperUrl = constructSearchUrl(siteName, query);
        // Use the site's default config if none provided
        if (!scraperConfig) {
          scraperConfig = newsSiteConfigs[siteName]?.config;
        }
      } catch (error) {
        res.status(400).json({ 
          error: `Error configuring scraper: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        return;
      }
    }
    
    if (!scraperUrl) {
      res.status(400).json({ error: 'Could not determine URL for scraping' });
      return;
    }
    
    // Create and start the scraper
    const scraper = new PeriodicScraper({
      url: scraperUrl,
      intervalSeconds: Number(intervalSeconds),
      config: scraperConfig
    });
    
    // Set up event handlers
    scraper.on('newContent', (data) => {
      console.log(`New content found for ${name || scraperUrl}`);
      
      // Notify all connected WebSocket clients
      wsConnections.forEach(ws => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({
            type: 'newContent',
            scraperId,
            data
          }));
        }
      });
      
      // Here you would add code to store the data in your database
      // saveToDatabase(data);
    });
    
    scraper.on('error', (error) => {
      console.error(`Error in scraper for ${name || scraperUrl}:`, error);
    });
    
    // Start the scraper
    scraper.start();
    
    // Store the scraper
    activeScrapers.set(scraperId, scraper);
    
    res.json({ 
      message: 'Periodic scraper started successfully',
      scraperId,
      name: name || (siteName ? `${siteName}-${query}` : scraperUrl)
    });
    
  } catch (error) {
    console.error('Error starting periodic scraper:', error);
    res.status(500).json({
      error: 'Failed to start periodic scraper',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Stop a running periodic scraper
 */
export const stopPeriodicScraper = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scraperId } = req.params;
    
    if (!scraperId || !activeScrapers.has(scraperId)) {
      res.status(404).json({ error: 'Scraper not found' });
      return;
    }
    
    // Stop the scraper
    const scraper = activeScrapers.get(scraperId)!;
    scraper.stop();
    
    // Remove from active scrapers
    activeScrapers.delete(scraperId);
    
    res.json({ message: 'Periodic scraper stopped successfully' });
    
  } catch (error) {
    console.error('Error stopping periodic scraper:', error);
    res.status(500).json({
      error: 'Failed to stop periodic scraper',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * List all running scrapers
 */
export const listPeriodicScrapers = async (req: Request, res: Response): Promise<void> => {
  try {
    const scrapers = Array.from(activeScrapers.keys()).map(id => {
      const nameParts = id.split('-');
      const timestamp = nameParts.pop(); // Remove timestamp
      const name = nameParts.join('-'); // Reassemble the name
      
      return {
        id,
        name
      };
    });
    
    res.json({ scrapers });
    
  } catch (error) {
    console.error('Error listing periodic scrapers:', error);
    res.status(500).json({
      error: 'Failed to list periodic scrapers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Register WebSocket connection for real-time updates
 */
export const registerWebSocket = (ws: any): void => {
  wsConnections.add(ws);
  
  ws.on('close', () => {
    wsConnections.delete(ws);
  });
};

export default {
  startPeriodicScraper,
  stopPeriodicScraper,
  listPeriodicScrapers,
  registerWebSocket,
  initializeDefaultScrapers
}; 