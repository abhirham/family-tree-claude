# Style Guide - Family Tree Application

## Color System

### Primary Brand Colors

- **Airbnb Rausch**: `#FF385C` (`text-airbnb-rausch`, `bg-airbnb-rausch`)

  - Primary action color, selection states, hover states
  - Used for: buttons, links, selected states, primary accents

- **Airbnb Babu**: `#00A699` (`text-airbnb-babu`, `bg-airbnb-babu`)
  - Secondary action color, complementary elements
  - Used for: secondary buttons, path finding, teal accents

### Neutral Gray Scale

- **Gray 50**: `#F9F9F9` - Light backgrounds, subtle separators
- **Gray 100**: `#F7F7F7` - Card backgrounds, input backgrounds
- **Gray 200**: `#EBEBEB` - Borders, disabled states
- **Gray 300**: `#DDDDDD` - Dividers, inactive elements
- **Gray 400**: `#B0B0B0` - Placeholder text, icons
- **Gray 500**: `#717171` - Secondary text, captions
- **Gray 600**: `#484848` - Primary content text
- **Gray 700**: `#222222` - Headers, emphasized text
- **Gray 800**: `#1D1D1D` - High contrast text
- **Gray 900**: `#000000` - Maximum contrast text

### Semantic Colors

- **Error/Warning**: Red variants (`red-50`, `red-100`, `red-600`, `red-800`)
- **Success**: Green variants (`green-100`, `green-800`)
- **Info**: Blue variants (`blue-50`, `blue-100`, `blue-200`, `blue-600`)
- **Relationship Types**:
  - Pink (Spouse), Green (Child), Blue (Parent)
  - Purple (Sibling), Orange (Step-Child)

## Typography

### Font Stack

- **Sans Serif**: `system-ui, -apple-system, sans-serif`
- **Monospace**: `ui-monospace, monospace`

### Text Sizes & Weights

- **Hero Text**: `text-3xl font-semibold` (Main person display)
- **Page Headers**: `text-2xl font-semibold`
- **Section Headers**: `text-lg font-semibold`
- **Card Titles**: `text-lg font-semibold` with hover color transition
- **Body Text**: Default size, `text-gray-600` or `text-gray-700`
- **Captions**: `text-sm text-gray-600`
- **Meta Text**: `text-xs text-gray-500`
- **Badges**: `text-xs font-medium`

## Layout & Spacing

### Grid System

- **Desktop**: 4-column grid for person cards (`xl:grid-cols-4`)
- **Tablet**: 3-column grid (`lg:grid-cols-3`)
- **Mobile**: 2-column grid (`md:grid-cols-2`)
- **Small Mobile**: Single column (`grid-cols-1`)

### Containers & Margins

- **Page Padding**: `px-6 py-4` (header), `px-3` (main content)
- **Card Padding**: `p-4` (content), `p-6` (hero cards)
- **Section Spacing**: `space-y-8` (between major sections)
- **Element Spacing**: `mb-6` (major elements), `mb-3` (minor elements)

### Sidebar Layout

- **Width**: `w-72` (18rem)
- **Position**: Fixed left sidebar on desktop (`lg:ml-72`)
- **Hidden**: On mobile/tablet (`hidden lg:block`)
- **Height**: `calc(100vh - 74px)` (full height minus header)

## Components

### Cards

```css
/* Standard Card */
.card-standard {
  @apply bg-white shadow-airbnb hover:shadow-airbnb-hover 
         transition-airbnb cursor-pointer overflow-hidden 
         rounded-lg border border-gray-200;
}

/* Hero Card */
.card-hero {
  @apply bg-white shadow-airbnb rounded-lg overflow-hidden 
         mb-8 border border-gray-200;
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  @apply bg-airbnb-rausch text-white hover:bg-red-600 
         shadow-airbnb hover:shadow-airbnb-hover 
         px-4 py-2 rounded-lg font-medium transition-airbnb;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-airbnb-babu text-white hover:bg-teal-600 
         px-3 py-2 rounded-lg font-medium text-sm transition-airbnb;
}

/* Danger Button */
.btn-danger {
  @apply bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 
         px-3 py-1 rounded-full text-sm border border-red-200 
         transition-airbnb;
}
```

### Form Elements

```css
/* Input Fields */
.input-field {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg 
         shadow-sm focus:outline-none focus:ring-2 
         focus:ring-airbnb-rausch focus:border-airbnb-rausch 
         transition-airbnb bg-white;
}

/* Dropdown */
.dropdown {
  @apply absolute z-50 w-full mt-1 bg-white border 
         border-gray-300 rounded-lg shadow-airbnb max-h-60 
         overflow-y-auto;
}
```

### Badges & Tags

```css
/* Relationship Badges */
.badge-spouse {
  @apply bg-pink-100 text-pink-800 border-pink-200;
}
.badge-child {
  @apply bg-green-100 text-green-800 border-green-200;
}
.badge-parent {
  @apply bg-blue-100 text-blue-800 border-blue-200;
}
.badge-sibling {
  @apply bg-purple-100 text-purple-800 border-purple-200;
}
.badge-step-child {
  @apply bg-orange-100 text-orange-800 border-orange-200;
}

/* Status Badges */
.badge-root {
  @apply text-airbnb-rausch bg-red-50 px-2 py-1 rounded;
}
.badge-current {
  @apply text-blue-600 bg-blue-100 px-2 py-1 rounded-full;
}
```

## Visual Effects

### Shadows

- **Card Shadow**: `shadow-airbnb` - `0 2px 16px rgba(0, 0, 0, 0.08)`
- **Hover Shadow**: `shadow-airbnb-hover` - `0 6px 20px rgba(0, 0, 0, 0.15)`

### Transitions

- **Global**: `transition-airbnb` - `all 0.2s ease-out`
- **Hover States**: Color and shadow transitions
- **Interactive Elements**: Scale, opacity, color changes

### Gradients

- **Image Overlays**: `bg-gradient-to-t from-black/50 via-transparent to-transparent`
- **Card Overlays**: `bg-gradient-to-t from-black/30 via-transparent to-transparent`
- **Hover Effects**: `bg-airbnb-rausch/3 opacity-0 group-hover:opacity-100`

## Responsive Design

### Breakpoints

- **Mobile**: `< 768px` - Single column layout, no sidebar
- **Tablet**: `768px - 1024px` - Multi-column cards, no sidebar
- **Desktop**: `> 1024px` - Full layout with sidebar, 4-column grid

### Mobile Adaptations

- Hide navigation sidebar completely
- Adjust card grid to fit screen size
- Maintain touch-friendly button sizes (min 44px)
- Optimize text sizes for readability

## Accessibility

### Focus States

- Clear focus rings on interactive elements
- Keyboard navigation support in autocomplete
- Proper tab order through interface

### Color Contrast

- All text meets WCAG AA standards
- Interactive elements have sufficient contrast
- Error states clearly distinguishable

### Semantic HTML

- Proper heading hierarchy
- Meaningful alt text for images
- Form labels and accessibility attributes
