# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2025-02-11

### Added
- Dark mode toggle with moon/sun icon
- Dark theme color scheme with adjusted gradients and shadows
- Persistent dark mode preference (saved in localStorage)
- System preference detection (respects prefers-color-scheme)
- Smooth transitions between light and dark themes

### Changed
- All UI elements adapted for dark mode
- Adjusted text colors for better readability in dark mode
- Updated input fields, modals, and buttons for dark theme

## [1.0.4] - 2025-02-11

### Fixed
- Session handling: Users can now rejoin sessions after leaving
- Sessions are no longer deleted when a user leaves
- Sessions only auto-delete after 6-hour expiration

### Changed
- "End Session" button renamed to "Leave Session"
- Button icon changed from ✖ to 👋
- Status message changed from "Session ended" to "Left session"

## [1.0.3] - 2025-02-11

### Changed
- Compact header layout with h1 and session controls on same line
- Reduced button sizes and spacing for cleaner layout
- Shortened button text ("Create" instead of "Create Session")
- Shortened input placeholder for session code
- Smaller h1 font size (2.2rem from 2.75rem)

### Improved
- More space-efficient header design
- Better visual hierarchy in header
- Responsive layout adjustments for tablets and mobile

## [1.0.2] - 2025-02-11

### Changed
- Service worker caching strategy from cache-first to network-first for code files
- This ensures users get the latest version without manually clearing cache

### Fixed
- Auto-update issue where users had to clear cache to see new features

## [1.0.1] - 2025-02-11

### Added
- Progressive Web App (PWA) support
- Web App Manifest for installation on iOS and Android
- Service Worker for offline functionality
- 4-digit numeric session codes (replaced 6-character alphanumeric)
- 6-hour session expiration with automatic cleanup
- Real-time countdown timer for active sessions
- "End Session" button for manual session termination
- Debounced search (300ms delay) for better performance

### Changed
- Session code format from alphanumeric to numeric only
- Session input optimized for numeric keyboard on mobile

### Fixed
- Search lag when typing (implemented debouncing)

## [1.0.0] - 2025-01-XX

### Added
- Modern UI design system with CSS custom properties
- Enhanced animations (fadeIn, slide, pulse, float, starPulse)
- Version tracker badge in bottom-right corner
- Improved button styles with ripple effects
- Song card gradient accents and hover animations
- Smooth scrolling behavior
- Meta description for SEO
- .gitignore file for Claude Code files

### Improved
- Typography hierarchy and font smoothing
- Text wrapping for long song titles
- Button and input styling with better focus states
- Color palette and shadow system
- Mobile responsive design
- Loading and empty states
- Modal animations with spring effect
- Favorite button with star pulse animation

### Fixed
- Song title text visibility issues
- Text overflow handling in song items

### Technical
- Migrated to CSS variables for theming
- Added proper text overflow handling
- Improved flexbox layouts
- Enhanced transition timing functions
