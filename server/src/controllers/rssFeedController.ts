import { Request, Response } from "express";
import { parseRssFeed, cnbcRssFeeds } from "../utils/rssFeedParser";
import { classifyNews } from "../utils/classifier";
import { NewsAnalyzer } from "../utils/analyzer";
import { scrapeWebsite } from "../utils/scraper";

// Create news analyzer instance
const newsAnalyzer = new NewsAnalyzer();

/**
 * Get available CNBC RSS feed categories
 */
export const getRssFeedCategories = (req: Request, res: Response): void => {
	try {
		const categories = Object.keys(cnbcRssFeeds);
		res.json({
			categories,
			urls: cnbcRssFeeds,
		});
	} catch (error) {
		console.error("Error getting RSS feed categories:", error);
		res.status(500).json({
			error: "Failed to get RSS feed categories",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

const isValidItem = (item: any) => {
	const keys = ["title", "link", "description", "content"];
	return keys.some((key) => item[key] && item[key].toLowerCase().includes("pakistan"));
};

/**
 * Get news from CNBC RSS feed
 */
export const getRssNews = async (req: Request, res: Response): Promise<void> => {
	try {
		const { category } = req.params;
		const { url } = req.query as { url?: string };

		let feedUrl: string;

		// If URL is provided directly, use it
		if (url) {
			feedUrl = url;
		}
		// Otherwise, check if category is valid
		else if (category && category in cnbcRssFeeds) {
			feedUrl = cnbcRssFeeds[category as keyof typeof cnbcRssFeeds];
		}
		// Default to top news
		else {
			feedUrl = cnbcRssFeeds.topNews;
		}

		// Parse the RSS feed
		const items = await parseRssFeed(feedUrl);

		// Add site info to results
		const enrichedItems = items
			.filter((item) => isValidItem(item))
			.map((item) => ({
				...item,
				siteName: "cnbc",
			}));

		// Categorize items
		const categories = classifyNews(enrichedItems);

		// Analyze content
		const analysis = await newsAnalyzer.analyzeNews(enrichedItems);

		await Promise.all(
			enrichedItems.map(async (item) => {
				try {
					const scrapedWebsite = await scrapeWebsite(item.url, {
						selectors: {
							title: "h1",
							content: "article p, .article-body p, .story-body p",
							author: ".author, .byline, [rel='author']",
							date: "time, .date, .published-date",
						},
					});
					return scrapedWebsite;
				} catch (err) {
					throw err;
				}
			})
		);

		// Return the result
		res.json({
			scrapeTime: new Date().toISOString(),
			source: "cnbc",
			feedUrl,
			items: enrichedItems,
			categories,
			analysis,
		});
	} catch (error) {
		console.error("Error getting RSS news:", error);
		res.status(500).json({
			error: "Failed to get RSS news",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};
