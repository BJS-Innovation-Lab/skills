### Deception Score Weighting & Future Testing

**Observation:** In initial testing (with different tools), linguistic analysis proved to be a stronger indicator for deception than facial and audio cues. This suggests that the weighting of these components in the final deception score needs careful calibration.

**Proposed Components and Initial Weighting for Testing:**
1.  **Facial Deception Score (0-1):**
    *   Based on Action Units (AU): AU04 (brow), AU12 (fake smile), AU14 (contempt), AU20 (fear)
2.  **Audio Stress Score (0-1):**
    *   Based on: Jitter > 0.02, Shimmer > 0.10, Micro-tremors in 8-12Hz range
3.  **Linguistic Analysis (0-1):**
    *   Based on: Speech rate changes, filler words, response latency

**Initial Proposed Final Score Formula:**
`Final Score = 0.35 * Facial Score + 0.35 * Audio Score + 0.30 * Linguistic Score`

**Action Item:** We need to conduct plenty of testing with benchmarks to get these weighting factors and component definitions right. This will involve iterating on the above formula and thresholds.