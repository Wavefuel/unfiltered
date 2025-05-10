import { Request, Response } from 'express';
import { newsService, NewsSearchQuery } from '../services/newsService';

export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { siteName, query, url } = req.query as { 
      siteName?: string; 
      query?: string; 
      url?: string;
    };
    
    // Validate input
    if ((!siteName || !query) && !url) {
      res.status(400).json({ 
        error: 'Missing required parameters. Provide either siteName+query or url.' 
      });
      return;
    }
    
    const searchParams: NewsSearchQuery = {
      siteName,
      query,
      url
    };
    
    // Get news data
    const result = await newsService.getNews(searchParams);
    
    res.json(result);
  } catch (error) {
    console.error('Error scraping news:', error);
    res.status(500).json({ 
      error: 'Failed to scrape news',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSupportedSites = (req: Request, res: Response): void => {
  try {
    const sites = newsService.getSupportedSites();
    res.json({ sites });
  } catch (error) {
    console.error('Error getting sites:', error);
    res.status(500).json({ 
      error: 'Failed to get supported sites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 