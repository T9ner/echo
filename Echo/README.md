# ECHO - AI Productivity Assistant

An intelligent task management and scheduling bot that learns from your habits and helps optimize your productivity.

## Features

- **Smart Task Management**: Natural language task creation and prioritization
- **Habit Tracking**: Monitor daily routines with streak tracking
- **Calendar Integration**: Sync with Google Calendar for seamless scheduling
- **AI Chat Interface**: Conversational interface for productivity assistance
- **Analytics Dashboard**: Track your productivity patterns over time

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Lucide React (icons)
- React Router DOM

**Backend:**
- FastAPI (Python)
- SQLAlchemy + SQLite/PostgreSQL
- Google Calendar API
- OpenAI API

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Google Calendar API credentials (optional)

### Installation

1. **Clone and setup project:**
```bash
git clone <your-repo>
cd echo-app
```

2. **Frontend setup:**
```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom date-fns lucide-react @headlessui/react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Backend setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Running the Application

1. **Start backend:**
```bash
cd backend
uvicorn main:app --reload
```
Backend runs on: http://localhost:8000

2. **Start frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Environment Variables

Create `.env` file in backend folder:
```
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=sqlite:///./echo.db
```

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `GET /api/habits` - Get all habits
- `POST /api/chat` - Chat with ECHO
- `GET /api/analytics` - Get productivity analytics

## Project Structure

```
echo-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   └── services/
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Development Roadmap

**Phase 1: Core Features**
- [x] Basic task CRUD
- [x] Habit tracking
- [x] Simple chat interface
- [ ] Database integration
- [ ] Google Calendar sync

**Phase 2: AI Integration**
- [ ] OpenAI-powered chat responses
- [ ] Smart task scheduling
- [ ] Habit pattern recognition
- [ ] Productivity insights

**Phase 3: Advanced Features**
- [ ] User authentication
- [ ] Mobile app
- [ ] Email notifications
- [ ] Team collaboration

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.