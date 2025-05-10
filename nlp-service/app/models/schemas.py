from pydantic import BaseModel, Field, AnyUrl
from typing import Dict, List, Optional, Any, Union


class TextRequest(BaseModel):
    """Request schema for text analysis."""
    text: Optional[str] = Field(None, description="The text to analyze")
    content: Optional[str] = Field(None, description="Alternative field for text content")
    title: Optional[str] = Field(None, description="Optional title of the content")
    source: Optional[str] = Field(None, description="Source of the content (e.g., publication name)")
    siteName: Optional[str] = Field(None, description="Alternative field for source")
    url: Optional[str] = Field(None, description="URL where the content was found")
    date: Optional[str] = Field(None, description="Publication date")
    author: Optional[str] = Field(None, description="Author of the content")
    language: Optional[str] = Field("en", description="Language code (ISO 639-1)")


class Entity(BaseModel):
    """Named entity extracted from text."""
    text: str = Field(..., description="The entity text")
    type: str = Field(..., description="Entity type (e.g., PERSON, ORG, GPE)")
    start_char: int = Field(..., description="Start character position in text")
    end_char: int = Field(..., description="End character position in text")
    context: str = Field("", description="Sentence context containing the entity")


class GeoInfo(BaseModel):
    """Geographic information extracted from text."""
    mentioned_locations: List[str] = Field([], description="All location names mentioned in text")
    coordinates: Dict[str, Dict[str, float]] = Field({}, description="Location coordinates where available")
    countries: List[str] = Field([], description="Countries mentioned in text")
    country_codes: Optional[Dict[str, str]] = Field(None, description="ISO country codes")


class BiasAnalysis(BaseModel):
    """Bias analysis results."""
    bias_score: float = Field(..., description="Overall bias score (0-1)")
    emotional_language: Dict[str, Any] = Field(..., description="Emotional language analysis")
    uncertainty: Dict[str, Any] = Field(..., description="Analysis of uncertainty markers")
    extreme_language: Dict[str, Any] = Field(..., description="Analysis of extreme language")
    source_bias: Dict[str, Any] = Field(..., description="Source-specific bias information")


class SentimentResult(BaseModel):
    """Sentiment analysis results."""
    positive: float = Field(..., description="Positive sentiment score (0-1)")
    negative: float = Field(..., description="Negative sentiment score (0-1)")
    neutral: float = Field(..., description="Neutral sentiment score (0-1)")
    compound: float = Field(..., description="Compound sentiment score (-1 to 1)")


class CredibilityResult(BaseModel):
    """Credibility assessment results."""
    score: float = Field(..., description="Overall credibility score (0-1)")
    factors: Dict[str, float] = Field(..., description="Individual credibility factors")


class AnalysisResponse(BaseModel):
    """Complete text analysis response."""
    sentiment: Union[SentimentResult, Dict[str, str]] = Field(..., description="Sentiment analysis results")
    entities: List[Union[Entity, Dict[str, str]]] = Field(..., description="Named entities found in text")
    classification: Dict[str, float] = Field(..., description="Topic classification scores")
    geographic_info: Optional[Union[GeoInfo, Dict[str, str]]] = Field(None, description="Geographic information")
    summary: Optional[str] = Field(None, description="Text summary")
    bias_analysis: Optional[Union[BiasAnalysis, Dict[str, str]]] = Field(None, description="Bias analysis results")
    topWords: Optional[Dict[str, int]] = Field(None, description="Most frequent relevant words")
    topPhrases: Optional[Dict[str, int]] = Field(None, description="Most significant phrases")
    credibility: Optional[Union[CredibilityResult, Dict[str, Any]]] = Field(None, description="Credibility assessment") 