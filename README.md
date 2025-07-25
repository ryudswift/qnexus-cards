# Nexus Cards - MVP v1.11 (Enhanced)

A gamified learning platform that turns knowledge into collectible Nexus Cards. This version reads actual card files from the directory structure to populate the library.

## Features (v1.11)

- View a library of Nexus Cards organized by Category.
- Cards display a 3D tilt hover effect.
- Detailed modal view with a flip animation to show card "Intel".
- A 3-level mastery system for cards (Level 1: Discovered, Level 2: In Progress, Level 3: Mastered).
- Interactive quizzes to level up cards from Level 1 to 2, and Level 2 to 3.
- Dynamic action buttons on the card modal based on the card's current level.
- Track Player Level (Dual-Level Display), Total Cards, Cards Mastered, and Mastery Rate.
- Deep space nebula themed UI with level-based card styling.

## Tech Stack

- HTML5
- CSS (Tailwind via CDN + custom `style.css`)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

## How to Add New Cards

1. Create a new JSON file in one of the category directories under `/cards` (e.g., `/cards/wealth/`)
2. Use the template in `/cards/card-template.md` as a reference for the JSON structure
3. Follow the naming convention: `[CATEGORY_PREFIX]-XXX-Title.json` (e.g., `[WI]-018-New_Wealth_Tactic.json`)
4. Commit and push to GitHub
5. Click "Sync Library" in the app to load the new cards

## Project Structure

```
/cards
  ├── health/
  ├── relationships/
  ├── wealth/
  │   └── [WI]-017-Significant_Income_through_Clipping.json (sample card)
  ├── card-template.md (template for new cards)
  └── readme-cards.md
```

## Naming Convention for Card Files

- Wealth cards: `[WI]-XXX-Title.json` (e.g., `[WI]-018-Income_Strategies.json`)
- Health cards: `[HI]-XXX-Title.json` (e.g., `[HI]-005-Exercise_Routine.json`)
- Relationships cards: `[RI]-XXX-Title.json` (e.g., `[RI]-022-Communication_Tips.json`)

Where XXX is a three-digit number with leading zeros.
