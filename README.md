# Habitly - Daily Habit Tracker

A comprehensive Progressive Web App (PWA) for tracking daily habits with advanced features like analytics, achievements, challenges, and push notifications.

## Features

- 📱 **Progressive Web App** - Install on any device, works offline
- 🎯 **Habit Tracking** - Create, track, and complete daily habits
- 📊 **Analytics Dashboard** - Visualize your progress with interactive charts
- 🏆 **Achievement System** - Unlock badges and track milestones
- 🎮 **Challenges** - Join community challenges and compete with others
- 🌙 **Dark/Light Theme** - Toggle between themes with persistence
- 🔔 **Push Notifications** - Smart reminders to keep you on track
- 📈 **Goal Setting** - Set weekly and monthly targets
- 💾 **Data Export/Import** - Backup and restore your data
- 🎨 **Beautiful UI** - Modern design with smooth animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd habitly
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Dexie (IndexedDB)
- **State Management**: React Query
- **Routing**: React Router
- **PWA**: Vite PWA Plugin
- **Charts**: Recharts
- **Notifications**: Web Push API

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── lib/                # Utilities and database logic
├── hooks/              # Custom React hooks
└── assets/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
