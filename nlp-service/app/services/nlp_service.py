import os
import spacy
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
from nltk.collocations import BigramCollocationFinder, TrigramCollocationFinder
from nltk.metrics import BigramAssocMeasures, TrigramAssocMeasures
from collections import Counter
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import torch
from geopy.geocoders import Nominatim
import country_converter as coco
import logging
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NLPService:
    def __init__(self):
        """Initialize NLP models and services."""
        logger.info("Initializing NLP service...")
        
        # Load spaCy model for NER and basic processing
        logger.info("Loading spaCy model...")
        self.nlp = spacy.load("en_core_web_md")
        
        # Load sentiment analyzer
        logger.info("Loading sentiment analyzer...")
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
        # Initialize transformers for more advanced tasks
        logger.info("Loading transformer models...")
        self.load_transformer_models()
        
        # Geolocation service
        logger.info("Initializing geolocation service...")
        self.geolocator = Nominatim(user_agent="nlp-microservice")
        
        # Load stopwords for text analysis
        try:
            self.stopwords = set(stopwords.words('english'))
            # Add custom stopwords relevant to news articles
            self.stopwords.update(['said', 'says', 'according', 'reported', 'reuters', 'afp'])
        except Exception as e:
            logger.warning(f"NLTK stopwords not found, downloading now: {e}")
            nltk.download('stopwords')
            self.stopwords = set(stopwords.words('english'))
        
        # Credibility scoring factors
        self.source_credibility = {
            # Major news networks (example scores, should be based on actual analysis)
            'bbc': 0.85,
            'cnn': 0.75,
            'reuters': 0.90,
            'ap': 0.90,
            'afp': 0.90,
            'nytimes': 0.85,
            'washingtonpost': 0.85,
            'theguardian': 0.85,
            'aljazeera': 0.75,
            'foxnews': 0.65,
            'cnbc': 0.80,
            'bloomberg': 0.85,
            # Default score for unknown sources
            'default': 0.50
        }
        
        logger.info("NLP service initialized successfully")
    
    def load_transformer_models(self):
        """Load transformer models for various NLP tasks."""
        # Text classification
        try:
            self.classifier = pipeline(
                "text-classification", 
                model="facebook/bart-large-mnli", 
                return_all_scores=True
            )
        except Exception as e:
            logger.error(f"Error loading classifier model: {e}")
            self.classifier = None
        
        # Text summarization
        try:
            self.summarizer = pipeline(
                "summarization", 
                model="facebook/bart-large-cnn"
            )
        except Exception as e:
            logger.error(f"Error loading summarizer model: {e}")
            self.summarizer = None
    
    def analyze_text(self, text: str, title: Optional[str] = None, 
                    source: Optional[str] = None, url: Optional[str] = None,
                    language: str = "en") -> Dict[str, Any]:
        """
        Perform comprehensive analysis on the provided text.
        
        Args:
            text: The main text content to analyze
            title: Optional title of the article
            source: Optional source of the content (e.g., publication name)
            url: Optional URL where the content was found
            language: Language code (default: "en" for English)
            
        Returns:
            Dictionary containing analysis results
        """
        logger.info(f"Analyzing text from source: {source}")
        
        # Combine title and text for better context if title is provided
        full_text = f"{title}. {text}" if title else text
        
        # Get sentiment
        sentiment = self.get_sentiment(full_text)
        
        # Extract entities
        entities = self.extract_entities(full_text)
        
        # Classify text
        classification = self.classify_text(full_text)
        
        # Extract geographic information
        geo_info = self.extract_geographic_info(full_text)
        
        # Generate summary
        summary = self.summarize_text(text)
        
        # Analyze bias
        bias = self.analyze_bias(full_text, source)
        
        # Get top words and phrases
        top_words = self.extract_top_words(text)
        top_phrases = self.extract_top_phrases(text)
        
        # Assess credibility
        credibility = self.assess_credibility(text, source, entities)
        
        return {
            "sentiment": sentiment,
            "entities": entities,
            "classification": classification,
            "geographic_info": geo_info,
            "summary": summary,
            "bias_analysis": bias,
            "topWords": top_words,
            "topPhrases": top_phrases,
            "credibility": credibility
        }
    
    def get_sentiment(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment of the provided text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment scores
        """
        try:
            # Use VADER for sentiment analysis
            scores = self.sentiment_analyzer.polarity_scores(text)
            return {
                "positive": scores["pos"],
                "negative": scores["neg"],
                "neutral": scores["neu"],
                "compound": scores["compound"]
            }
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {"error": str(e)}
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract named entities from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of extracted entities with type and context
        """
        try:
            doc = self.nlp(text)
            entities = []
            
            for ent in doc.ents:
                # Get the sentence containing this entity for context
                sent = next((sent for sent in doc.sents if ent.start >= sent.start and ent.end <= sent.end), None)
                context = sent.text if sent else ""
                
                entities.append({
                    "text": ent.text,
                    "type": ent.label_,
                    "start_char": ent.start_char,
                    "end_char": ent.end_char,
                    "context": context
                })
            
            return entities
        except Exception as e:
            logger.error(f"Error in entity extraction: {e}")
            return [{"error": str(e)}]
    
    def classify_text(self, text: str) -> Dict[str, float]:
        """
        Classify the text into predefined categories.
        
        Args:
            text: Text to classify
            
        Returns:
            Dictionary of category scores
        """
        try:
            if self.classifier is None:
                return {"error": "Classifier model not loaded"}
            
            # Define conflict-related categories for news articles
            categories = [
                "military action", 
                "diplomatic statement", 
                "civilian impact", 
                "protest", 
                "economic news", 
                "casualty report",
                "political development",
                "peace negotiation",
                "humanitarian crisis",
                "terrorism",
                "natural disaster",
                "election",
                "international agreement"
            ]
            
            # Use zero-shot classification
            results = self.classifier(text, categories)
            
            # Convert to simple dictionary format
            classification = {}
            for result in results[0]:
                classification[result['label']] = float(result['score'])
            
            return classification
        except Exception as e:
            logger.error(f"Error in text classification: {e}")
            return {"error": str(e)}
    
    def extract_geographic_info(self, text: str) -> Dict[str, Any]:
        """
        Extract geographic information from text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with geographic information
        """
        try:
            doc = self.nlp(text)
            locations = [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]]
            
            geo_data = {
                "mentioned_locations": locations,
                "coordinates": {},
                "countries": []
            }
            
            # Try to geocode the locations
            for loc in set(locations):
                try:
                    location = self.geolocator.geocode(loc, timeout=5)
                    if location:
                        geo_data["coordinates"][loc] = {
                            "latitude": location.latitude,
                            "longitude": location.longitude
                        }
                        
                        # Try to get country information
                        if hasattr(location, 'raw') and 'address' in location.raw:
                            country = location.raw['address'].get('country')
                            if country and country not in geo_data["countries"]:
                                geo_data["countries"].append(country)
                except Exception as e:
                    logger.warning(f"Could not geocode location '{loc}': {e}")
            
            # Convert country names to standard codes if needed
            if geo_data["countries"]:
                try:
                    geo_data["country_codes"] = {
                        country: coco.convert(names=country, to='ISO2') 
                        for country in geo_data["countries"]
                    }
                except Exception as e:
                    logger.warning(f"Could not convert country codes: {e}")
                    
            return geo_data
        except Exception as e:
            logger.error(f"Error in geographic info extraction: {e}")
            return {"error": str(e)}
    
    def summarize_text(self, text: str, max_length: int = 150) -> str:
        """
        Generate a concise summary of the text.
        
        Args:
            text: Text to summarize
            max_length: Maximum length of the summary
            
        Returns:
            Summarized text
        """
        try:
            if self.summarizer is None or len(text) < 100:
                # For short texts or if summarizer is not available, use a simple approach
                doc = self.nlp(text)
                sentences = list(doc.sents)
                if sentences:
                    return sentences[0].text  # Return first sentence as summary
                return text[:max_length] + "..." if len(text) > max_length else text
            
            # Use transformer-based summarization for longer texts
            summary = self.summarizer(
                text, 
                max_length=max_length, 
                min_length=30, 
                do_sample=False
            )
            return summary[0]['summary_text']
        except Exception as e:
            logger.error(f"Error in text summarization: {e}")
            return text[:max_length] + "..." if len(text) > max_length else text
    
    def analyze_bias(self, text: str, source: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze potential bias in the text.
        
        Args:
            text: Text to analyze
            source: Source of the content (optional)
            
        Returns:
            Dictionary with bias analysis results
        """
        try:
            # Create a simple bias analysis based on sentiment and linguistic markers
            doc = self.nlp(text)
            
            # Get sentiment as a basis
            sentiment = self.get_sentiment(text)
            
            # Look for emotional/subjective language markers
            subjective_markers = [
                token.text for token in doc 
                if token.pos_ in ["ADJ", "ADV"] and token.is_stop == False
            ]
            
            # Examine use of modal verbs (might, could, should)
            modal_verbs = [token.text for token in doc if token.tag_ == "MD"]
            
            # Check for extreme language
            extreme_words = [
                token.text for token in doc 
                if token.text.lower() in ["very", "extremely", "totally", "absolutely", 
                                         "never", "always", "all", "none", "every", 
                                         "certainly", "undoubtedly", "clearly"]
            ]
            
            # Simple source bias rating (placeholder - would need a real database)
            source_bias = {
                "score": 0.5,  # Neutral by default
                "confidence": 0.0  # Zero confidence if no source provided
            }
            
            if source:
                # Placeholder for source bias database lookup
                # In a real implementation, this would check against a database of known sources
                source_bias["confidence"] = 0.7  # Higher confidence if source is provided
            
            # Calculate overall bias metrics
            emotionality = min(1.0, len(subjective_markers) / max(len(doc) * 0.1, 1))
            uncertainty = min(1.0, len(modal_verbs) / max(len(doc) * 0.05, 1))
            extremism = min(1.0, len(extreme_words) / max(len(doc) * 0.05, 1))
            
            # Calculate overall bias score (0 = neutral, 1 = highly biased)
            overall_bias = (
                abs(sentiment["compound"]) * 0.3 +  # Sentiment intensity
                emotionality * 0.3 +                # Emotional language
                extremism * 0.4                     # Extreme language
            )
            
            return {
                "bias_score": overall_bias,
                "emotional_language": {
                    "score": emotionality,
                    "markers": subjective_markers[:10]  # List first 10 markers only
                },
                "uncertainty": {
                    "score": uncertainty,
                    "markers": modal_verbs
                },
                "extreme_language": {
                    "score": extremism,
                    "markers": extreme_words
                },
                "source_bias": source_bias
            }
        except Exception as e:
            logger.error(f"Error in bias analysis: {e}")
            return {"error": str(e)}
            
    def extract_top_words(self, text: str, top_n: int = 15) -> Dict[str, int]:
        """
        Extract the most frequent words from the text.
        
        Args:
            text: Text to analyze
            top_n: Number of top words to return
            
        Returns:
            Dictionary of top words and their frequencies
        """
        try:
            # Tokenize and normalize text
            doc = self.nlp(text.lower())
            
            # Extract tokens, filter out stopwords, punctuation, and numbers
            words = [
                token.lemma_ for token in doc 
                if not token.is_stop 
                and not token.is_punct 
                and not token.is_digit
                and len(token.text) > 2
                and token.lemma_ not in self.stopwords
            ]
            
            # Count frequencies
            word_counts = Counter(words)
            
            # Return top N words
            return dict(word_counts.most_common(top_n))
            
        except Exception as e:
            logger.error(f"Error extracting top words: {e}")
            return {"error": str(e)}
    
    def extract_top_phrases(self, text: str, top_n: int = 10) -> Dict[str, int]:
        """
        Extract the most significant phrases (bigrams and trigrams) from the text.
        
        Args:
            text: Text to analyze
            top_n: Number of top phrases to return
            
        Returns:
            Dictionary of top phrases and their scores
        """
        try:
            # Tokenize the text
            words = [w.lower() for w in word_tokenize(text) if w.isalnum()]
            
            # Filter stopwords
            filtered_words = [word for word in words if word not in self.stopwords]
            
            # Generate bigrams and trigrams
            bigram_finder = BigramCollocationFinder.from_words(filtered_words)
            trigram_finder = TrigramCollocationFinder.from_words(filtered_words)
            
            # Apply frequency filter
            bigram_finder.apply_freq_filter(2)
            trigram_finder.apply_freq_filter(2)
            
            # Score bigrams and trigrams using PMI
            bigram_scores = bigram_finder.score_ngrams(BigramAssocMeasures.pmi)
            trigram_scores = trigram_finder.score_ngrams(TrigramAssocMeasures.pmi)
            
            # Combine scores, format into phrases
            phrases = {}
            
            # Add bigrams
            for bigram, score in bigram_scores[:top_n]:
                phrase = ' '.join(bigram)
                phrases[phrase] = int(score * 100)  # Convert to integer for simpler representation
            
            # Add trigrams
            for trigram, score in trigram_scores[:top_n // 2]:  # Use fewer trigrams
                phrase = ' '.join(trigram)
                phrases[phrase] = int(score * 100)
                
            # Sort by score and take top_n
            sorted_phrases = dict(sorted(phrases.items(), key=lambda x: x[1], reverse=True)[:top_n])
            
            return sorted_phrases
            
        except Exception as e:
            logger.error(f"Error extracting top phrases: {e}")
            return {"error": str(e)}
    
    def assess_credibility(self, text: str, source: Optional[str] = None, 
                          entities: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """
        Assess the credibility of the news article.
        
        Args:
            text: Text to analyze
            source: Source of the article
            entities: Extracted entities (optional, to avoid recomputation)
            
        Returns:
            Dictionary with credibility analysis results
        """
        try:
            credibility_factors = {}
            
            # 1. Source reputation (if available)
            source_score = 0.5  # Default neutral score
            if source:
                # Normalize source name for lookup
                normalized_source = re.sub(r'[^a-zA-Z]', '', source.lower())
                for known_source in self.source_credibility:
                    if known_source in normalized_source:
                        source_score = self.source_credibility[known_source]
                        break
                if source_score == 0.5 and normalized_source:  # Still using default
                    source_score = self.source_credibility['default']
            
            credibility_factors["source_reputation"] = source_score
            
            # 2. Named entities density
            if not entities:
                entities = self.extract_entities(text)
            
            entity_density = min(1.0, len(entities) / (len(text.split()) * 0.05))
            credibility_factors["entity_richness"] = entity_density
            
            # 3. Factual language assessment
            doc = self.nlp(text)
            
            # Analyze attribution phrases (said, according to, etc.)
            attribution_phrases = [
                i for i, token in enumerate(doc) 
                if token.lemma_ in ['say', 'state', 'report', 'claim', 'according', 'confirm']
            ]
            attribution_score = min(1.0, len(attribution_phrases) * 0.1)
            credibility_factors["attribution"] = attribution_score
            
            # 4. Quotes and evidence
            quotes = re.findall(r'"([^"]*)"', text) + re.findall(r"'([^']*)'", text)
            quotes_score = min(1.0, len(quotes) * 0.15)
            credibility_factors["quotes_evidence"] = quotes_score
            
            # 5. Data and numbers presence
            numbers = [token.text for token in doc if token.like_num]
            numbers_score = min(1.0, len(numbers) * 0.05)
            credibility_factors["data_presence"] = numbers_score
            
            # 6. Balance of viewpoints
            # This is a simplified proxy - in reality would need more sophisticated analysis
            sentences = list(doc.sents)
            viewpoint_score = 0.7  # Default somewhat balanced
            credibility_factors["viewpoint_balance"] = viewpoint_score
            
            # Calculate overall credibility score (weighted average)
            weights = {
                "source_reputation": 0.3,
                "entity_richness": 0.15,
                "attribution": 0.2,
                "quotes_evidence": 0.15,
                "data_presence": 0.1,
                "viewpoint_balance": 0.1
            }
            
            overall_score = sum(credibility_factors[factor] * weights[factor] 
                              for factor in credibility_factors)
            
            return {
                "score": overall_score,
                "factors": credibility_factors
            }
            
        except Exception as e:
            logger.error(f"Error in credibility assessment: {e}")
            return {
                "score": 0.5,
                "factors": {"error": str(e)}
            } 