import os
import csv
import json
import requests
import time
from typing import List, Dict

# Configuration
BACKEND_URL = "http://localhost:8000/analyze/video"  # Adjust if Sage's main entry point differs
DATASET_DIR = "truth-hire-datasets/benchmarks/real-life-2016"
ANNOTATION_FILE = "truth-hire-datasets/raw/Real-life_Deception_Detection_2016/Annotation/All_Gestures_Deceptive and Truthful.csv"
REPORT_FILE = "benchmark_results.md"

def run_benchmark():
    results = []
    
    if not os.path.exists(ANNOTATION_FILE):
        print(f"Error: Annotation file not found at {ANNOTATION_FILE}")
        return

    with open(ANNOTATION_FILE, mode='r') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            clip_id = row['id']
            ground_truth = row['class'] # 'deceptive' or 'truthful'
            
            # Determine local path
            subfolder = "deceptive" if ground_truth == "deceptive" else "truthful"
            video_path = f"{DATASET_DIR}/clips/{subfolder}/{clip_id}"
            
            if not os.path.exists(video_path):
                # Try .mp4 if extension is missing or needs matching
                video_path = video_path.replace(".mp4", "") + ".mp4"
                if not os.path.exists(video_path):
                    print(f"Skipping {clip_id}: File not found.")
                    continue

            print(f"🧪 Testing {clip_id} (Label: {ground_truth})...")
            
            try:
                # REAL RUN: Call the facial analysis service
                # We sample at a high rate for benchmarking (every 2 frames)
                url = "http://localhost:8001/analyze/video?sample_rate=2"
                with open(video_path, "rb") as f:
                    response = requests.post(url, files={"file": f})
                
                data = response.json()
                
                if data.get("success"):
                    # Extract deception scores from each analyzed frame
                    frame_scores = [f["data"].get("deception_score", 0.0) for f in data.get("frame_results", [])]
                    
                    # Calculate mean deception score for the clip
                    engine_deception_score = sum(frame_scores) / len(frame_scores) if frame_scores else 0.0
                else:
                    engine_deception_score = 0.0
                    print(f"⚠️ Service error on {clip_id}: {data.get('error')}")
                
                prediction = "deceptive" if engine_deception_score > 0.4 else "truthful" # Lower threshold for first pass
                is_correct = (prediction == ground_truth)
                
                results.append({
                    "id": clip_id,
                    "ground_truth": ground_truth,
                    "engine_score": engine_deception_score,
                    "prediction": prediction,
                    "is_correct": is_correct,
                    "path": video_path
                })
            except Exception as e:
                print(f"Error processing {clip_id}: {e}")

    generate_report(results)

def generate_report(results: List[Dict]):
    with open(REPORT_FILE, "w") as f:
        f.write("# Truth Hire Benchmark Report\n\n")
        f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        correct = sum(1 for r in results if r['is_correct'])
        total = len(results)
        accuracy = (correct / total) * 100 if total > 0 else 0
        
        f.write(f"## Summary\n")
        f.write(f"- **Total Clips Analyzed:** {total}\n")
        f.write(f"- **Accuracy:** {accuracy:.2f}%\n\n")
        
        f.write("## Detailed Results\n")
        f.write("| Clip ID | Ground Truth | Engine Score | Prediction | Status | Link |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        
        for r in results:
            status = "✅" if r['is_correct'] else "❌ **FAIL**"
            # We provide a local file link for easy review on the host
            file_link = f"[View Clip]({os.path.abspath(r['path'])})"
            f.write(f"| {r['id']} | {r['ground_truth']} | {r['engine_score']:.2f} | {r['prediction']} | {status} | {file_link} |\n")

    print(f"✅ Benchmark complete! Report saved to {REPORT_FILE}")

if __name__ == "__main__":
    run_benchmark()
