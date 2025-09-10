# 🏗️ Porcupine Chat - Microservices Architecture

A scalable, containerized chat application with end-to-end encryption.

## 🎯 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Django Backend │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
│                 │    │                 │    │                 │
│  • Room UI      │    │ • REST API      │    │ • Rooms         │
│  • E2E Crypto   │    │ • WebSockets    │    │ • Users         │
│  • Real-time    │    │ • Auth (JWT)    │    │ • Messages      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │      Redis      │
                       │   (Port 6379)   │
                       │                 │
                       │ • WebSocket     │
                       │ • Caching       │
                       │ • Sessions      │
                       └─────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### **2. Start All Services**
```bash
# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### **3. Initialize Database**
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### **4. Access Applications**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📁 Project Structure

```
porcupine-chat/
├── 🎨 Frontend (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── RoomSelection.jsx
│   │   │   ├── RoomChat.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── crypto.js          # E2E encryption
│   │   └── services/
│   │       └── api.js             # Django API client
│   ├── Dockerfile.frontend
│   └── package.json
│
├── 🔧 Backend (Django)
│   ├── porcupine_backend/         # Django project
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py               # WebSocket config
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/             # User authentication
│   │   ├── rooms/                # Room management
│   │   │   ├── models.py         # Room, RoomMembership
│   │   │   ├── views.py          # REST API endpoints
│   │   │   ├── serializers.py    # API serialization
│   │   │   └── urls.py
│   │   └── chat/                 # Real-time messaging
│   │       ├── consumers.py      # WebSocket handlers
│   │       ├── models.py         # Message model
│   │       └── routing.py        # WebSocket routing
│   ├── Dockerfile
│   └── requirements.txt
│
├── 🔄 Infrastructure
│   ├── docker-compose.yml        # Development stack
│   ├── docker-compose.prod.yml   # Production stack
│   ├── nginx/                    # Reverse proxy config
│   └── .env.example             # Environment template
│
└── 📚 Documentation
    ├── README.md                 # Main documentation
    ├── README-MICROSERVICES.md   # This file
    └── API.md                    # API documentation
```

## 🔐 Security Features

### **End-to-End Encryption**
- **Key Exchange**: ECDH P-256 (Web Crypto API)
- **Message Encryption**: AES-256-GCM
- **Server Role**: Never sees encryption keys
- **Client Storage**: Keys stored locally per room

### **Authentication**
- **JWT Tokens**: Access + Refresh token system
- **Google OAuth**: Social authentication
- **Session Management**: Redis-backed sessions

### **API Security**
- **CORS Configuration**: Environment-based origins
- **Rate Limiting**: Per-user API limits
- **Input Validation**: Django REST framework
- **SQL Injection Protection**: Django ORM

## 🔄 Development Workflow

### **Local Development**
```bash
# Frontend only
npm start

# Backend only
cd backend
python manage.py runserver

# Full stack
docker-compose up
```

### **Database Management**
```bash
# Create migration
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# Database shell
docker-compose exec backend python manage.py dbshell
```

### **Testing**
```bash
# Frontend tests
npm test

# Backend tests
docker-compose exec backend python manage.py test

# E2E tests
npm run test:e2e
```

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/login/` - Login with credentials
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/user/` - Current user info

### **Rooms**
- `GET /api/rooms/` - List user's rooms
- `POST /api/rooms/` - Create room
- `POST /api/rooms/join/` - Join room by code
- `GET /api/rooms/{id}/members/` - Room members
- `POST /api/rooms/{id}/invite/` - Generate invite link

### **Chat**
- `GET /api/chat/rooms/{id}/messages/` - Message history
- `WebSocket /ws/chat/{room_id}/` - Real-time messaging

## 🚀 Deployment

### **Development**
```bash
docker-compose up -d
```

### **Production**
```bash
# Use production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With SSL/Nginx
docker-compose --profile production up -d
```

### **Environment Variables (Production)**
```bash
DEBUG=False
SECRET_KEY=your-super-secure-secret-key
ALLOWED_HOSTS=your-domain.com
DB_PASSWORD=secure-database-password
REDIS_PASSWORD=secure-redis-password
```

## 📈 Scaling & Performance

### **Horizontal Scaling**
- **Frontend**: Multiple nginx instances
- **Backend**: Multiple Django workers
- **Database**: PostgreSQL read replicas
- **Cache**: Redis cluster

### **Monitoring**
- **Logs**: Centralized logging with ELK stack
- **Metrics**: Prometheus + Grafana
- **Health Checks**: Built into Docker Compose
- **Error Tracking**: Sentry integration

## 🔧 Migration from Supabase

### **Phase 1: Parallel Systems**
1. Keep Supabase running
2. Deploy Django backend
3. Test APIs side-by-side

### **Phase 2: Data Migration**
1. Export Supabase data
2. Import into PostgreSQL
3. Validate data integrity

### **Phase 3: Frontend Switch**
1. Update React to use Django APIs
2. Replace Supabase auth with JWT
3. Switch real-time to WebSockets

### **Phase 4: Cleanup**
1. Remove Supabase dependencies
2. Archive old code
3. Update documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.