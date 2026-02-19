import os
import time
from typing import List, Dict

# Configuration
DATASET_DIR = "truth-hire-datasets/benchmarks/cross-cultural-2014"
LANGUAGES = ["SpanishMexico", "EnglishUS", "EnglishIndia", "Romanian"]
REPORT_FILE = "benchmark_cross_cultural_results.md"

def run_cross_cultural_benchmark():
    results = []
    
    for lang in LANGUAGES:
        lang_path = os.path.join(DATASET_DIR, lang)
        if not os.path.exists(lang_path):
            print(f"Skipping {lang}: Directory not found.")
            continue
            
        # Topics: ab (Abortion), bf (Best Friend), dp (Death Penalty)
        for topic in ["ab", "bf", "dp"]:
            topic_path = os.path.join(lang_path, topic)
            if not os.path.exists(topic_path):
                continue
                
            for filename in os.listdir(topic_path):
                file_path = os.path.join(topic_path, filename)
                
                # Ground Truth extracted from filename extension
                # .True = Truthful, .False = Deceptive
                if filename.endswith(".True"):
                    ground_truth = "truthful"
                elif filename.endswith(".False"):
                    ground_truth = "deceptive"
                else:
                    continue

                print(f"🧪 Testing [{lang}] {filename}...")
                
                # Simulation placeholder for the text-analysis logic
                # This will eventually call our Claude-based follow-up/text engine
                engine_deception_score = 0.0 
                prediction = "deceptive" if engine_deception_score > 0.5 else "truthful"
                is_correct = (prediction == ground_truth)
                
                results.append({
                    "language": lang,
                    "topic": topic,
                    "filename": filename,
                    "ground_truth": ground_truth,
                    "engine_score": engine_deception_score,
                    "prediction": prediction,
                    "is_correct": is_correct,
                    "path": file_path
                })

    generate_report(results)

def generate_report(results: List[Dict]):
    with open(REPORT_FILE, "w") as f:
        f.write("# Truth Hire Benchmark Report: Cross-Cultural 2014\n\n")
        f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        # Stats by Language
        f.write("## Accuracy by Language\n")
        f.write("| Language | Correct | Total | Accuracy |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        
        for lang in LANGUAGES:
            lang_res = [r for r in results if r['language'] == lang]
            total = len(lang_res)
            correct = sum(1 for r in lang_res if r['is_correct'])
            accuracy = (correct / total) * 100 if total > 0 else 0
            f.write(f"| {lang} | {correct} | {total} | {accuracy:.2f}% |\n")
        
        f.write("\n## Detailed Failure Log (For Engine Tuning)\n")
        f.write("| Language | Topic | Filename | Ground Truth | Prediction | Link |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        
        for r in results:
            if not r['is_correct']:
                file_link = f"[View Text]({os.path.abspath(r['path'])})"
                f.write(f"| {r['language']} | {r['topic']} | {r['filename']} | {r['ground_truth']} | {r['prediction']} | {file_link} |\n")

    print(f"✅ Cross-Cultural Benchmark script ready! Report will be saved to {REPORT_FILE}")

if __name__ == "__main__":
    run_cross_cultural_benchmark()
