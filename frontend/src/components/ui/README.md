# 🎨 ATLAS UI Component Library

Полная библиотека базовых компонентов для MAYC Whale Tracker, следующих дизайн-системе ATLAS.

---

## 📦 Установленные Компоненты

### Form Components (Формы)
1. **Button** - Кнопки (primary, ghost, outline, danger)
2. **Input** - Текстовые поля с валидацией
3. **Select** - Кастомный dropdown с поиском
4. **Toggle** - Switch переключатели

### Layout Components (Разметка)
5. **Card** - Карточки (default, stat, feature, elevated)
6. **Modal** - Модальные окна

### Feedback Components (Обратная связь)
7. **Badge** - Бейджи и теги
8. **Toast** - Уведомления

---

## 🚀 Использование

### Импорт компонентов

```tsx
import {
  Button,
  Input,
  Select,
  Toggle,
  Card,
  Modal,
  Badge,
  Toast,
  ToastContainer
} from '@/components/ui';
```

---

## 📚 Примеры

### 1. Button (Кнопка)

```tsx
// Primary кнопка (золотая)
<Button variant="primary" size="lg">
  Launch App
</Button>

// Ghost кнопка (прозрачная с границей)
<Button variant="ghost" onClick={handleClick}>
  Cancel
</Button>

// Danger кнопка (красная)
<Button variant="danger" icon={<TrashIcon />}>
  Delete
</Button>

// С loading состоянием
<Button variant="primary" loading={isLoading}>
  Saving...
</Button>

// С иконками
<Button
  variant="primary"
  icon={<SearchIcon />}
  iconRight={<ArrowIcon />}
>
  Search
</Button>
```

**Props:**
- `variant`: 'primary' | 'ghost' | 'outline' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `fullWidth`: boolean
- `icon`, `iconRight`: React.ReactNode
- Все стандартные HTML button props

---

### 2. Input (Текстовое поле)

```tsx
// Простой input
<Input
  placeholder="Enter wallet address..."
  value={address}
  onChange={(e) => setAddress(e.target.value)}
/>

// С label и error
<Input
  label="Wallet Address"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
  error={errors.address}
  helperText="Enter a valid Ethereum address"
/>

// С иконками
<Input
  icon={<SearchIcon />}
  placeholder="Search NFTs..."
  iconRight={<ClearIcon />}
/>

// Success состояние
<Input
  label="Token ID"
  value={tokenId}
  onChange={(e) => setTokenId(e.target.value)}
  success={isValid}
/>

// Размеры
<Input inputSize="lg" placeholder="Large input" />
<Input inputSize="sm" placeholder="Small input" />
```

**Props:**
- `label`: string
- `error`: string (сообщение об ошибке)
- `helperText`: string
- `success`: boolean
- `icon`, `iconRight`: React.ReactNode
- `inputSize`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- Все стандартные HTML input props

---

### 3. Select (Dropdown)

```tsx
const options = [
  { value: 'mayc', label: 'MAYC', icon: <MaycIcon /> },
  { value: 'bayc', label: 'BAYC', icon: <BaycIcon /> },
  { value: 'azuki', label: 'Azuki', disabled: true },
];

// Простой select
<Select
  options={options}
  value={collection}
  onChange={setCollection}
  placeholder="Choose collection..."
/>

// С поиском
<Select
  options={options}
  value={collection}
  onChange={setCollection}
  searchable
  label="Collection"
/>

// С error
<Select
  options={options}
  value={collection}
  onChange={setCollection}
  error="Please select a collection"
/>

// Размеры
<Select options={options} value={value} onChange={setValue} size="lg" />
```

**Props:**
- `options`: SelectOption[] (value, label, disabled?, icon?)
- `value`: string
- `onChange`: (value: string) => void
- `placeholder`: string
- `searchable`: boolean
- `disabled`: boolean
- `error`: string
- `label`: string
- `fullWidth`: boolean
- `size`: 'sm' | 'md' | 'lg'

---

### 4. Toggle (Switch)

```tsx
// Простой toggle
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
/>

// С label
<Toggle
  checked={notifications}
  onChange={setNotifications}
  label="Enable notifications"
  labelPosition="right"
/>

// Размеры
<Toggle checked={value} onChange={setValue} size="sm" />
<Toggle checked={value} onChange={setValue} size="lg" />

// Disabled
<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  disabled
  label="Premium feature"
/>
```

**Props:**
- `checked`: boolean
- `onChange`: (checked: boolean) => void
- `label`: string
- `labelPosition`: 'left' | 'right'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean

---

### 5. Card (Карточка)

```tsx
// Простая карточка
<Card>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>

// Feature карточка с акцентом
<Card
  variant="feature"
  accentColor="gold"
  hover="lift"
>
  <h3>Premium Feature</h3>
  <p>Description...</p>
</Card>

// Stat карточка (для метрик)
<Card variant="stat" padding="md">
  <div className="stat-large">1,234</div>
  <div className="text-text-3">Total Whales</div>
</Card>

// Карточка с rank glow (для топ-3)
<Card rankGlow={1} hover="glow">
  <Badge variant="rank" rank={1}>1</Badge>
  <h3>Top Whale</h3>
</Card>

// Без padding
<Card padding="none">
  <img src="..." alt="NFT" />
</Card>
```

**Props:**
- `variant`: 'default' | 'stat' | 'feature' | 'elevated'
- `hover`: 'lift' | 'glow' | 'none'
- `accentColor`: 'gold' | 'cyan' | 'blue' | 'success' | 'error' | 'none'
- `rankGlow`: 1 | 2 | 3 | null
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `border`: boolean

---

### 6. Modal (Модальное окно)

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Are you sure you want to continue?</p>
</Modal>

// Большая модалка без footer
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Whale Details"
  size="xl"
  showCloseButton
>
  <WhaleDetailsContent />
</Modal>

// Без закрытия по backdrop
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  closeOnBackdrop={false}
>
  <ImportantForm />
</Modal>
```

**Props:**
- `open`: boolean
- `onClose`: () => void
- `title`: string
- `children`: React.ReactNode
- `footer`: React.ReactNode
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnBackdrop`: boolean (default: true)
- `showCloseButton`: boolean (default: true)

**Особенности:**
- ESC закрывает модалку
- Блокирует скролл body
- Backdrop blur + анимация появления
- Keyboard accessible

---

### 7. Badge (Бейдж)

```tsx
// Transaction badges
<Badge variant="success">Buy</Badge>
<Badge variant="error">Sell</Badge>
<Badge variant="mint">Mint</Badge>
<Badge variant="transfer">Transfer</Badge>

// Status badges
<Badge variant="gold">Whale</Badge>
<Badge variant="warning">Pending</Badge>

// Rank badges (топ-3)
<Badge variant="rank" rank={1}>1</Badge>
<Badge variant="rank" rank={2}>2</Badge>
<Badge variant="rank" rank={3}>3</Badge>

// Размеры и формы
<Badge size="sm" shape="pill">Live</Badge>
<Badge size="lg" shape="square">Featured</Badge>

// С иконкой
<Badge variant="success" icon={<CheckIcon />}>
  Verified
</Badge>
```

**Props:**
- `variant`: 'gold' | 'success' | 'error' | 'warning' | 'mint' | 'transfer' | 'neutral' | 'rank'
- `shape`: 'pill' | 'square'
- `size`: 'sm' | 'md' | 'lg'
- `rank`: 1 | 2 | 3 | null (для rank badges)
- `icon`: React.ReactNode

---

### 8. Toast (Уведомление)

```tsx
// В корневом компоненте App.tsx:
import { ToastContainer } from '@/components/ui';

function App() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* Ваше приложение */}

      {/* Toast Container */}
      <ToastContainer position="top-right">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            duration={4000}
          />
        ))}
      </ToastContainer>
    </>
  );
}

// Использование:
showToast('Saved successfully!', 'success');
showToast('Something went wrong', 'error');
showToast('Processing...', 'info');
showToast('Be careful!', 'warning');

// Кастомная иконка
<Toast
  variant="success"
  message="NFT transferred!"
  icon={<NftIcon />}
  duration={5000}
  closable={true}
/>

// Позиции ToastContainer:
<ToastContainer position="top-right" />
<ToastContainer position="top-left" />
<ToastContainer position="bottom-right" />
<ToastContainer position="bottom-left" />
<ToastContainer position="top-center" />
<ToastContainer position="bottom-center" />
```

**Toast Props:**
- `message`: string
- `variant`: 'success' | 'error' | 'warning' | 'info'
- `duration`: number (ms, 0 = не закрывать)
- `closable`: boolean
- `onClose`: () => void
- `icon`: React.ReactNode

**ToastContainer Props:**
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
- `children`: React.ReactNode

---

## 🎨 Цветовые Варианты

### Статусы
- **success** - Зеленый (#34D399) - покупки, успех
- **error** - Красный (#FF6B6B) - продажи, ошибки
- **warning** - Желтый (#FBBF24) - предупреждения
- **info** - Нейтральный - информация

### Бренд
- **gold** - Золотой (#F5A623) - primary цвет
- **cyan** - Бирюзовый (#00D4AA)
- **blue** - Синий (#4E8EF7)

### Транзакции
- **mint** - Фиолетовый (#A78BFA)
- **transfer** - Голубой (#38BDF8)

### Rank
- **rank-1** - Золото (#F5A623)
- **rank-2** - Серебро (#C0C0C0)
- **rank-3** - Бронза (#CD7F32)

---

## 🔧 Кастомизация

Все компоненты используют CSS переменные из `design-system.css`. Вы можете переопределить их:

```tsx
// Inline styles с CSS переменными
<Card style={{ background: 'var(--card-h)' }}>
  Custom background
</Card>

// Tailwind классы с ATLAS токенами
<div className="bg-card border-border2 text-text-1">
  Custom div
</div>
```

---

## ♿ Accessibility

Все компоненты следуют WAI-ARIA стандартам:

- **Keyboard Navigation**: Tab, Enter, Escape, Arrow keys
- **ARIA Labels**: aria-label, aria-checked, role
- **Focus Management**: Правильный focus trap в Modal
- **Screen Reader**: Семантичные HTML теги

---

## 📊 Файловая Структура

```
src/components/ui/
├── Button.tsx          (162 строки)
├── Input.tsx           (151 строк)
├── Select.tsx          (247 строк)
├── Toggle.tsx          (103 строки)
├── Card.tsx            (117 строк)
├── Modal.tsx           (150 строк)
├── Badge.tsx           (134 строки)
├── Toast.tsx           (212 строк)
├── index.ts            (экспорты)
└── README.md           (эта документация)

Всего: ~1,300+ строк кода
```

---

## ✅ TypeScript Support

Все компоненты полностью типизированы:

```tsx
import type {
  ButtonProps,
  InputProps,
  SelectProps,
  ModalProps
} from '@/components/ui';

// Все props имеют автодополнение в IDE
<Button variant="primary" size="lg" />
```

---

## 🚀 Быстрый Старт

### 1. Форма с валидацией

```tsx
import { Input, Button, Toast } from '@/components/ui';

function MyForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.includes('@')) {
      setError('Invalid email');
      return;
    }
    // Submit...
  };

  return (
    <div>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
}
```

### 2. Confirmation Modal

```tsx
import { Modal, Button } from '@/components/ui';

function DeleteConfirmation({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete Whale"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </>
      }
    >
      <p>Are you sure you want to delete this whale?</p>
    </Modal>
  );
}
```

### 3. Settings Panel

```tsx
import { Toggle, Select, Card } from '@/components/ui';

function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('dark');

  return (
    <Card>
      <h3>Settings</h3>

      <Toggle
        checked={notifications}
        onChange={setNotifications}
        label="Enable notifications"
      />

      <Select
        label="Theme"
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' }
        ]}
        value={theme}
        onChange={setTheme}
      />
    </Card>
  );
}
```

---

## 📝 Changelog

### v1.0.0 (2026-02-08)
- ✅ Initial release
- ✅ 8 базовых компонентов
- ✅ TypeScript support
- ✅ ATLAS design system integration
- ✅ Accessibility compliance
- ✅ Полная документация

---

**Created by**: Claude Code
**Date**: 2026-02-08
**Design System**: ATLAS v1.0.0
**Project**: MAYC Whale Tracker
