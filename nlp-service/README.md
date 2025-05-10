# NLP Microservice

A FastAPI-based microservice for natural language processing tasks including sentiment analysis, named entity recognition (NER), text classification, and geographic information extraction.

## Features

-   **Sentiment Analysis**: Determine the emotional tone of text
-   **Named Entity Recognition**: Extract people, organizations, locations, and other entities
-   **Text Classification**: Categorize content by topic and type
-   **Geographic Information**: Extract and geocode locations mentioned in text
-   **Summarization**: Generate concise summaries of longer texts
-   **Bias Analysis**: Detect potential bias markers in content

## Setup

### Prerequisites

-   Python 3.8+
-   Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nlp-service
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Download required models:

```bash
python -m spacy download en_core_web_md
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('vader_lexicon')"
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO
DEVICE=cpu
MAX_MODEL_LOAD=2
```

## Usage

### Running the service

Start the server:

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up -d
```

## API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:8000/docs
```

### Core Endpoints

-   `POST /analyze` - Complete text analysis
-   `POST /sentiment` - Sentiment analysis only
-   `POST /entities` - Named entity extraction
-   `POST /classify` - Text classification
-   `POST /geographic` - Geographic information extraction
-   `POST /summarize` - Text summarization
-   `POST /bias` - Bias analysis

## Integration with News Aggregator

To integrate with a news aggregation service:

1. When new articles are collected, send a POST request to `/analyze` with the article content
2. Process the response to extract relevant information
3. Store or display the analyzed data as needed

Example request:

```json
{
	"text": "Article content here...",
	"title": "Article title",
	"source": "Publication Name",
	"url": "https://example.com/article"
}
```

## License

[Your license information]
