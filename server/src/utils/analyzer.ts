import { ScrapedItem } from "../types";
import natural from "natural";
import stopword from "stopword";

/**
 * Interface for text analysis results
 */
export interface AnalysisResult {
	topics: {
		topWords: { [key: string]: number };
		topPhrases: { [key: string]: number };
	};
	sentiment: {
		overall: number;
		items: { [key: string]: number };
	};
	credibility: {
		score: number;
		factors: { [key: string]: number };
	};
	timestamp: string;
}

/**
 * Class for analyzing news content
 */
export class NewsAnalyzer {
	private tokenizer: natural.WordTokenizer;
	private analyzer: natural.SentimentAnalyzer;
	private languageProcessor: natural.WordNet;

	constructor() {
		this.tokenizer = new natural.WordTokenizer();
		// Use the correct stemmer
		this.analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
		this.languageProcessor = new natural.WordNet();
	}

	/**
	 * Analyze a collection of scraped news items
	 */
	public async analyzeNews(newsItems: ScrapedItem[]): Promise<AnalysisResult> {
		// Combine all text content for overall analysis
		const combinedContent = newsItems.map((item) => `${item.title || ""} ${item.content || ""}`).join(" ");
		
		return {
			topics: this.analyzeTopics(combinedContent, newsItems),
			sentiment: this.analyzeSentiment(combinedContent, newsItems),
			credibility: this.analyzeCredibility(newsItems),
			timestamp: new Date().toISOString(),
		};
	}
	
	/**
	 * Analyze text for topic extraction
	 */
	private analyzeTopics(text: string, newsItems: ScrapedItem[]): { topWords: { [key: string]: number }; topPhrases: { [key: string]: number } } {
		// Simple placeholder implementation
		// In a real implementation, you would use NLP techniques like TF-IDF
		
		// Extract individual words, convert to lowercase, and count occurrences
		const words = text.toLowerCase().match(/\b[a-z]{3,15}\b/g) || [];
		const wordCounts: { [key: string]: number } = {};
		
		words.forEach(word => {
			if (!this.isStopWord(word)) {
				wordCounts[word] = (wordCounts[word] || 0) + 1;
			}
		});
		
		// Sort by count and take top 10
		const topWords = Object.entries(wordCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.reduce((obj, [word, count]) => {
				obj[word] = count;
				return obj;
			}, {} as { [key: string]: number });
		
		// For phrases, just use a simplified approach
		const topPhrases: { [key: string]: number } = {};
		
		// Use titles as phrases
		newsItems.forEach(item => {
			if (item.title) {
				const phrase = item.title.substring(0, 50);
				topPhrases[phrase] = 1;
			}
		});
		
		return { topWords, topPhrases };
	}
	
	/**
	 * Analyze text for sentiment
	 */
	private analyzeSentiment(text: string, newsItems: ScrapedItem[]): { overall: number; items: { [key: string]: number } } {
		// Simple placeholder implementation
		// In a real implementation, you would use a sentiment analysis library
		
		// Just return a random sentiment between -1 and 1 for now
		const overall = Math.random() * 2 - 1;
		
		// Generate random sentiment for each item
		const items: { [key: string]: number } = {};
		newsItems.forEach(item => {
			items[item.id || item.url] = Math.random() * 2 - 1;
		});
		
		return { overall, items };
	}
	
	/**
	 * Analyze credibility of news items
	 */
	private analyzeCredibility(newsItems: ScrapedItem[]): { score: number; factors: { [key: string]: number } } {
		// Simple placeholder implementation
		// In a real implementation, you would check various credibility factors
		
		// Default credibility is 0.7 (moderately credible)
		const score = 0.7;
		
		// Some made-up credibility factors
		const factors = {
			sourceReputation: 0.8,
			contentQuality: 0.7,
			dateFreshness: 0.9,
			authorCredibility: 0.6,
		};
		
		return { score, factors };
	}
	
	/**
	 * Check if a word is a common stop word
	 */
	private isStopWord(word: string): boolean {
		const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'by', 'about', 'as', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'if', 'then', 'else', 'when', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
		
		return stopWords.includes(word);
	}
}

// Helper function to classify news into categories
export function classifyNews(items: ScrapedItem[]): { [category: string]: ScrapedItem[] } {
	const categories: { [key: string]: ScrapedItem[] } = {
		politics: [],
		business: [],
		technology: [],
		health: [],
		entertainment: [],
		sports: [],
		science: [],
		other: [],
	};

	const categoryKeywords: { [key: string]: string[] } = {
		politics: [
			"politics",
			"government",
			"election",
			"president",
			"congress",
			"senate",
			"minister",
			"parliament",
			"vote",
			"law",
			"democrat",
			"republican",
			"policy",
		],
		business: [
			"business",
			"economy",
			"stock",
			"market",
			"finance",
			"economic",
			"company",
			"trade",
			"industry",
			"corporate",
			"invest",
			"dollar",
			"profit",
		],
		technology: [
			"technology",
			"tech",
			"digital",
			"software",
			"computer",
			"internet",
			"app",
			"data",
			"cyber",
			"AI",
			"artificial intelligence",
			"machine learning",
			"blockchain",
		],
		health: [
			"health",
			"medical",
			"medicine",
			"disease",
			"virus",
			"hospital",
			"doctor",
			"patient",
			"treatment",
			"pandemic",
			"vaccine",
			"covid",
			"cancer",
		],
		entertainment: [
			"entertainment",
			"movie",
			"film",
			"celebrity",
			"actor",
			"actress",
			"music",
			"star",
			"hollywood",
			"TV",
			"show",
			"performance",
			"album",
		],
		sports: [
			"sports",
			"football",
			"soccer",
			"basketball",
			"baseball",
			"tennis",
			"tournament",
			"championship",
			"player",
			"team",
			"match",
			"win",
			"game",
		],
		science: [
			"science",
			"research",
			"study",
			"scientist",
			"discovery",
			"experiment",
			"space",
			"planet",
			"nasa",
			"climate",
			"environment",
			"species",
			"physics",
		],
	};

	items.forEach((item) => {
		const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();

		let assignedCategory = false;
		for (const category in categoryKeywords) {
			for (const keyword of categoryKeywords[category]) {
				if (text.includes(keyword.toLowerCase())) {
					categories[category].push(item);
					assignedCategory = true;
					break;
				}
			}
			if (assignedCategory) break;
		}

		if (!assignedCategory) {
			categories.other.push(item);
		}
	});

	return categories;
}

// Export an instance for direct use
export const newsAnalyzer = new NewsAnalyzer();
