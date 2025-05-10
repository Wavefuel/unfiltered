#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Download required models
python -m spacy download en_core_web_md
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('vader_lexicon')"

# Run the server
python main.py 