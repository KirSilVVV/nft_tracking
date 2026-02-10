# Design Inventory - UI Components & Features
**NFT Tracking Bot - ATLAS Design System**

Полная инвентаризация всех UI элементов, компонентов и функций.
Статус: ✅ Работает | 🎨 Дизайн готов, функционал не подключен | ⚠️ Частично работает

**Последнее обновление:** 2026-02-10

---

## 📊 Общая Статистика

| Категория | Всего | Работает | Дизайн готов | В разработке |
|-----------|-------|----------|--------------|--------------|
| **Страницы** | 9 | 4 ✅ | 4 🎨 | 1 ⚠️ |
| **UI Компоненты** | 20+ | 12 ✅ | 6 🎨 | 2 ⚠️ |
| **Модалки** | 6 | 1 ✅ | 5 🎨 | 0 |
| **Графики** | 9 | 2 ✅ | 7 🎨 | 0 |
| **Identity** | 3 | 3 ✅ | 0 | 0 |

---

## 🎨 ATLAS Design System - Core Elements

### Typography
```css
/* Headers */
--font-heading: 'Outfit', sans-serif;  /* 400-800 weight */
--font-body: 'DM Sans', sans-serif;    /* 400-600 weight */
--font-mono: 'JetBrains Mono', monospace; /* addresses, IDs */

/* Sizes */
--text-xs: 11px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 24px;
--text-3xl: 32px;
```

### Colors (Dark Theme)
```css
/* Primary */
--gold: #F5A623;           /* Accents, whale badges, CTAs */
--accent: #3B82F6;         /* Links, secondary actions */
--ok: #10B981;             /* Success states */
--warn: #F59E0B;           /* Warnings */
--no: #EF4444;             /* Errors, negative actions */

/* Background */
--bg: #0A0E27;             /* Page background (dark navy) */
--card: #151932;           /* Card background (lighter navy) */
--card-h: #1A1F3A;         /* Card hover state */

/* Text */
--t1: #FFFFFF;             /* Primary text (white) */
--t2: #A0AEC0;             /* Secondary text (gray) */
--t3: #718096;             /* Tertiary text (muted) */

/* Borders */
--border1: #2D3748;        /* Primary borders */
--border2: #1A202C;        /* Subtle borders */
```

### Spacing System
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

### Border Radius
```css
--radius-sm: 4px;   /* Small elements (badges, pills) */
--radius-md: 8px;   /* Cards, buttons */
--radius-lg: 12px;  /* Modals, large cards */
--radius-xl: 16px;  /* Hero sections */
--radius-full: 50%; /* Avatars, circular elements */
```

---

## 📄 Страницы (Pages)

### ✅ 1. Homepage (`/`)
**Статус:** ✅ Работает (Hero + Navigation)
**Файлы:**
- `pages/Homepage.tsx`
- `styles/homepage.css`

**Элементы:**
- ✅ Hero section с gradient background
- ✅ Navigation menu (Dashboard, Whales, Transactions, etc.)
- ✅ Live indicator (зеленая точка "Live")
- ✅ Search bar (дизайн готов)
- 🎨 Quick stats cards (не подключены к API)
- 🎨 Recent activity feed (mock данные)
- 🎨 Featured collections carousel (нет функционала)

**TODO:**
- Подключить quick stats к real-time API
- Добавить recent transactions из blockchain
- Implement collections carousel

---

### ✅ 2. Dashboard (`/dashboard`)
**Статус:** ⚠️ Частично работает (метрики работают, графики mock)
**Файлы:**
- `pages/Dashboard.tsx`
- `styles/dashboard.css`

**Работающие элементы:**
- ✅ **Metric Cards** (4 карточки):
  - 24h Transfers: ✅ Real data (564 events)
  - Total Volume: ⚠️ Limited (0.00 ETH - Alchemy limitation)
  - Unique Buyers: ✅ Real (247 addresses)
  - Unique Sellers: ✅ Real (236 addresses)
- ✅ Quick stats section (Whales, Total Holders)

**Дизайн готов, не подключен:**
- 🎨 **Holder Distribution Pie Chart** - красивый дизайн, mock данные
- 🎨 **Activity Trend Line Chart** - градиент, анимации, но mock
- 🎨 **Top Holders Bar Chart** - horizontal bars, но mock
- 🎨 **Historical Trend Chart** - multi-line chart, mock
- 🎨 Real-time updates badge (мигающий индикатор)

**TODO:**
- Подключить графики к real blockchain data
- Добавить real-time WebSocket updates
- Интегрировать historical data (требует хранилище)

---

### ✅ 3. Whales (`/whales`)
**Статус:** ✅ Полностью работает!
**Файлы:**
- `pages/WhaleList.tsx`
- `components/WhaleCard.tsx`
- `components/WhaleFilters.tsx`
- `styles/whale-cards.css`

**Работающие элементы:**
- ✅ **WhaleCard** (ATLAS design):
  - Rank badges (золото #1, серебро #2, бронза #3)
  - Gradient avatars (на основе hash адреса)
  - **Identity badges** (ENS, Twitter, labels) ← NEW!
  - 3-column метрики (NFTs Held, Est. Value, ETH Balance)
  - Progress bar (% of collection)
  - Expandable section (Token IDs, whale stats)
  - Etherscan + OpenSea links
- ✅ **Whale tags**: 🐋 Mega Whale, 🐋 Whale, 🐳 Big Fish
- ✅ **Filters** (дизайн готов):
  - Search by address (работает)
  - Sort by holdings (работает)
  - Filter by whale size (работает)
- ✅ Top-50 list с пагинацией

**Недостающие элементы:**
- 🎨 Advanced filters (по ETH balance, activity date)
- 🎨 Export to CSV кнопка (есть в дизайне)
- 🎨 Whale alerts setup (есть UI, нет функционала)

---

### ✅ 4. Mutant Finder (`/mutant-finder`)
**Статус:** ✅ Работает (Image Search + Owner Lookup)
**Файлы:**
- `pages/MutantFinder.tsx`
- `styles/image-search.css`

**Работающие элементы:**
- ✅ **Image Upload**:
  - Drag & drop zone (красивая animated граница)
  - File picker button
  - Image preview
- ✅ **Search Results**:
  - Top-5 matches с similarity scores
  - NFT metadata cards (traits, rarity)
  - Owner information (ENS, Twitter если есть)
- ✅ **Find Exact Owner** button (NEW!)
  - Blockchain owner lookup
  - ENS resolution
  - Links to OpenSea, Etherscan

**Дизайн элементы:**
- ✅ Gradient borders на upload zone
- ✅ Similarity progress bars
- ✅ Trait badges с colors
- ✅ Loading states с skeleton screens

**Недостающие элементы:**
- 🎨 NFT history timeline (дизайн есть, нет API)
- 🎨 Similar NFTs carousel (требует expanded index)
- 🎨 Share results кнопка

---

### 🎨 5. AI Insights (`/ai-insights`)
**Статус:** 🎨 Дизайн полностью готов, функционал mock
**Файлы:**
- `pages/AIInsights.tsx`
- `styles/ai-insights.css`

**Дизайн элементы:**
- 🎨 **AI Chat Interface**:
  - Gradient chat bubbles (AI vs User)
  - Typing indicator (3 dots animation)
  - Quick question buttons
  - Auto-scroll to latest message
- 🎨 **Predictive Signals Panel**:
  - Signal cards (Whale Accumulation, Floor Support, etc.)
  - Confidence meters (gradient progress bars)
  - Risk indicators (High/Medium/Low)
  - Time-based predictions
- 🎨 **Insights Cards**:
  - Price predictions
  - Volume forecasts
  - Holder growth trends
  - Sentiment analysis

**Mock функционал:**
- Hardcoded AI responses (setTimeout симуляция)
- Статичные prediction данные
- No real ML/AI backend

**TODO для продакшена:**
- Интегрировать OpenAI API или Claude API
- Подключить к blockchain data для context
- Real-time sentiment analysis (Twitter, Discord)
- Historical pattern recognition

---

### 🎨 6. Alerts (`/alerts`)
**Статус:** 🎨 Дизайн готов, backend alerts не подключен
**Файлы:**
- `pages/Alerts.tsx`
- `styles/alerts.css`

**Дизайн элементы:**
- 🎨 **Alert Rules Panel**:
  - Rule cards (Whale Movement, Large Sale, Floor Price)
  - Toggle switches (красивые animated)
  - Threshold inputs (styled number inputs)
  - Notification channels (Email, Telegram, Discord icons)
- 🎨 **Recent Alerts Feed**:
  - Alert cards с timestamps
  - Color-coded severity (High: red, Medium: orange, Low: blue)
  - Quick actions (View, Dismiss, Snooze)
  - Read/Unread states
- 🎨 **Alert Settings**:
  - Notification preferences
  - Quiet hours toggle
  - Alert frequency slider

**Backend готов, но не интегрирован:**
- Backend API endpoints существуют (`/api/alerts/*`)
- WebSocket events для real-time alerts
- Нужно только подключить к UI

**TODO:**
- Connect alert rules to backend API
- Implement WebSocket listener
- Add toast notifications для live alerts
- Telegram bot integration для mobile notifications

---

### 🎨 7. Portfolio Analyzer (`/portfolio-analyzer`)
**Статус:** 🎨 Дизайн готов, enrichment API не активен
**Файлы:**
- `pages/PortfolioAnalyzer.tsx`

**Дизайн элементы:**
- 🎨 **Wallet Input**:
  - Address search bar (ENS support styled)
  - Connect Wallet button (WalletConnect UI)
  - Recent wallets chips
- 🎨 **Portfolio Overview**:
  - Total value card (ETH + USD)
  - Collection count badge
  - NFT count badge
  - P&L indicator (green/red gradient)
- 🎨 **Holdings Table**:
  - Collection rows (logo, name, count, floor, value)
  - Sortable columns (красивые arrows)
  - Expandable rows для token IDs
  - Rarity indicators
- 🎨 **Charts**:
  - Portfolio allocation pie chart
  - Value over time line chart
  - Collection performance bars

**Backend готов:**
- EnrichmentService существует
- `/api/whales/portfolio/:address` endpoint работает
- Alchemy SDK интегрирован

**TODO:**
- Подключить UI к enrichment API
- Add WalletConnect integration
- Implement portfolio caching
- Historical tracking (требует DB)

---

### 🎨 8. Flip Calculator (`/flip-calculator`)
**Статус:** ⚠️ Базовый функционал работает, advanced features mock
**Файлы:**
- `pages/FlipCalculator.tsx`

**Работающие элементы:**
- ✅ Basic calculator (buy price, sell price, profit calc)
- ✅ Gas fee estimation
- ✅ Marketplace fee calc (OpenSea 2.5%)

**Дизайн элементы (не подключены):**
- 🎨 **Advanced Mode Toggle**:
  - Multiple scenarios side-by-side
  - Holding period calculator
  - Tax implications (styled info cards)
- 🎨 **Market Analysis Panel**:
  - Floor price chart (30 days)
  - Volume trends
  - Optimal exit predictions
- 🎨 **ROI Visualization**:
  - Profit curve chart
  - Break-even timeline
  - Risk/reward meter

**TODO:**
- Historical price data integration
- Market trends от OpenSea API
- Tax calculator logic

---

### 🎨 9. Transactions (`/transactions`)
**Статус:** 🎨 Дизайн есть, страница не создана
**Файлы:** Не существует (только в навигации)

**Планируемые элементы:**
- 🎨 **Transaction Table**:
  - Tx hash, from, to, token ID, price, time
  - Type badges (Sale, Transfer, Mint)
  - Sortable & filterable
  - Pagination (infinite scroll styled)
- 🎨 **Filters**:
  - Date range picker (красивый calendar)
  - Transaction type chips
  - Price range slider
  - Address search

**TODO:**
- Создать страницу Transactions.tsx
- Подключить к blockchain Transfer events
- Add real-time updates via WebSocket

---

## 🧩 UI Components (Reusable)

### ✅ Identity Components (NEW!)

#### WalletIdentityBadge
**Статус:** ✅ Полностью работает
**Файл:** `components/identity/WalletIdentityBadge.tsx`

**Features:**
- ✅ Gradient avatars (hash-based colors)
- ✅ Display modes: full, compact, minimal
- ✅ ENS name display
- ✅ Twitter handle (@username)
- ✅ Labels (whale, mega_whale, known_collector)
- ✅ Identity score badge (verified checkmark for 80+)
- ✅ Skeleton loading state
- ✅ Auto-fetch identity data

**Usage:**
```tsx
<WalletIdentityBadge
  address="0x020cA..."
  mode="compact"
  showSocials={true}
  showTooltip={true}
/>
```

---

#### IdentityTooltip
**Статус:** ✅ Полностью работает
**Файл:** `components/identity/IdentityTooltip.tsx`

**Features:**
- ✅ Hover activation
- ✅ Full identity profile:
  - Avatar + ENS + Display name
  - Identity score (color-coded)
  - Address (with copy button)
  - Social links (Twitter, Farcaster, Lens)
  - Labels badges
  - Data sources (ENS, Local DB, Web3.bio)
- ✅ "Resolved X ago" timestamp
- ✅ Dark theme with blur backdrop
- ✅ Arrow pointer to parent element

---

#### SocialLinks
**Статус:** ✅ Полностью работает
**Файл:** `components/identity/SocialLinks.tsx`

**Features:**
- ✅ Platform icons:
  - Twitter (hover: #1DA1F2 blue)
  - Farcaster (hover: #8A63D2 purple)
  - Lens (hover: #00501E green)
  - Website (hover: accent)
  - Etherscan (hover: #21325B navy)
- ✅ 3 sizes: small, medium, large
- ✅ SVG icons (crisp на всех размерах)
- ✅ Smooth hover animations

---

### ✅ Auth Modals (ATLAS Design)

#### LoginModal
**Статус:** ✅ Работает (JWT auth)
**Файл:** `components/auth/LoginModal.tsx`

**Features:**
- ✅ Email + Password inputs (styled)
- ✅ "Remember me" toggle (animated switch)
- ✅ Forgot password link
- ✅ Social login buttons (Google, Apple - UI only)
- ✅ Sign up redirect
- ✅ Error states (red border, shake animation)
- ✅ Success state (green checkmark)
- ✅ Loading spinner during auth

---

#### SignUpModal
**Статус:** 🎨 Дизайн готов, регистрация не работает
**Файл:** `components/auth/SignUpModal.tsx`

**Дизайн элементы:**
- 🎨 Full name, Email, Password inputs
- 🎨 Password strength meter (gradient bar)
- 🎨 Terms & Privacy checkboxes (styled)
- 🎨 Email verification flow (OTP modal redirect)
- 🎨 Success animation (confetti effect)

**TODO:**
- Backend registration endpoint
- Email verification system
- Password strength validation

---

#### OTPModal
**Статус:** 🎨 Дизайн готов, OTP не работает
**Файл:** `components/auth/OTPModal.tsx`

**Дизайн элементы:**
- 🎨 6-digit OTP input (отдельные boxes)
- 🎨 Auto-focus next box при вводе
- 🎨 Resend code button (с countdown timer)
- 🎨 Success checkmark animation
- 🎨 Error shake animation

**TODO:**
- Email OTP backend (NodeMailer)
- SMS OTP integration (Twilio)
- Rate limiting

---

#### ResetPasswordModal
**Статус:** 🎨 Дизайн готов, reset не работает
**Файл:** `components/auth/ResetPasswordModal.tsx`

**Дизайн элементы:**
- 🎨 Email input
- 🎨 New password + Confirm password
- 🎨 Password requirements checklist (8 chars, number, special)
- 🎨 Success message с redirect

**TODO:**
- Password reset token backend
- Email with reset link
- Token expiration logic

---

#### SuccessModal
**Статус:** ✅ Работает (generic success modal)
**Файл:** `components/auth/SuccessModal.tsx`

**Features:**
- ✅ Checkmark icon (animated)
- ✅ Custom title & message
- ✅ Auto-close после N секунд
- ✅ Manual close button
- ✅ Confetti animation (optional)

---

### ✅ Базовые UI Components

#### Button
**Статус:** ✅ Полностью работает
**Файл:** `components/ui/Button.tsx`

**Variants:**
- ✅ Primary (gold gradient)
- ✅ Secondary (outline)
- ✅ Danger (red)
- ✅ Ghost (transparent)

**Sizes:**
- ✅ sm, md, lg, xl

**States:**
- ✅ Loading (spinner inside)
- ✅ Disabled (opacity 50%)
- ✅ Icon support (left/right)

---

#### Card
**Статус:** ✅ Работает
**Файл:** `components/ui/Card.tsx`

**Features:**
- ✅ Padding variants (sm, md, lg)
- ✅ Hover state (background lightens)
- ✅ Border variants (none, subtle, bold)
- ✅ Click handler support

---

#### Input
**Статус:** ✅ Работает
**Файл:** `components/ui/Input.tsx`

**Features:**
- ✅ Text, email, password, number types
- ✅ Prefix/suffix icons
- ✅ Error state (red border)
- ✅ Success state (green border)
- ✅ Helper text below
- ✅ Character counter

---

#### Modal
**Статус:** ✅ Работает
**Файл:** `components/ui/Modal.tsx`

**Features:**
- ✅ Backdrop blur (dark overlay)
- ✅ Center positioning
- ✅ Close button (X in corner)
- ✅ ESC key to close
- ✅ Click outside to close (optional)
- ✅ Fade-in animation
- ✅ Size variants (sm, md, lg, xl, full)

---

#### SystemModal
**Статус:** 🎨 Дизайн готов, не используется
**Файл:** `components/ui/SystemModal.tsx`

**Назначение:** Модалки для системных сообщений (payment, integration confirmations)

**Дизайн элементы:**
- 🎨 Icon types (success, error, warning, info)
- 🎨 Action buttons (primary + secondary)
- 🎨 Dismissible (auto-close option)
- 🎨 Custom content slot

**TODO:**
- Use for payment confirmations
- Integration setup flows
- System notifications

---

#### Badge
**Статус:** ✅ Работает
**Файл:** `components/ui/Badge.tsx`

**Variants:**
- ✅ Default (gray)
- ✅ Success (green)
- ✅ Warning (orange)
- ✅ Danger (red)
- ✅ Info (blue)
- ✅ Gold (accent)

**Sizes:**
- ✅ sm, md, lg

---

#### Toggle
**Статус:** ✅ Работает
**Файл:** `components/ui/Toggle.tsx`

**Features:**
- ✅ Smooth slide animation
- ✅ Color change (gray → gold)
- ✅ Disabled state
- ✅ Label support (left/right)
- ✅ onChange callback

---

#### Select
**Статус:** ✅ Работает
**Файл:** `components/ui/Select.tsx`

**Features:**
- ✅ Dropdown menu (styled)
- ✅ Search/filter options
- ✅ Multi-select mode
- ✅ Custom option rendering
- ✅ Placeholder text
- ✅ Error states

---

#### Toast
**Статус:** 🎨 Дизайн готов, не подключен к events
**Файл:** `components/ui/Toast.tsx`

**Дизайн элементы:**
- 🎨 Toast container (top-right corner)
- 🎨 Types: success, error, warning, info
- 🎨 Auto-dismiss после 5 sec
- 🎨 Progress bar (depleting timer)
- 🎨 Stack multiple toasts
- 🎨 Swipe to dismiss (mobile)

**TODO:**
- Global toast context
- Trigger from anywhere в app
- Integrate с API errors/success

---

### 🎨 Layout Components

#### Navigation
**Статус:** ✅ Работает (routing)
**Файл:** `components/Navigation.tsx`

**Features:**
- ✅ Horizontal nav bar
- ✅ Active route highlighting (gold underline)
- ✅ Hover states
- ✅ Logo link to home
- ✅ Responsive (hamburger menu на mobile - дизайн готов)

**Недостающее:**
- 🎨 Mobile hamburger menu (не активен)
- 🎨 User profile dropdown (есть UI, нет функционала)

---

#### Sidebar
**Статус:** ⚠️ Существует, но не используется
**Файл:** `components/Sidebar.tsx`

**Дизайн элементы:**
- 🎨 Collapsible sidebar (slide in/out)
- 🎨 Icon + text menu items
- 🎨 Nested menu support
- 🎨 Active route indicator (vertical gold bar)
- 🎨 Width toggle button

**TODO:**
- Decide: horizontal nav OR sidebar (не оба)
- Если sidebar: подключить к routing

---

#### Topbar
**Статус:** ✅ Частично работает
**Файл:** `components/Topbar.tsx`

**Работает:**
- ✅ Logo + brand name
- ✅ Live indicator
- ✅ User menu (login/logout)

**Дизайн готов, не подключен:**
- 🎨 Notifications bell (icon с badge count)
- 🎨 Search bar (global search)
- 🎨 Network status indicator (green dot + "Mainnet")
- 🎨 Settings icon (dropdown menu)

---

#### Footer
**Статус:** ✅ Работает
**Файл:** `components/Footer.tsx`

**Features:**
- ✅ Links (About, Twitter, Discord, Docs)
- ✅ Copyright text
- ✅ API status indicator (from /health endpoint)

---

### 📊 Chart Components

#### LineChart
**Статус:** 🎨 Дизайн готов, mock данные
**Файл:** `components/chartjs/LineChart.tsx`

**Дизайн элементы:**
- 🎨 Gradient fill под линией
- 🎨 Smooth curves (tension)
- 🎨 Hover tooltips (custom styled)
- 🎨 Grid lines (subtle gray)
- 🎨 Responsive (canvas auto-resize)

**Используется в:**
- Dashboard (Activity Trend)
- Portfolio Analyzer (Value over time)

**TODO:**
- Подключить к real time-series data
- WebSocket updates для live charts

---

#### BarChart
**Статус:** 🎨 Дизайн готов, mock данные
**Файл:** `components/chartjs/BarChart.tsx`

**Дизайн элементы:**
- 🎨 Horizontal/Vertical modes
- 🎨 Gradient bars (gold gradient)
- 🎨 Rounded corners
- 🎨 Value labels on bars
- 🎨 Stacked mode support

**Используется в:**
- Dashboard (Top Holders)
- Portfolio (Collection performance)

**TODO:**
- Real whale data
- Sortable/filterable

---

#### PieChart & DoughnutChart
**Статус:** 🎨 Дизайн готов, mock данные
**Файлы:**
- `components/chartjs/PieChart.tsx`
- `components/chartjs/DoughnutChart.tsx`

**Дизайн элементы:**
- 🎨 Color-coded segments
- 🎨 Center text (total value)
- 🎨 Hover effects (segment expand)
- 🎨 Legend (custom styled)
- 🎨 Percentage labels

**Используется в:**
- Dashboard (Holder Distribution)
- Portfolio (Allocation)

**TODO:**
- Real distribution data
- Interactive segment clicks

---

#### HolderDistributionPieChart
**Статус:** 🎨 Специализированный, mock данные
**Файл:** `components/charts/HolderDistributionPieChart.tsx`

**Дизайн элементы:**
- 🎨 5 категорий: single, small, medium, large, whales
- 🎨 Color scheme: blue → gold gradient
- 🎨 Click segment → filter table
- 🎨 Animated transitions

**TODO:**
- Connect to real distribution from `/api/whales/analytics`

---

#### ActivityTrendChart
**Статус:** 🎨 Специализированный, mock данные
**Файл:** `components/charts/ActivityTrendChart.tsx`

**Дизайн элементы:**
- 🎨 Multi-line (Transfers, Sales, Mints)
- 🎨 Different colors per line
- 🎨 Area fill (semi-transparent)
- 🎨 Time period selector (24h, 7d, 30d, All)

**TODO:**
- Historical blockchain data (requires DB)
- Real-time updates

---

#### TraitRarityChart
**Статус:** 🎨 Дизайн готов, нет данных
**Файл:** `components/charts/TraitRarityChart.tsx`

**Назначение:** Показать rarity distribution для NFT traits

**Дизайн элементы:**
- 🎨 Radar chart для trait categories
- 🎨 Color-coded rarity levels
- 🎨 Hover для trait details

**TODO:**
- Metadata indexing для traits
- Rarity score calculation
- Integration with Mutant Finder

---

### 🔄 Loading & States

#### LoadingSpinner
**Статус:** ✅ Работает
**Файл:** `components/LoadingSpinner.tsx`

**Features:**
- ✅ 3 sizes (sm, md, lg)
- ✅ Gold spinner (rotating circle)
- ✅ Text label support
- ✅ Inline or fullscreen modes

---

#### Skeleton Screens
**Статус:** ✅ Работает в WalletIdentityBadge
**Расположение:** Inline в компонентах

**Features:**
- ✅ Gradient animation (shimmer effect)
- ✅ Matches content shape
- ✅ Smooth transition to content

**TODO:**
- Создать reusable Skeleton components
- Add to all async-loaded sections

---

#### RealtimeIndicator
**Статус:** ⚠️ Есть компонент, WebSocket не active
**Файл:** `components/RealtimeIndicator.tsx`

**Дизайн элементы:**
- 🎨 Pulsing green dot
- 🎨 "Live" text
- 🎨 Tooltip (показывает last update time)
- 🎨 Reconnecting state (yellow pulse)
- 🎨 Disconnected state (red dot)

**TODO:**
- Подключить к WebSocket connection state
- Show live data flow

---

## 🎨 Advanced Features (Design Ready)

### Whale Filters Panel
**Статус:** ⚠️ Basic работает, advanced не подключен
**Файл:** `components/WhaleFilters.tsx`

**Работает:**
- ✅ Search by address
- ✅ Sort dropdown (by holdings, value, recent)

**Дизайн готов:**
- 🎨 Multi-select tags (mega whale, whale, big fish)
- 🎨 ETH balance range slider (dual thumb)
- 🎨 Last activity date picker
- 🎨 NFT count range inputs
- 🎨 "Apply Filters" + "Clear All" buttons
- 🎨 Active filters chips (removable)

**TODO:**
- Implement client-side filtering
- Server-side filtering API params

---

### Recent Transactions Feed
**Статус:** 🎨 Дизайн есть, нет страницы
**Файл:** `components/RecentTransactions.tsx`

**Дизайн элементы:**
- 🎨 Transaction cards (compact):
  - Token thumbnail
  - Type badge (Sale, Transfer, Mint)
  - From → To addresses (ENS если есть)
  - Price (ETH + USD)
  - Time ago
- 🎨 Infinite scroll
- 🎨 Auto-refresh indicator
- 🎨 Click to expand (full tx details)

**TODO:**
- Fetch from blockchain Transfer events
- WebSocket для live updates
- Transaction details modal

---

### Search Bar (Global)
**Статус:** 🎨 Дизайн готов, поиск limited
**Файл:** `components/SearchBar.tsx`

**Дизайн элементы:**
- 🎨 Unified search input:
  - Address (ENS или 0x...)
  - Token ID (#1234)
  - Transaction hash
  - Collection name
- 🎨 Auto-complete dropdown:
  - Recent searches
  - Suggested results
  - Type icons (wallet, NFT, tx)
- 🎨 Keyboard shortcuts (Cmd+K для focus)

**Работает:**
- ✅ Address search на Whales page

**TODO:**
- Global search context
- Multi-type result parsing
- Search history persistence

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
--mobile: 320px;
--mobile-lg: 425px;
--tablet: 768px;
--desktop: 1024px;
--desktop-lg: 1440px;
--desktop-xl: 1920px;
```

### Mobile Adaptations

**Homepage:**
- ✅ Stack hero content vertically
- ✅ Collapse navigation to hamburger (дизайн готов)
- 🎨 Simplified quick stats (2 columns → 1 column)

**Dashboard:**
- ✅ Metric cards (4 columns → 2 columns → 1 column)
- ⚠️ Charts resize (работает, но legend может overlap)
- 🎨 Hide secondary metrics на очень маленьких экранах

**Whales:**
- ✅ WhaleCard adapts (compact metrics на mobile)
- ✅ Filters collapse to bottom sheet (дизайн есть)
- 🎨 Table view → Card view toggle

**Mutant Finder:**
- ✅ Upload zone shrinks gracefully
- ✅ Results stack vertically
- 🎨 Side-by-side comparisons → vertical

**TODO:**
- Test на реальных устройствах (iPhone, iPad, Android)
- Improve touch targets (44px minimum)
- Swipe gestures для modals/sidebars

---

## 🌈 Animations & Transitions

### Implemented
- ✅ Fade-in для modals (0.2s ease)
- ✅ Slide-in для sidebars (0.3s ease-out)
- ✅ Button hover (scale 1.05, 0.15s)
- ✅ Card hover (background lighten, border glow)
- ✅ Toggle switch slide (0.2s cubic-bezier)
- ✅ Spinner rotation (1s linear infinite)
- ✅ Skeleton shimmer (1.5s ease-in-out infinite)
- ✅ Live indicator pulse (2s ease-in-out infinite)

### Planned (Дизайн готов)
- 🎨 Page transitions (route changes)
- 🎨 List item stagger (children animate in sequence)
- 🎨 Chart data transitions (smooth value updates)
- 🎨 Confetti на success actions
- 🎨 Shake на errors (form validation)
- 🎨 Toast slide-in (from edge)

---

## 🎯 Design Patterns (ATLAS)

### Cards
```css
/* Standard card */
.card {
  background: var(--card);
  border: 1px solid var(--border2);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  transition: all 0.2s ease;
}

.card:hover {
  background: var(--card-h);
  border-color: var(--border1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

### Buttons
```css
/* Primary button */
.btn-primary {
  background: linear-gradient(135deg, var(--gold), #ff8c42);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 166, 35, 0.4);
}
```

### Badges
```css
/* Rank badge (gold) */
.rank-badge {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #1A1F3A;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

### Inputs
```css
/* Styled input */
.input {
  background: var(--card);
  border: 1px solid var(--border1);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  color: var(--t1);
  font-size: var(--text-base);
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.1);
}

.input.error {
  border-color: var(--no);
}
```

---

## 📋 Implementation Priority

### High Priority (Максимальная ценность)
1. ✅ ~~Identity System~~ (DONE - commit 8bcb65a)
2. 🔄 **Alerts System** - backend готов, нужно подключить UI
3. 🔄 **Real-time Charts** - данные есть, нужно подключить к графикам
4. 🔄 **Toast Notifications** - компонент готов, нужен global context
5. 🔄 **Portfolio Analyzer** - API готов, нужно подключить UI

### Medium Priority
6. 🎨 AI Insights - требует AI backend (OpenAI/Claude)
7. 🎨 Transaction Page - создать страницу, подключить к Transfer events
8. 🎨 Advanced Whale Filters - client-side filtering
9. 🎨 Mobile Navigation - активировать hamburger menu
10. 🎨 Search History - persistence в localStorage

### Low Priority
11. 🎨 Payment Modals (SystemModal) - когда будет monetization
12. 🎨 Integration Flows - для third-party connections
13. 🎨 Trait Rarity Chart - требует metadata indexing
14. 🎨 Historical Charts - требует persistent storage
15. 🎨 Confetti Animations - nice-to-have polish

---

## 🛠️ Development Guide

### Как подключить готовый дизайн к функционалу:

**Пример: Alerts Page**

1. **Backend уже готов:**
   ```typescript
   // API endpoints exist
   GET /api/alerts/rules
   POST /api/alerts/rules
   PUT /api/alerts/rules/:id
   DELETE /api/alerts/rules/:id
   GET /api/alerts/history
   ```

2. **Дизайн уже есть:**
   ```tsx
   // pages/Alerts.tsx существует с UI
   // Все toggles, inputs, cards ready
   ```

3. **Что нужно сделать:**
   ```typescript
   // 1. Создать API client
   const alertsAPI = {
     getRules: () => axios.get('/api/alerts/rules'),
     createRule: (rule) => axios.post('/api/alerts/rules', rule),
     // ...
   };

   // 2. Заменить mock данные на real fetching
   const [rules, setRules] = useState([]);
   useEffect(() => {
     alertsAPI.getRules().then(data => setRules(data));
   }, []);

   // 3. Подключить toggle handlers
   const toggleRule = (ruleId, enabled) => {
     alertsAPI.updateRule(ruleId, { enabled })
       .then(() => fetchRules());
   };
   ```

4. **Добавить WebSocket:**
   ```typescript
   useEffect(() => {
     const ws = new WebSocket('ws://localhost:6255');
     ws.onmessage = (event) => {
       const alert = JSON.parse(event.data);
       showToast(alert.message, 'warning');
     };
   }, []);
   ```

---

## 🎨 Design Assets

### Icons & Illustrations
**Расположение:** `frontend/public/assets/`

**Что есть:**
- ✅ Logo (SVG, PNG)
- ✅ Social icons (Twitter, Discord, Telegram)
- ✅ Placeholder avatars
- 🎨 Hero illustrations (нужно добавить)
- 🎨 Empty states graphics (нужно добавить)

### Fonts
**Подключены через Google Fonts:**
- Outfit (400, 500, 600, 700, 800)
- DM Sans (400, 500, 600)
- JetBrains Mono (400, 500)

### CSS Variables
**Файл:** `styles/design-system.css`

Полный набор переменных для:
- Colors (16+ оттенков)
- Spacing (scale от 4px до 80px)
- Typography (sizes, weights, line-heights)
- Borders & Shadows
- Z-index layers

---

## 📊 Metrics & KPIs

### Design Coverage
- **Pages:** 44% полностью работают (4/9)
- **Components:** 60% работают (12/20)
- **Modals:** 17% работают (1/6)
- **Charts:** 22% работают (2/9)

### Code Quality
- TypeScript coverage: ~95%
- CSS organization: Modular (per-component)
- Reusable components: 20+ shared components
- Design tokens: Centralized в design-system.css

### Performance
- Bundle size: ~850KB (можно оптимизировать)
- First paint: <1s (local)
- Lighthouse score: TBD (нужно замерить)

---

## 🚀 Next Steps

1. **Подключить Alerts UI** к backend API
2. **Интегрировать Portfolio Analyzer** с enrichment API
3. **Добавить Toast notifications** для global events
4. **Создать Transaction page** с real-time updates
5. **Активировать mobile hamburger menu**
6. **Подключить charts** к real blockchain data
7. **AI Insights** - integrate OpenAI/Claude API
8. **SignUp flow** - complete registration backend
9. **Payment modals** - when monetization ready
10. **Historical data** - implement persistent storage

---

**Последнее обновление:** 2026-02-10
**Автор:** Claude Sonnet 4.5
**Версия:** 1.0

---

## 📞 Как использовать этот документ

**Для разработчиков:**
- Используй как checklist для implementation
- Смотри статусы (✅ работает, 🎨 дизайн готов)
- Приоритизируй по "High Priority" списку

**Для дизайнеров:**
- Видишь все реализованные паттерны
- Можешь update дизайн элементов
- Координируешь с разработкой

**Для PM:**
- Трекай feature completion
- Планируй sprints по priority
- Видишь dependencies (что требует backend/frontend)

**Для QA:**
- Знаешь какие features тестировать
- Видишь mock vs real data
- Можешь validate против design specs
