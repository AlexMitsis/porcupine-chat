# 🔐 Porcupine Chat - Secure Room-Based Messaging

A modern, secure chat application featuring **end-to-end encryption**, **room-based conversations**, and **universal dark mode**. Built with React, Supabase, and modern cryptography.

## ✨ Features

### 🔒 **Security & Privacy**
- **End-to-end encryption** using ECDH key exchange and AES-256-GCM
- **Personal encryption keys** - only you can decrypt your messages
- **Secure room-based architecture** with unique keypairs per room
- **Google OAuth authentication** via Supabase Auth

### 🎨 **Modern UI/UX**
- **Universal dark mode** with toggle (defaults to dark)
- **Responsive design** that works on all devices
- **Professional chat interface** with message bubbles and timestamps
- **Smooth animations** (fade-in, slide-up, bounce-in effects)
- **Real-time message updates** with loading indicators

### 🏠 **Room Management**
- **Create private rooms** with custom names and generated codes
- **Join rooms via invite links** or room codes
- **Multi-user encrypted group chats**
- **Room member management** with creator privileges

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project setup (instructions below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd porcupine-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase credentials to .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- **`npm start`** - Runs the development server (with deprecation warnings suppressed)
- **`npm test`** - Launches the test runner in interactive watch mode
- **`npm run build`** - Builds the app for production
- **`npm run eject`** - Ejects from Create React App (one-way operation)

## 🏗️ Architecture

### Current Stack
- **Frontend:** React 18 + Tailwind CSS v3
- **Backend:** Supabase (PostgreSQL + Real-time + Auth)
- **Encryption:** Web Crypto API (ECDH + AES-256-GCM)
- **State Management:** React Context API + useState/useEffect

### Key Components
```
src/
├── components/
│   ├── App.js                 # Main app with theme provider
│   ├── Navbar.jsx            # Navigation with dark mode toggle
│   ├── SignIn.jsx            # Google OAuth authentication
│   ├── RoomSelection.jsx     # Room list and creation interface
│   ├── RoomChat.jsx          # Chat interface with E2E encryption
│   ├── DarkModeToggle.jsx    # Animated theme toggle
│   └── ErrorBoundary.jsx     # Error handling wrapper
├── contexts/
│   └── ThemeContext.js       # Dark mode state management
├── utils/
│   └── crypto.js            # Encryption utilities
└── supabase.js              # Supabase client configuration
```

## 🔑 How It Works

### Encryption Flow
1. **Room Creation/Join**: Each user generates an ECDH keypair for the room
2. **Key Exchange**: Public keys are stored in the database, private keys stay local
3. **Shared Secrets**: Users derive shared secrets with other room members
4. **Message Encryption**: Messages are encrypted with AES-256-GCM using shared secrets
5. **Real-time Delivery**: Encrypted messages are sent via Supabase real-time

### Dark Mode System
- **Theme Context**: Global state management for dark/light mode
- **LocalStorage Persistence**: User preference saved across sessions
- **Default Dark**: New users start with dark mode enabled
- **Universal Application**: All components support both themes

## 📋 Development Roadmap

### 🚧 In Progress
- [ ] Django backend migration
- [ ] Enhanced secure connection debugging and auto-recovery
- [ ] Improved error handling for edge cases

### 📋 Upcoming Features
- [ ] Message search and filtering
- [ ] File sharing with encryption
- [ ] Voice/video calling integration
- [ ] Mobile app development (React Native)
- [ ] Advanced room management (admin controls, member permissions)

### 🔄 Django Migration Plan (Future)
The project includes comprehensive preparation for migrating from Supabase to Django:

**Phase 1: Parallel Systems**
- Docker Compose setup with Django + PostgreSQL + Redis
- API compatibility testing and documentation

**Phase 2: Data Migration**
- Export/import scripts for rooms, users, and messages
- Data integrity validation and rollback procedures

**Phase 3: Frontend API Switch**
- Django JWT authentication replacement
- WebSocket real-time messaging migration
- Encryption handling updates

**Phase 4: Cleanup**
- Supabase dependency removal
- Documentation updates and deployment script changes

## 🎨 Design System

### Color Palette
- **Dark Theme**: Custom scale from `dark-50` to `dark-950`
- **Accent Colors**: Blue to purple gradients
- **Success/Error States**: Green and red variants with dark mode support

### Typography & Spacing
- **Font**: System font stack with fallbacks
- **Spacing**: Tailwind's 4px-based scale
- **Shadows**: Layered shadows with dark mode variants

### Animations
- **Duration**: 200ms for micro-interactions, 300ms for page transitions
- **Easing**: `ease-in-out` for natural movement
- **Types**: fade-in, slide-up, bounce-in effects

### Troubleshooting

**"Unable to establish secure connection"**
- Clear localStorage and refresh the page
- Check browser console for detailed error messages
- Ensure Supabase connection is stable

**Messages not appearing**
- Verify room membership in database
- Check if encryption keys are properly generated
- Refresh page to re-establish real-time connection

**Dark mode not persisting**
- Check localStorage for `theme` key
- Ensure ThemeProvider wraps the entire app
- Clear browser cache if needed

## 🔧 Configuration

### Environment Variables
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_ENV=development
```

### Supabase Setup
Required tables and configurations are documented in:
- `setup-database.sql` - Initial schema
- `enable-realtime.sql` - Real-time subscriptions
- `room-based-schema.sql` - Room and member tables

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
