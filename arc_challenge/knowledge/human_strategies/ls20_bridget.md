# ls20 Human Strategy — Bridget (Grounded Feb 28)

**Reference image:** `../reference_images/ls20_annotated_bridget.jpg`

## Visual Grounding (from annotated screenshot)

| Element | Visual Description | Location |
|---------|-------------------|----------|
| **Player token** | Composite block (orange top + blue bottom) | Movable in maze |
| **Player state indicator** | Shows current form (e.g., blue L-shape) | Bottom-left HUD |
| **Goal** | Pattern in dark square (e.g., blue L-shape) | Fixed location in maze |
| **Plus Sign** | White cross shape | Fixed location in maze |
| **Power-up token** | Yellow square with dark center | Collectible in maze |

## Core Mechanics

### Plus Sign = Transformation Trigger
- **Each hover over plus sign changes your appearance**
- Hover multiple times = multiple transformations
- Keep hovering until your state indicator MATCHES the goal pattern

### Completion Condition
1. Transform (hover plus sign) until state matches goal
2. Navigate player token to the goal square
3. Overlap = level complete

### Human Intuition
"When you see two things that match, you want to bring them close together."

## Goal Representation

**Wrong approach:** reach coordinates (x, y)
**Right approach:** 
1. Transform until `player_state == goal_pattern`
2. Then `player_position == goal_position`

Goals are RELATIONAL, not just positional.

## Game Structure
- 7 levels total (Level 2/7 shown in screenshot)
- Arrow keys for movement
- Space bar for action
- Undo (Z) available
- Progress bar shows moves used (yellow = used, red = remaining budget?)

## Detection Strategy for AI

To detect entities:
1. **Player token**: Find composite colored block that moves between frames
2. **State indicator**: Bottom-left corner, isolated pattern display
3. **Goal**: Dark square containing a pattern, static
4. **Plus sign**: White cross pattern, static
5. **Power-ups**: Yellow squares with dark centers

To detect matching:
- Compare state indicator pattern to goal pattern
- Pixel-level or pattern hash comparison

To detect completion:
- Player token overlaps goal position
- State already matches (prerequisite)
