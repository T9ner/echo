# ECHO AI Assistant - Frontend

A modern React TypeScript frontend for the ECHO AI Productivity Assistant.

## Features

- **Modern Stack**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui with Tailwind CSS
- **State Management**: React Query for server state
- **Routing**: React Router DOM with URL-based navigation
- **Theme Support**: Dark/light mode with next-themes
- **API Integration**: Axios-based API client with error handling

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── Layout.tsx      # Main layout component
│   ├── EchoSidebar.tsx # Navigation sidebar
│   └── ...             # Feature components
├── hooks/              # Custom React hooks
│   ├── useTasks.ts     # Task management hooks
│   ├── useHabits.ts    # Habit tracking hooks
│   └── useChat.ts      # Chat functionality hooks
├── lib/                # Utilities and configurations
│   ├── api.ts          # API client setup
│   └── utils.ts        # Utility functions
├── types/              # TypeScript type definitions
│   └── index.ts        # All application types
└── pages/              # Page components
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update the API base URL in `.env` if needed:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## API Integration

The frontend communicates with the ECHO backend API through:

- **Task Management**: CRUD operations for tasks
- **Habit Tracking**: Habit creation and logging
- **AI Chat**: GPT-powered conversational interface
- **Analytics**: Productivity insights and metrics

## Key Components

### Layout System

- `Layout.tsx`: Main application shell with routing
- `EchoSidebar.tsx`: Navigation sidebar with theme toggle
- URL-based routing for all main sections

### Data Management

- React Query for server state management
- Custom hooks for each API domain (tasks, habits, chat)
- Optimistic updates and error handling
- Automatic cache invalidation

### UI/UX

- Responsive design with Tailwind CSS
- Dark/light theme support
- Loading states and error boundaries
- Toast notifications for user feedback

## Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_NODE_ENV`: Environment (development/production)
- `VITE_ENABLE_*`: Feature flags for optional functionality

## Development Guidelines

- Use TypeScript for all new code
- Follow the established component patterns
- Implement proper error handling
- Add loading states for async operations
- Use React Query for all API calls
- Follow the existing file structure

## Technologies Used

This project is built with:

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **React 18**: Modern React with hooks
- **Shadcn/ui**: High-quality UI components
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
