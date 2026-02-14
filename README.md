# 🚀 AI-Powered Todo Application with Kubernetes

> A modern, cloud-native task management system with AI assistant powered by Groq Llama 3.3

[![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

## ✨ Features

- 🤖 **AI-Powered Chat** - Natural language task management using Groq Llama 3.3 70B
- ✅ **Task Management** - Create, update, delete, and organize tasks with priorities
- 🔐 **Authentication** - Secure user authentication with Better Auth
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and cyberpunk theme
- ☁️ **Cloud-Native** - Fully containerized and orchestrated with Kubernetes
- 📊 **Scalable** - Horizontal pod autoscaling for high availability
- 🔄 **Real-time** - Live updates and seamless user experience

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  MCP Server  │      │
│  │  (Next.js)   │◄─┤   (FastAPI)  │◄─┤  (AI Tools)  │      │
│  │  Port: 3000  │  │  Port: 8000  │  │  Port: 8001  │      │
│  └──────────────┘  └──────┬───────┘  └──────────────┘      │
│                           │                                  │
│                           ▼                                  │
│                    ┌──────────────┐                         │
│                    │  PostgreSQL  │                         │
│                    │  (Database)  │                         │
│                    │  Port: 5432  │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Better Auth** - Authentication library

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **Alembic** - Database migrations
- **PostgreSQL 16** - Relational database
- **Groq API** - AI inference (Llama 3.3 70B)

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **Helm** - Kubernetes package manager
- **Minikube** - Local Kubernetes cluster

## 📋 Prerequisites

Before you begin, ensure you have installed:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) (v1.30+)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (v1.28+)
- [Helm](https://helm.sh/docs/intro/install/) (v3.8+)
- [Git](https://git-scm.com/downloads)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/todo-app.git
cd todo-app
```

### 2. Set Up Environment Variables

Get your free Groq API key from [console.groq.com](https://console.groq.com/keys)

Edit the Helm values file:

```bash
# Windows
notepad helm/todo-app/values.yaml

# Linux/Mac
nano helm/todo-app/values.yaml
```

Update the `groqApiKey` value:

```yaml
backend:
  secrets:
    groqApiKey: "your-groq-api-key-here"
```

### 3. Deploy the Application

**Option A: Automated Setup (Recommended)**

```powershell
# Windows
.\scripts\minikube-setup.ps1

# Linux/Mac
./scripts/minikube-setup.sh
```

This script will:
- ✅ Start Minikube
- ✅ Build Docker images
- ✅ Deploy with Helm
- ✅ Open the app in your browser

**Option B: Manual Setup**

```bash
# 1. Start Minikube
minikube start --driver=docker --cpus=4 --memory=8192

# 2. Configure Docker to use Minikube's daemon
# Windows PowerShell
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Linux/Mac
eval $(minikube docker-env)

# 3. Build images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
docker build -t todo-mcp:latest ./backend

# 4. Deploy with Helm
helm upgrade --install todo-app ./helm/todo-app \
  --namespace todo-app \
  --create-namespace \
  --set backend.image.tag=latest \
  --set frontend.image.tag=latest \
  --set mcp.image.tag=latest

# 5. Access the application
minikube service frontend -n todo-app
```

### 4. Access the Application

The app will open automatically in your browser at:
- **Local**: http://127.0.0.1:xxxxx (dynamic port)
- **Cluster**: http://192.168.49.2:30432

**Note**: Keep the terminal running to maintain the tunnel!

## 📖 Documentation

- **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** - Comprehensive beginner-friendly guide explaining the entire architecture
- **[QUICK_START_K8S.md](QUICK_START_K8S.md)** - Detailed Kubernetes deployment guide
- **[KUBERNETES.md](KUBERNETES.md)** - Complete Kubernetes documentation
- **[helm/todo-app/README.md](helm/todo-app/README.md)** - Helm chart documentation

## 🎯 Usage

### Creating Tasks

**Traditional Way:**
1. Click "Dashboard" in navigation
2. Click "Add Task"
3. Enter task details
4. Click "Create"

**AI Way:**
1. Click "Chat" in navigation
2. Type: "Create a task to buy groceries"
3. AI creates the task for you!

### AI Chat Examples

```
You: "Show me all my urgent tasks"
AI: Here are your urgent tasks: [lists tasks with high priority]

You: "Create a task to finish the project report by Friday"
AI: Created task "Finish project report" with due date February 16, 2026

You: "Mark the grocery task as completed"
AI: Task "Buy groceries" marked as completed ✓

You: "What tasks do I have for today?"
AI: You have 3 tasks due today: [lists tasks]
```

## 🔧 Development

### Project Structure

```
todo-app/
├── frontend/               # Next.js application
│   ├── app/               # Pages and routes
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   └── Dockerfile
│
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── models/       # Database models
│   │   ├── routers/      # API routes
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── mcp_server.py # AI tools server
│   ├── alembic/          # Migrations
│   └── Dockerfile
│
├── helm/todo-app/         # Helm chart
│   ├── templates/        # K8s manifests
│   └── values.yaml       # Configuration
│
├── k8s/                  # Raw K8s manifests
├── scripts/              # Deployment scripts
└── HOW_IT_WORKS.md       # Architecture guide
```

### Useful Commands

```bash
# View all pods
kubectl get pods -n todo-app

# View logs
kubectl logs -l app=backend -n todo-app --tail=50
kubectl logs -l app=frontend -n todo-app --tail=50

# Scale deployments
kubectl scale deployment backend --replicas=3 -n todo-app

# Restart deployment
kubectl rollout restart deployment backend -n todo-app

# Access database
kubectl exec -it deployment/postgres -n todo-app -- psql -U postgres -d todo_db

# Port forward backend
kubectl port-forward svc/backend 8000:8000 -n todo-app

# Kubernetes dashboard
minikube dashboard
```

### Environment Variables

**Backend** (`backend-config` ConfigMap):
- `DEBUG` - Debug mode (default: false)
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiry (default: 30)
- `ALLOWED_ORIGINS` - CORS origins

**Secrets** (`backend-secret`):
- `GROQ_API_KEY` - Groq API key for AI features
- `SECRET_KEY` - Application secret key
- `BETTER_AUTH_SECRET` - Auth encryption key

**Database** (`postgres-secret`):
- `POSTGRES_PASSWORD` - Database password

## 📊 Monitoring

### Health Checks

All services expose health endpoints:

- Frontend: http://localhost:3000/
- Backend: http://localhost:8000/health
- MCP Server: http://localhost:8001/health

### View Resources

```bash
# Pod status
kubectl get pods -n todo-app

# Services
kubectl get svc -n todo-app

# Events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Resource usage (requires metrics-server)
kubectl top pods -n todo-app
```

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
pytest
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

## 🔄 Updates and Rollbacks

### Update the Application

```bash
# Modify code, then rebuild images
docker build -t todo-backend:v2 ./backend

# Update deployment
helm upgrade todo-app ./helm/todo-app \
  --set backend.image.tag=v2 \
  -n todo-app
```

### Rollback

```bash
# View history
helm history todo-app -n todo-app

# Rollback to previous version
helm rollback todo-app -n todo-app

# Rollback to specific revision
helm rollback todo-app 3 -n todo-app
```

## 🛡️ Security

### Production Considerations

⚠️ **Before deploying to production, update these secrets:**

```yaml
# helm/todo-app/values.yaml
backend:
  secrets:
    secretKey: "CHANGE-THIS-IN-PRODUCTION"
    betterAuthSecret: "CHANGE-THIS-IN-PRODUCTION"
    groqApiKey: "your-actual-groq-api-key"

postgresql:
  auth:
    password: "CHANGE-THIS-IN-PRODUCTION"
```

### Best Practices

- ✅ Use external secret management (Vault, AWS Secrets Manager)
- ✅ Enable TLS/HTTPS for all endpoints
- ✅ Implement network policies
- ✅ Use non-root containers (already configured)
- ✅ Scan images for vulnerabilities
- ✅ Enable pod security policies
- ✅ Regular backups of PostgreSQL data

## 🧹 Cleanup

### Stop the Application

```bash
# Delete Helm release
helm uninstall todo-app -n todo-app

# Stop Minikube
minikube stop

# Delete Minikube cluster (removes all data)
minikube delete
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - For providing free AI inference
- [Better Auth](https://www.better-auth.com/) - For the authentication library
- [FastAPI](https://fastapi.tiangolo.com/) - For the amazing Python framework
- [Next.js](https://nextjs.org/) - For the React framework
- [Kubernetes](https://kubernetes.io/) - For container orchestration

## 🗺️ Roadmap

- [ ] Add task categories and tags
- [ ] Implement task sharing between users
- [ ] Add calendar view
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Export tasks to various formats
- [ ] Integration with Google Calendar
- [ ] Voice commands for task management

---

**Made with ❤️ using Kubernetes, Next.js, FastAPI, and AI**

⭐ Star this repository if you find it helpful!
