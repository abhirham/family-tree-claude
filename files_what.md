# Family Tree Project File Summary

Based on the codebase analysis, here's what each file does in the Family Tree project:

## Root Configuration Files

- **package.json** - Dependencies and scripts for the Next.js application
- **next.config.mjs** - Next.js configuration with Turbopack support
- **postcss.config.mjs** - PostCSS configuration for Tailwind CSS processing
- **jsconfig.json** - JavaScript project configuration with path aliases
- **CLAUDE.md** - Project documentation and development guidelines
- **README.md** - Project overview and setup instructions
- **FAMILY_TREE_TEST_PLAN.md** - Testing documentation and test cases

## Core App Files

- **src/app/page.js** - Main application page with header, authentication, search interface, and modal management
- **src/app/layout.js** - Root layout with font configuration, metadata, and context providers
- **src/app/globals.css** - Global CSS with Tailwind configuration and Airbnb design tokens

## Main Components

- **src/components/FamilyTree.js** - Central family tree component with navigation sidebar and member display logic
- **src/components/PersonCard.js** - Individual family member card with relationships, dates, and images
- **src/components/FamilyTreeCanvas.js** - Canvas-based hierarchical family tree visualization
- **src/components/HierarchicalTreeNode.js** - Tree node component for canvas visualization
- **src/components/TreeNodeCard.js** - Card component for tree nodes in canvas view

## Form & Modal Components

- **src/components/AddFamilyMemberForm.js** - Form for adding new family members with relationships
- **src/components/LoginForm.js** - User authentication form
- **src/components/Modal.js** - Reusable modal wrapper component
- **src/components/AssignAdminModal.js** - Modal for assigning admin permissions to family branches
- **src/components/FirstLoginPasswordChange.js** - Password change form for first-time users
- **src/components/UserDetailModal.js** - Modal for displaying detailed user information

## UI & Interaction Components

- **src/components/AutoComplete.js** - Advanced autocomplete with keyboard navigation for person search
- **src/components/RelationshipSection.js** - Component for grouping and displaying family relationships

## Backend & Data

- **src/lib/firebase.js** - Firebase configuration and initialization
- **src/lib/firestore.js** - Database operations for family member CRUD operations and complex relationship management

## Context Providers

- **src/context/AuthContext.js** - Authentication state management with Firebase Auth
- **src/context/PermissionContext.js** - User permissions and role-based access control

## Design Documentation

- **src/context/design-principles.md** - Design philosophy and interaction patterns
- **src/context/style-guide.md** - Visual styling guidelines, colors, typography, and component patterns

## Assets

- **public/** - Static SVG icons (file.svg, globe.svg, next.svg, vercel.svg, window.svg)
- **src/app/favicon.ico** - Application favicon

## Architecture Overview

The application follows a modern React architecture with Firebase backend, featuring comprehensive family relationship management, authentication, search/navigation, and an Airbnb-inspired design system. Key features include:

- **Authentication**: Firebase Auth with role-based permissions
- **Data Management**: Firestore for family member data with complex relationship logic
- **UI**: Airbnb-inspired design system with responsive layouts
- **Visualization**: Both card-based and canvas-based family tree views
- **Search**: Advanced autocomplete with path finding between family members
- **Relationships**: Support for parents, children, spouses, siblings, and step-relationships
