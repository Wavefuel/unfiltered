import { FastifyInstance } from 'fastify';

export async function routes(fastify: FastifyInstance) {
    // Register all route groups
    // await fastify.register(xyzRoutes, { prefix: '/api/v1/xyz' });
}
// import { Router } from 'express';
// // import { getNews, getSupportedSites } from '../controllers';
// // import periodicScrapeController from '../controllers/periodicScrapeController';
// import { getRssFeedCategories, getRssNews } from '../controllers/rssFeedController';

// const router = Router();

// // // Get news from various sources
// // router.get('/scrape', getNews);

// // // Get supported sites
// // router.get("/sites", getSupportedSites);

// // // Periodic scraper routes
// // router.post('/periodic-scrape', periodicScrapeController.startPeriodicScraper);
// // router.delete('/periodic-scrape/:scraperId', periodicScrapeController.stopPeriodicScraper);
// // router.get('/periodic-scrape', periodicScrapeController.listPeriodicScrapers);

// // RSS feed routes
// router.get('/rss/categories', getRssFeedCategories);
// router.get('/rss/:category', getRssNews);
// router.get('/rss', getRssNews);

// export default router;
