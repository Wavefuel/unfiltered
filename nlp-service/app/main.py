from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

from app.services.nlp_service import NLPService

app = FastAPI(
    title="NLP Microservice API",
    description="NLP service for text analysis including sentiment, NER, classification, and bias detection",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NLP service
nlp_service = NLPService()

class TextRequest(BaseModel):
    text: Optional[str] = None
    content: Optional[str] = None  # Added for news aggregator format
    title: Optional[str] = None
    source: Optional[str] = None
    siteName: Optional[str] = None  # Added for news aggregator format
    url: Optional[str] = None
    date: Optional[str] = None  # Added for news aggregator format
    author: Optional[str] = None  # Added for news aggregator format
    language: Optional[str] = "en"

class CredibilityResult(BaseModel):
    score: float
    factors: Dict[str, Any]

class AnalysisResponse(BaseModel):
    sentiment: Dict[str, float]
    entities: List[Dict[str, Any]]
    classification: Dict[str, float]
    geographic_info: Optional[Dict[str, Any]]
    summary: Optional[str]
    bias_analysis: Optional[Dict[str, Any]]
    topWords: Optional[Dict[str, int]] = None
    topPhrases: Optional[Dict[str, int]] = None
    credibility: Optional[CredibilityResult] = None

@app.get("/")
async def root():
    return {"message": "NLP Microservice is running. Access /docs for API documentation."}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: TextRequest):
    try:
        # Use content field if text is not provided
        text_content = request.text if request.text else request.content
        source_name = request.source if request.source else request.siteName
        
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        result = nlp_service.analyze_text(
            text=text_content,
            title=request.title,
            source=source_name,
            url=request.url,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@app.post("/sentiment")
async def analyze_sentiment(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        sentiment = nlp_service.get_sentiment(text_content)
        return {"sentiment": sentiment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@app.post("/entities")
async def extract_entities(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        entities = nlp_service.extract_entities(text_content)
        return {"entities": entities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting entities: {str(e)}")

@app.post("/classify")
async def classify_text(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        classification = nlp_service.classify_text(text_content)
        return {"classification": classification}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error classifying text: {str(e)}")

@app.post("/geographic")
async def extract_geographic_info(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        geo_info = nlp_service.extract_geographic_info(text_content)
        return {"geographic_info": geo_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting geographic info: {str(e)}")

@app.post("/summarize")
async def summarize_text(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        summary = nlp_service.summarize_text(text_content)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing text: {str(e)}")

@app.post("/bias")
async def analyze_bias(request: TextRequest):
    try:
        text_content = request.text if request.text else request.content
        source_name = request.source if request.source else request.siteName
        
        if not text_content:
            raise HTTPException(status_code=422, detail="Either 'text' or 'content' field is required")
            
        bias = nlp_service.analyze_bias(text_content, source_name)
        return {"bias_analysis": bias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing bias: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 