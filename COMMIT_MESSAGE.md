Add modern dark mode and room-based architecture with Django preparation

## 🌙 Dark Mode Implementation
- Add comprehensive dark mode theme with modern UI/UX palette
- Implement ThemeContext with system preference detection and localStorage persistence
- Create animated dark mode toggle with smooth transitions (200ms)
- Add custom Tailwind dark color scheme (dark-50 to dark-950)
- Include modern accent colors and success/error states
- Apply dark mode styling to App, Navbar, SignIn, LogOut components

## 🏗️ Architecture Updates  
- Migrate from Chat.jsx to room-based RoomSelection and RoomChat components
- Add room management with encrypted group chat functionality
- Implement invite link parsing and room code system
- Add comprehensive error handling and loading states

## 🧹 Code Cleanup
- Remove unused components: Chat.jsx, Message.jsx, SendMessage.jsx
- Remove "Manage Key" button and auto-key management system
- Simplify LogOut component to handle sign out only
- Clean up key management imports and exports

## 🐛 Bug Fixes
- Fix 1/1/1970 timestamp issue in messages
- Add explicit created_at timestamps for new messages
- Improve date/time formatting with null/invalid timestamp handling
- Add error handling for malformed dates

## 🚀 Django Migration Preparation
- Add Docker Compose configuration for microservices architecture
- Include PostgreSQL and Redis setup for Django backend
- Add comprehensive project documentation (FEATURES.md, README-MICROSERVICES.md)
- Create database migration scripts and troubleshooting guides
- Set up development and production deployment configurations

## 📋 Project Management
- Add TODO.md for tracking development progress
- Document migration phases and current implementation status
- Include comprehensive feature documentation

## 🎨 UI/UX Improvements
- Add smooth animations (fade-in, slide-up, bounce-in)
- Implement modern gradients and shadows
- Improve responsive design and accessibility
- Add consistent hover states and focus management
- Enhance loading states with proper dark mode support

## 🔧 Technical Details
- Update Tailwind config with custom colors and animations
- Add theme provider with React Context API
- Implement proper TypeScript-style error handling
- Include comprehensive database schema files
- Set up Docker containerization for all services

This commit represents a major milestone in the application's evolution from a simple Supabase chat to a sophisticated, room-based messaging platform with modern dark mode and preparation for Django backend migration.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>