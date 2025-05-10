import { ScrapedItem } from '../types';

/**
 * Categories for news classification
 */
export const newsCategories = {
  business: ['business', 'company', 'market', 'economy', 'stock', 'trade', 'finance', 'industry', 'corporate', 'commercial', 'economic', 'fiscal', 'monetary'],
  technology: ['tech', 'technology', 'software', 'hardware', 'internet', 'digital', 'app', 'robot', 'ai', 'artificial intelligence', 'machine learning', 'data', 'cyber', 'compute', 'code', 'programming', 'social media', 'online'],
  politics: ['politic', 'government', 'election', 'vote', 'president', 'congress', 'senate', 'democrat', 'republican', 'white house', 'administration', 'law', 'bill', 'legislation', 'regulation', 'policy'],
  health: ['health', 'medical', 'medicine', 'disease', 'doctor', 'patient', 'hospital', 'clinic', 'treatment', 'drug', 'vaccine', 'healthcare', 'wellness', 'pharma', 'covid', 'virus', 'pandemic'],
  sports: ['sport', 'game', 'team', 'player', 'league', 'championship', 'tournament', 'match', 'coach', 'athlete', 'win', 'lose', 'victory', 'defeat', 'score', 'basketball', 'football', 'soccer', 'baseball', 'tennis'],
  entertainment: ['entertainment', 'movie', 'film', 'tv', 'television', 'show', 'actor', 'actress', 'celebrity', 'star', 'music', 'concert', 'album', 'song', 'singer', 'band', 'performance', 'art', 'theater'],
  science: ['science', 'research', 'study', 'scientist', 'discovery', 'experiment', 'innovation', 'breakthrough', 'space', 'astronomy', 'physics', 'chemistry', 'biology', 'laboratory', 'climate', 'environment', 'energy'],
  finance: ['finance', 'investing', 'investment', 'investor', 'stock', 'market', 'fund', 'portfolio', 'asset', 'wealth', 'money', 'banking', 'bank', 'loan', 'credit', 'debt', 'profit', 'loss', 'revenue', 'earnings'],
  realestate: ['real estate', 'property', 'house', 'home', 'apartment', 'condo', 'mortgage', 'rent', 'lease', 'housing', 'commercial', 'residential', 'building', 'construction', 'development', 'land']
};

/**
 * Classify news items into categories
 */
export function classifyNews(items: ScrapedItem[]): { [key: string]: string[] } {
  const categorizedItems: { [key: string]: string[] } = {};
  
  // Initialize categories
  Object.keys(newsCategories).forEach(category => {
    categorizedItems[category] = [];
  });
  
  // Categorize each item
  items.forEach(item => {
    const combinedText = `${item.title} ${item.content || ''}`.toLowerCase();
    
    // Check each category's keywords
    Object.entries(newsCategories).forEach(([category, keywords]) => {
      // If any keyword is found in the text, add the item to that category
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        // Add the item's ID or URL to the category list
        categorizedItems[category].push(item.id || item.url);
      }
    });
  });
  
  return categorizedItems;
} 