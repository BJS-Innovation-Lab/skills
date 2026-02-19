# Google Colab Live Demo: AI-Powered Art Analysis
# Copy and paste this into a Google Colab cell.

import requests
import json
import pandas as pd

# 1. SETUP: Harvard Art Museums API Key
# Note: In class, you can provide a temporary key or have students use theirs.
API_KEY = "YOUR_API_KEY_HERE"
BASE_URL = "https://api.harvardartmuseums.org/object"

def fetch_museum_data(query, count=50):
    """
    Simulates the 'Classic' API Request.
    """
    params = {
        "apikey": API_KEY,
        "q": query,
        "size": count,
        "sort": "rank",
        "fields": "title,dated,medium,culture"
    }
    
    print(f"📡 Requesting: {BASE_URL}?q={query}&size={count}...")
    response = requests.get(BASE_URL, params=params)
    return response.json()

# --- THE MODERN DEMO WORKFLOW ---

# STEP A: THE DATA PULL
# Imagine we are researching the 'Industrial Revolution'
data = fetch_museum_data("industry")

# STEP B: THE AI'S ANALYSIS PROMPT
# You would copy-paste this raw 'data' object into Claude/ChatGPT and ask:
# "Write a Python script to analyze this JSON. Find the most common cultures 
# mentioned and list the objects that are more than 100 years old."

# STEP C: THE VERIFIED EXECUTION (What the AI does internally)
# This is the 'Level 3' proof that the AI isn't hallucinating.
def ai_verification_script(raw_data):
    df = pd.DataFrame(raw_data['records'])
    
    # 1. Count Materials
    material_counts = df['medium'].value_counts().head(5)
    
    # 2. Count Cultures
    culture_counts = df['culture'].value_counts().head(5)
    
    print("\n✅ AI VERIFICATION COMPLETE:")
    print("-" * 30)
    print("TOP 5 MATERIALS FOUND:")
    print(material_counts)
    print("\nTOP 5 CULTURES FOUND:")
    print(culture_counts)

# RUN THE DEMO
ai_verification_script(data)
