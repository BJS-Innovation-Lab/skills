# ARC-AGI-3 Stage: ls20 (Robotics) - WINNING PROCESS

## Status
- **Level 1:** COMPLETED (2026-03-01)
- **Level 2:** RESEARCH PHASE
- **Methodology:** Verified 🔬

## Physical Laws of ls20
1.  **Non-Linear Movement:** The player token (mgu) moves in fixed "jumps" rather than single cells.
    - **Horizontal (X):** 5 pixels per action.
    - **Vertical (Y):** 6 pixels per action.
2.  **The Non-Perfect Grid (Overshoot Risk):** Because jumps are fixed (5/6), many target coordinates on a 50x50 grid *cannot* be hit exactly.
3.  **Proximity-Based Collection:** The game registers a "touch" if the player is within ~2.5 pixels of the target center.
4.  **Win Condition (Shape-Masking):** Matching is based on geometric SHAPE (binary masks), not pixel color values.
    - Match Threshold: >0.95 similarity between state indicator (bottom-left) and goal pattern.

## Strategy: The "Strategic Director" Model
1.  **Sandbox Simulation:** Before moving, spawn a sub-agent to simulate the 5/6 jump math and identify the "Closest Approach" point to avoid overshooting.
2.  **State-Binding:** Bind shapes to behaviors (e.g., `[WHITE_CROSS] -> [TRANSFORM_RULE]`) in the Knowledge Graph.
3.  **Recursive Verification:** Check state indicator similarity *after every move* that lands near a transformation point.

## Level 1 Solution Sequence
`RIGHT → RIGHT → DOWN → DOWN → [TRANSFORM] → RIGHT → RIGHT → RIGHT → DOWN → DOWN → DOWN → [WIN]`

---
*Documented by Sybil on March 1, 2026, after successful Level 1 clearance.*
