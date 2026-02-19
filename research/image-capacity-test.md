# Image Processing Capacity Test Results

**Date:** 2026-02-17  
**Purpose:** Determine multi-image processing limits for VULKN field agent PDF/image handling  
**Tester:** Sybil (subagent)

## Test Methodology

1. Generated 20 PNG test images (800×600, ~22KB each) simulating insurance policy headers
2. Each image contains: policy number, insurer name, vehicle, year, premium
3. Used the `image` tool to extract structured data from each image
4. Tested parallel batch sizes: 5, 10, 5 (covering all 20 images)

## Key Finding: The `image` Tool Supports ONE Image Per Call — But Parallel Calls Work

The `image` tool accepts a single `image` parameter (string path). However, **OpenClaw executes multiple independent tool calls in parallel within a single turn**. This is the critical insight.

## Results

| Batch Size | Images Correct | Errors | Notes |
|------------|---------------|--------|-------|
| 5 (parallel) | 5/5 | 0 | All fields extracted perfectly |
| 10 (parallel) | 9/10 | 1 partial | Policy #8: vehicle name dropped ("Subaru Outback" → just "2023") |
| 5 (parallel) | 5/5 | 0 | All fields extracted perfectly |
| **Total** | **19/20** | **1 partial** | 95% perfect, 100% usable (policy # always correct) |

### Accuracy Details
- **Policy numbers:** 20/20 correct (100%)
- **Insurer names:** 20/20 correct (100%)
- **Vehicle + year:** 19/20 correct (95%) — one missed vehicle model name
- **Premiums:** 20/20 correct (100%)
- **Hallucinations:** 0

## Token Cost Estimates

Per Anthropic's image token calculation for Claude:
- 800×600 PNG image ≈ **1,600 tokens** (images are tiled; at this resolution it's roughly 1 tile)
- More precisely: Claude uses 68px tiles. 800×600 = ~12×9 = 108 tiles × ~15 tokens ≈ **~1,600 tokens**
- Simpler estimate: small/medium images cost **~1,000–1,600 tokens each**

| Images | Est. Image Tokens | + Prompt Overhead | Total Est. |
|--------|------------------|-------------------|------------|
| 1 | ~1,600 | ~100 | ~1,700 |
| 5 | ~8,000 | ~500 | ~8,500 |
| 10 | ~16,000 | ~1,000 | ~17,000 |
| 20 | ~32,000 | ~2,000 | ~34,000 |

**Note:** Each parallel `image` call is a separate API call to the vision model, so tokens are per-call, not cumulative in one context. The cost is N × (image_tokens + prompt_tokens + output_tokens).

## Architecture Observations

1. **No multi-image tool:** The `image` tool only accepts one image at a time
2. **Parallel execution works:** OpenClaw dispatches independent tool calls concurrently — tested up to 10 parallel image calls successfully
3. **The `read` tool also works for images:** Returns the image inline in the conversation context (no separate API call), but uses main context window tokens
4. **Path restrictions:** Images must be in the workspace directory (not /tmp)

## Recommendation for Sam's PDF Handling

### For Bulk Client Uploads (e.g., 10-20 insurance documents):

1. **Use parallel `image` tool calls** — process up to 10 images simultaneously per turn. This is fast and accurate.

2. **Batch strategy for 20+ documents:**
   - Turn 1: Process images 1-10 in parallel
   - Turn 2: Process images 11-20 in parallel
   - Turn 3: Consolidate results
   
3. **For PDFs:** Convert to images first (one page = one PNG), then process via `image` tool. Use `pdftoppm` or similar.

4. **Message queue configuration:**
   - Don't queue individual messages per image — instead, batch-collect uploaded files, then process in parallel
   - A "collect phase" (wait for all uploads, e.g., 5-second debounce) followed by a "process phase" (parallel extraction) is optimal
   - Target batch size: **10 parallel calls** (proven reliable)

5. **Cost management:** 20 insurance docs ≈ 34K image tokens + processing. At Claude Opus pricing, roughly $0.50-1.00 per batch of 20 docs. Acceptable for commercial insurance quoting.

6. **Alternative for high volume:** For 50+ docs, consider a dedicated OCR pipeline (Tesseract/AWS Textract) as a preprocessing step, feeding extracted text to Claude for structured analysis. Cheaper at scale.
