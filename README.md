# ☕ Locla(Ollama) AI Barista

An intelligent conversational agent that helps users order Starbucks drinks using local LLMs. Built with NestJS, LangChain, and Next.js.

## 🎯 AI & Tech Stack

- **Local LLM Integration** - Ollama with Mistral/Gemma models (no cloud API costs)
- **LangChain/LangGraph** - Stateful conversational agents with tool calling
- **Multi-turn Dialog** - Preserves conversation context across sessions
- **Structured Output** - JSON-formatted responses with order schema validation
- **Vector-ready Architecture** - Designed for RAG and semantic search

### Technologies Used
- **Backend**: NestJS, LangChain, LangGraph, MongoDB
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **AI/LLM**: Ollama (local), Mistral 7B / Gemma 2B
- **Infrastructure**: Docker, Docker Compose



### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- 8GB+ RAM (16GB recommended)

### 1. Clone & Install

## BACKEND ENV
# Ollama (local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
# Database
MONGO_URI=mongodb://localhost:27017/drinks_db
# Server
PORT=3033

## FRONTEND ENV
NEXT_PUBLIC_API_URL=http://localhost:3033


```bash
git clone <your-repo>
cd barista

# Install dependencies
npm install

# Start Ollama and MongoDB
docker-compose up -d

# Pull a local LLM (choose one)
docker exec ollama ollama pull mistral:latest     # 4.1GB - smarter
docker exec ollama ollama pull gemma2:2b          # 1.6GB - faster

# Verify Ollama is running
curl http://localhost:11434/api/tags

# Server running at http://localhost:3033
cd barista 
npm run start:dev

cd barista-front
npm install
npm run dev
# App running at http://localhost:3000

# Test chat endpoint
curl -X POST http://localhost:3033/chats/message/test123 \
  -H "Content-Type: application/json" \
  -d '{"query": "I want a vanilla latte with oat milk"}'


