# Syd Platform - AI-Powered Business Intelligence

## 🚀 Overview
Syd Platform is an advanced business intelligence system powered by AI (Gemini 2.5 Flash) with real-time Firebase integration and semantic search capabilities.

## 🏗️ Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Google Gemini 2.5 Flash
- **Framework**: M³ (Multi-Modal Multi-Agent)

## 📁 Project Structure
```
Syd_Prototipo/
├── components/        # React components
├── contexts/         # React contexts (Theme, Language)
├── data/            # Static data files
├── docs/            # Documentation
├── immagini/        # Image assets
├── mcp/             # MCP integration
├── samples/         # Sample files
├── src/             # Source code
│   ├── config/      # Configuration files
│   ├── containers/  # Container components
│   ├── integration/ # Integration services
│   ├── services/    # Business logic
│   └── styles/      # Global styles
└── tests/           # Test files
```

## 🔧 Setup
1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Configure Firebase credentials in `.env.local`
4. Run the app: `npm run dev`

## 🎯 Features
- **Syd Agent**: AI-powered assistant for data analysis
- **Document Processing**: Excel, PDF, CSV support
- **Semantic Search**: Intelligent data querying
- **Real-time Sync**: Firebase-powered persistence
- **Multi-language**: IT/EN support
- **Dark Mode**: Full dark theme support
- **Live Monitoring**: Error tracking and performance monitoring

## 🛡️ Security
- Firebase Auth integration
- Secure API key management
- Role-based access control
- Data encryption

## 📚 Documentation
- [Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [M³ Framework](./docs/M3_FRAMEWORK_COMPLETO.md)
- [Firebase Rules](./docs/firebase-rules-CORRETTE.txt)

## 🚦 Status
Production-ready for demo presentation.

## 📝 License
Proprietary - All rights reserved
