# MAYC Whale Tracker - Структура Проекта и Архитектура

Дата создания: 2026-02-09
Последнее обновление: 2026-02-09

---

## 📋 Обзор Проекта

**Название**: MAYC Whale Tracker
**Тип**: Full-stack Web Application
**Цель**: Анализ и мониторинг крупных держателей (китов) NFT коллекции Mutant Ape Yacht Club

---

## 🏗️ Технологический Стек

### Frontend
- **Framework**: React 18+ (Create React App)
- **Язык**: TypeScript
- **Стили**: Tailwind CSS + ATLAS Custom CSS (hybrid)
- **State Management**: React Context API (AuthContext)
- **Charts**: Chart.js v4.4.7 + react-chartjs-2
- **Routing**: useState-based (не react-router)
- **API Client**: Axios + Custom hooks
- **WebSocket**: Native WebSocket API

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Язык**: TypeScript
- **Blockchain**: ethers.js + Alchemy SDK
- **Caching**: node-cache (in-memory)
- **Real-time**: WebSocket (ws library)
- **Authentication**: JWT + bcrypt
- **Logging**: Custom logger

### External APIs
- **Alchemy API**: Blockchain data, NFT metadata, floor prices
- **OpenSea API**: Floor prices через Alchemy SDK (getFloorPrice)
- **ENS Resolution**: Через ethers provider

---

## 📁 Структура Проекта

```
nft_tracking/
├── backend/                      # Node.js Backend API
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.ts         # REST API маршруты
│   │   │   └── websocket.ts      # WebSocket сервер
│   │   ├── controllers/
│   │   │   └── auth.controller.ts # Аутентификация
│   │   ├── models/
│   │   │   ├── analytics.model.ts     # Типы для аналитики
│   │   │   ├── enrichment.model.ts    # Типы для enrichment
│   │   │   ├── holder.model.ts        # Типы для держателей
│   │   │   └── transaction.model.ts   # Типы для транзакций
│   │   ├── providers/
│   │   │   ├── alchemy.provider.ts      # Alchemy JSON-RPC API
│   │   │   └── alchemy-sdk.provider.ts  # Alchemy SDK (NFT API)
│   │   ├── services/
│   │   │   ├── analytics.service.ts     # Анализ данных холдеров
│   │   │   ├── blockchain.service.ts    # Получение Transfer событий
│   │   │   ├── cache.service.ts         # In-memory кэширование
│   │   │   ├── enrichment.service.ts    # ENS, ETH balance, portfolio
│   │   │   ├── ens.service.ts           # ENS name resolution
│   │   │   ├── image-search.service.ts  # Perceptual hash image search
│   │   │   └── trait-analyzer.service.ts # NFT traits analysis
│   │   ├── utils/
│   │   │   ├── helpers.ts               # Утилиты (formatNumber, retryWithBackoff)
│   │   │   └── logger.ts                # Logging система
│   │   └── index.ts                      # Entry point, Express app
│   ├── data/
│   │   └── mayc-hash-index.json         # Pre-built image hash index
│   ├── scripts/
│   │   └── build-image-index.ts         # Script для построения индекса
│   ├── .env                              # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # React Frontend
│   ├── public/
│   │   └── index.html                   # HTML template (с Google Fonts)
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                    # Authentication modals
│   │   │   │   ├── LoginModal.tsx
│   │   │   │   ├── SignUpModal.tsx
│   │   │   │   ├── OTPModal.tsx
│   │   │   │   ├── ResetPasswordModal.tsx
│   │   │   │   └── SuccessModal.tsx
│   │   │   ├── chartjs/                 # Chart.js компоненты (NEW)
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── PieChart.tsx
│   │   │   │   └── DoughnutChart.tsx
│   │   │   ├── charts/                  # Recharts компоненты (DEPRECATED)
│   │   │   │   ├── ActivityTrendChart.tsx
│   │   │   │   ├── HistoricalTrendChart.tsx
│   │   │   │   ├── HolderDistributionPieChart.tsx
│   │   │   │   ├── TopHoldersBarChart.tsx
│   │   │   │   └── TraitRarityChart.tsx
│   │   │   ├── loading/
│   │   │   │   └── index.tsx            # Loading skeletons
│   │   │   ├── ui/                      # UI библиотека компонентов
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Toggle.tsx
│   │   │   │   └── index.ts
│   │   │   ├── AuthManager.tsx          # Authentication manager
│   │   │   ├── Footer.tsx               # Footer (DEPRECATED после ATLAS миграции)
│   │   │   ├── LoadingSpinner.tsx       # Loading spinner
│   │   │   ├── Navigation.tsx           # Top navigation (DEPRECATED)
│   │   │   ├── RealtimeIndicator.tsx    # Live status indicator (DEPRECATED)
│   │   │   ├── RecentTransactions.tsx   # Recent transactions list
│   │   │   ├── SearchBar.tsx            # Search input
│   │   │   ├── Sidebar.tsx              # Left sidebar navigation (ATLAS)
│   │   │   ├── Topbar.tsx               # Top bar with search (ATLAS)
│   │   │   ├── WhaleCard.tsx            # Advanced whale card (ATLAS Design)
│   │   │   ├── WhaleFilters.tsx         # Whale filtering controls
│   │   │   └── WhaleList.tsx            # Whale list with Collection Hero
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx          # Authentication context
│   │   ├── hooks/
│   │   │   ├── useENS.ts                # ENS resolution hook
│   │   │   ├── useWebSocket.ts          # WebSocket connection hook
│   │   │   └── useWhales.ts             # React Query hooks для API
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # Analytics Dashboard (Chart.js)
│   │   │   ├── FlipCalculator.tsx       # NFT flip calculator
│   │   │   ├── Homepage.tsx             # Landing page
│   │   │   ├── MutantFinder.tsx         # NFT search by traits/image
│   │   │   ├── PortfolioAnalyzer.tsx    # Portfolio analysis tool
│   │   │   └── WhaleDetail.tsx          # Individual whale details
│   │   ├── services/
│   │   │   ├── api.ts                   # Axios API client
│   │   │   └── auth.service.ts          # Authentication service
│   │   ├── styles/
│   │   │   ├── design-system.css        # ATLAS Design System variables
│   │   │   ├── auth-modals.css          # Authentication modal styles
│   │   │   ├── homepage.css             # Homepage styles
│   │   │   ├── sidebar.css              # Sidebar styles
│   │   │   ├── topbar.css               # Topbar styles
│   │   │   ├── whale-cards.css          # Whale card styles
│   │   │   └── whale-list.css           # Whale list styles
│   │   ├── types/
│   │   │   ├── auth.types.ts            # Authentication types
│   │   │   └── whale.types.ts           # Whale data types
│   │   ├── App.tsx                      # Main App component
│   │   ├── index.tsx                    # React entry point
│   │   └── setupTests.ts                # Test configuration
│   ├── package.json
│   └── tsconfig.json
│
├── DEPLOYMENT.md                # Deployment guide (Telegram bot)
├── DEPLOYMENT_COMPLETE.md       # Complete deployment documentation
└── README.md                    # Project overview

```

---

## 🎯 Страницы Приложения (Routing)

Приложение использует **useState-based routing** (не react-router).

### Список страниц:
1. **`home`** - Landing page (Homepage.tsx) - БЕЗ Navigation/Footer
2. **`whales`** - Top Whales (WhaleList.tsx) - С Sidebar/Topbar
3. **`dashboard`** - Analytics Dashboard (Dashboard.tsx) - С Sidebar/Topbar
4. **`whale-detail`** - Individual Whale (WhaleDetail.tsx) - С Sidebar/Topbar
5. **`mutant-finder`** - Search by traits/image (MutantFinder.tsx) - С Sidebar/Topbar
6. **`portfolio-analyzer`** - Portfolio analysis (PortfolioAnalyzer.tsx) - С Sidebar/Topbar
7. **`flip-calculator`** - NFT flip calculator (FlipCalculator.tsx) - С Sidebar/Topbar

**Layout логика** (в App.tsx):
- Homepage: рендерится без Sidebar, Navigation, Footer
- Остальные страницы: рендерятся с Sidebar + Topbar

---

## 📊 Backend API Endpoints

### Whale Data
- `GET /api/whales/top?limit=50` - Топ N китов с ENS и ETH балансом
- `GET /api/whales/search?address=0x...` - Поиск кита по адресу
- `GET /api/whales/analytics` - Полная статистика и distribution
- `GET /api/whales/stats` - Быстрая статистика (из кэша)
- `GET /api/whales/:address/activity` - История активности кита
- `POST /api/whales/refresh` - Очистка кэша (admin)

### Enrichment
- `GET /api/whales/top/enriched?limit=50` - Киты с полным enrichment
- `GET /api/whales/:address/enriched` - Детали кита с enrichment
- `GET /api/whales/portfolio/:address` - NFT portfolio breakdown
- `GET /api/whales/ens/:address` - ENS resolution

### NFT Search
- `POST /api/nft/search-by-image` - Reverse image search (pHash)
- `GET /api/nft/:tokenId/metadata` - NFT metadata
- `POST /api/nft/search-by-traits` - Search by traits

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/logout` - User logout

### System
- `GET /api/health` - Health check
- `GET /api/cache/stats` - Cache statistics
- `POST /api/cache/clear` - Clear cache

---

## 🧩 UI Components

### ATLAS Design System Components

#### Layout
- **Sidebar** - Left navigation (240px fixed, с logo и nav items)
- **Topbar** - Top bar (с search input и live indicator)

#### Whale Components
- **WhaleCard** - Advanced whale card с rank badges, progress bars, expandable sections
- **WhaleList** - Whale list page с Collection Hero и filters
- **WhaleFilters** - Фильтры для whale list

#### Charts (Chart.js v4.4.7)
- **BarChart** - Top holders bar chart
- **PieChart** - Distribution pie chart
- **LineChart** - Activity trend line chart
- **DoughnutChart** - Other metrics doughnut chart

#### Authentication
- **LoginModal** - Login form
- **SignUpModal** - Registration form
- **OTPModal** - OTP verification
- **ResetPasswordModal** - Password reset
- **SuccessModal** - Success notification
- **AuthManager** - Authentication state manager

#### UI Library
- **Badge** - Status badges
- **Button** - Primary/secondary/ghost buttons
- **Card** - Card container
- **Input** - Text input field
- **Modal** - Modal dialog
- **Select** - Dropdown select
- **Toast** - Toast notifications
- **Toggle** - Toggle switch

#### Other
- **LoadingSpinner** - Loading indicator
- **RecentTransactions** - Transaction list
- **SearchBar** - Search input component

---

## 🔄 Data Flow

### Whale Data Flow
```
Alchemy Blockchain API
        ↓
BlockchainService.getAllTransferEvents() [⚠️ ПРОБЛЕМА: только последние 7 дней!]
        ↓
AnalyticsService.buildHoldersList()
        ↓
CacheService (TTL: 2 min)
        ↓
REST API /api/whales/top
        ↓
Frontend useTopWhales() hook
        ↓
WhaleList → WhaleCard components
```

### Enrichment Flow
```
Whale addresses
        ↓
EnrichmentService.enrichWhales()
        ├── ENSService.resolveBatch() → ENS names, avatars, Twitter
        ├── BlockchainService.getETHBalance() → ETH balances
        └── AlchemySDKProvider.getNFTsForOwner() → NFT portfolios
        ↓
Cached (ENS: 24h, ETH: 30min, Portfolio: 1h)
        ↓
REST API /api/whales/top/enriched
        ↓
Frontend components
```

### Floor Price Flow
```
AlchemySDKProvider.getFloorPrice()
        ↓
Alchemy SDK → OpenSea API (через Alchemy)
        ↓
Cached (TTL: 30 min)
        ↓
REST API responses
        ↓
Frontend display
```

---

## ⚠️ КРИТИЧЕСКАЯ ПРОБЛЕМА: Источник данных о холдерах

### Текущая реализация (НЕПРАВИЛЬНО)
```typescript
// blockchain.service.ts:75
if (fromBlock === 0) {
  fromBlock = Math.max(0, toBlock - 45000); // Последние 45k блоков (~7 дней)
}
```

**Проблема**:
- Получаем только Transfer события за **последние 7 дней**
- Показываем только тех, кто **получил** NFT за последнюю неделю
- НЕ показываем тех, кто владел NFT до этого периода

**Текущие данные** (9 февраля 2026):
- Total holders: 152
- Max NFTs per holder: 10
- Whales (20+ NFTs): 0 ✅ (правильно, т.к. макс 10)

### Правильное решение (НУЖНО РЕАЛИЗОВАТЬ)

```typescript
// Использовать Alchemy SDK метод getOwnersForContract()
const owners = await alchemySDKProvider.getOwnersForContractWithTokenCount(contractAddress);
// Возвращает ВСЕ текущие владельцы с количеством NFT
```

**Метод уже добавлен** в `alchemy-sdk.provider.ts` (строки 212-236):
- `getOwnersForContract()` - получает всех владельцев
- `getOwnersForContractWithTokenCount()` - получает владельцев с количеством NFT

**Осталось**:
1. Изменить `blockchain.service.ts` чтобы использовать `getOwnersForContract()`
2. Обновить `analytics.service.ts` для работы с новыми данными
3. Пересобрать и перезапустить бэкенд

---

## 🎨 ATLAS Design System

### Цветовая палитра
```css
--bg: #0B0B10           /* Главный фон */
--card: #1A1A24         /* Фон карточек */
--brd: #2A2A3A          /* Borders */
--gold: #F5A623         /* Основной акцент */
--t1: #F0F0F5           /* Primary text */
--t2: #C9C9D4           /* Secondary text */
--t3: #9494A8           /* Tertiary text */
--ok: #4ADE80           /* Success */
--err: #F87171          /* Error */
--warn: #FBBF24         /* Warning */
```

### Шрифты
- **Outfit** (400, 500, 600, 700, 800) - Headings
- **DM Sans** (400, 500, 600) - Body text
- **JetBrains Mono** (400, 500) - Code/numbers

### Компоненты
- **Rank badges**: Золото (#FFD700), Серебро (#C0C0C0), Бронза (#CD7F32)
- **Progress bars**: Золотой градиент с animation
- **Buttons**: Primary (gold), Ghost (transparent)
- **Cards**: Dark с золотыми акцентами для топ-3

---

## 🔐 OpenSea Integration

**Статус**: ✅ Интегрирован через Alchemy SDK

### Как работает
```typescript
// AlchemySDKProvider.getFloorPrice()
const response = await this.alchemy.nft.getFloorPrice(contractAddress);
const floorPrice = response.openSea.floorPrice; // Получаем через OpenSea API
```

### Файл OpenSea Provider (из nft-analytics)
Местоположение: `C:\Users\User\nft-analytics\backend\src\providers\opensea.provider.ts`

**Функционал**:
- `getCollectionSales()` - Получить sales events
- `getTokenSalesHistory()` - История продаж токена
- `getCollectionStats()` - Статистика коллекции (volume24h, sales24h, totalOwners, marketCap)

**API**: OpenSea API v2 (`https://api.opensea.io/api/v2`)
**Auth**: X-API-KEY header

---

## 📈 Performance & Caching

### Cache TTL
- **Transfer events**: 2 minutes
- **ENS names**: 24 hours
- **ETH balances**: 30 minutes
- **NFT portfolios**: 1 hour
- **Floor prices**: 30 minutes
- **Image hash index**: 24 hours

### Rate Limiting
- **Alchemy Free tier**: 3000ms delay между запросами
- **Batch size**: 10 items per batch
- **Retry logic**: Exponential backoff (3 attempts)

---

## 🚀 Deployment

### Backend
- **Port**: 6252 (HTTP), 6255 (WebSocket)
- **Environment**: Production
- **Process**: PM2 or systemd
- **Build**: `npm run build && npm start`

### Frontend
- **Build**: `npm run build`
- **Output**: `build/` directory
- **Serve**: Nginx or static hosting
- **API URL**: http://localhost:6252

---

## 📝 Что было реализовано

### ✅ Completed Features
1. Blockchain data fetching (Transfer events)
2. Whale analysis and ranking
3. ENS name resolution (batch)
4. ETH balance enrichment
5. NFT portfolio analysis
6. Floor price integration (OpenSea via Alchemy)
7. Image search (perceptual hashing)
8. Authentication system (JWT + OTP)
9. ATLAS Design System migration
10. Chart.js integration
11. WebSocket real-time updates
12. Sidebar + Topbar navigation
13. Advanced whale cards с rank badges

### ⚠️ Known Issues
1. **Whale data source**: Используются Transfer events (7 дней) вместо getOwnersForContract()
2. **Volume data**: 0 ETH (Transfer events не содержат цены)
3. **Historical data**: Ограничено 7 днями из-за Alchemy Free tier

### 🔜 TODO
1. Переключить источник данных на `getOwnersForContract()`
2. Скопировать `opensea.provider.ts` из nft-analytics
3. Добавить PostgreSQL для исторических данных
4. Реализовать инкрементальное обновление индекса
5. Добавить мобильную адаптивность
6. Оптимизировать bundle size

---

## 🔗 Связанные проекты

- **nft-analytics** (`C:\Users\User\nft-analytics\`) - Старая версия проекта с OpenSea provider
- **Plan file** (`.claude/plans/bubbly-sprouting-canyon.md`) - План миграции на ATLAS дизайн

---

## 📞 Контакты и поддержка

- Backend API documentation: `backend/README.md`
- Image search documentation: `backend/IMAGE_SEARCH.md`
- Deployment guide: `DEPLOYMENT_COMPLETE.md`
- Memory notes: `.claude/projects/C--Users-User/memory/MEMORY.md`

---

**Последнее обновление**: 2026-02-09
**Версия**: 1.0
**Статус**: Production Ready (с известными ограничениями)
