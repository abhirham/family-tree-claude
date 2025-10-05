# Family Tree Project Context

## Overview

A modern family tree application built with Next.js 15, React 19, and Firebase Firestore. Features an Airbnb-inspired design with comprehensive family relationship management, search/navigation capabilities, and intuitive UI.

## Tech Stack

- **Frontend**: Next.js 15 with Turbopack, React 19
- **Styling**: Tailwind CSS 4, Airbnb design tokens
- **Database**: Firebase Firestore
- **Key Features**: Family tree visualization, relationship mapping, search, navigation history

## Core Components

### FamilyTree.js (Main Component)

- Handles member relationships (parents, children, spouses, siblings, step-children)
- Supports path finding between family members
- Navigation stack for browsing history
- Progressive search UI (person selection → path finding)

### PersonCard.js

- Card component with hero mode for featured display
- Relationship badges with color coding
- Placeholder images with consistent defaults
- Birth/death date formatting, connection indicators

### AutoComplete.js

- Advanced autocomplete with keyboard navigation
- Custom option rendering, filtering
- Clearable input with visual feedback
- Used for family member search and selection.

## Data Model

### Family Member Structure

```javascript
{
  id: string,
  name: string,
  gender: 'male' | 'female',
  birthDate: Timestamp,
  deathDate: Timestamp,
  imageUrl: string,
  notes: string,
  parentIds: string[], // Array of parent IDs
  spouseId: string,
  root: boolean, // Root family member flag
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Relationship Logic

- **Dummy Parent IDs**: Used for sibling grouping (`dummy_parent_${timestamp}_${random}`)
- **Root Members**: Display initially, marked with `root: true`
- **Parent-Child**: Uses `parentIds` array, supports multiple parents
- **Spouse**: Bidirectional `spouseId` relationship
- **Siblings**: Share same `parentIds` or dummy parent ID

## Key Features

### Search & Navigation

- Autocomplete search with person selection
- Progressive path finding between two family members
- Navigation history stack with breadcrumbs
- Reset functionality to clear search state

### Relationship Management

- Complex relationship logic in `addFamilyMemberWithRelationships()`
- Automatic spouse-to-parent conversion when needed
- Children inherit both parents when spouse is added
- Root status management for family hierarchy

### UI Design System

- **Colors**: Airbnb Rausch (`#FF385C`), Airbnb Babu (`#00A699`)
- **Shadows**: `shadow-airbnb`, `shadow-airbnb-hover`
- **Transitions**: `transition-airbnb` (0.2s ease-out)

## File Structure

```
src/
├── app/
│   ├── page.js          # Main page with header, modal management
│   └── globals.css      # Tailwind config, Airbnb design tokens
├── components/
│   ├── FamilyTree.js    # Main tree component with navigation
│   ├── PersonCard.js    # Individual member cards
│   ├── AutoComplete.js  # Search autocomplete component
│   ├── RelationshipSection.js # Relationship grouping display
│   ├── AddFamilyMemberForm.js # Form for adding members
│   └── Modal.js         # Modal wrapper component
└── lib/
    ├── firestore.js     # Firebase database operations
    └── firebase.js      # Firebase configuration
```

## Key Behaviors

### Search Flow

1. User selects person from autocomplete
2. Tree navigates to selected person
3. Path finding option becomes available
4. User can find relationships between any two members

### Relationship Priority (Path Finding)

1. Children (highest priority)
2. Siblings
3. Parents (excluding dummy parents)
4. Spouses
5. Step-children

### Root Member Display

- Shows all members with `root: true` when no specific person selected
- Clean empty state with call-to-action

## UI Development Guidelines

**IMPORTANT**: When making ANY UI changes or creating new components, you MUST follow the established design patterns:

1. **Always reference**: `src/context/design-principles.md` for design philosophy and interaction patterns
2. **Always reference**: `src/context/style-guide.md` for visual styling, colors, typography, and component patterns
3. **Consistency is key**: Maintain the Airbnb-inspired aesthetic and established component patterns
4. **Test responsively**: Ensure changes work across mobile, tablet, and desktop layouts

These context files contain the essential design system that ensures UI consistency and quality.

### Quick Visual Check

IMMEDIATELY after implementing any front-end change:

1. **Identify what changed** – Review the modified components/pages
2. **Navigate to affected pages** – Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** – Compare against `/context/design-principles.md`
4. **Validate feature implementation** – Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** – Review any provided context files or requirements
6. **Capture evidence** – Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** – Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

## Development Commands

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Production build with Turbopack
- `npm start`: Start production server
