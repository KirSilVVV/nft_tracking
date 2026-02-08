# Image Search Feature - Production Guide

## Overview
Reverse image search для MAYC NFT коллекции используя perceptual hashing (pHash).

## Quick Start (Development)

### Текущая реализация
- **Индексируется**: первые 200 NFT при первом запросе
- **Время первого поиска**: 30-60 секунд (построение индекса)
- **Последующие поиски**: мгновенные (кеш 24 часа)

### Как работает
1. Пользователь загружает изображение
2. Сервер генерирует perceptual hash (8x8 pHash)
3. Сравнение с индексом (Hamming distance)
4. Возврат топ-10 похожих NFT (similarity ≥ 70%)

## Production Setup

### Шаг 1: Pre-build полный индекс (офлайн)

```bash
cd backend
npx ts-node scripts/build-image-index.ts
```

**Параметры:**
- Total NFTs: 19,423
- Batch size: 10
- Delay: 200ms между батчами
- Estimated time: ~2-3 часа
- Output: `data/mayc-hash-index.json` (~1.2MB)

**Прогресс:**
```
🚀 Starting MAYC image hash index builder
📊 Total NFTs to index: 19423
⚙️  Batch size: 10
⏱️  Delay between batches: 200ms

✅ Progress: 100/19423 (0.5%)
   Failed: 2, Rate: 4.2 NFTs/sec, ETA: 76.3 min
...
🎉 Index build complete!
📁 Saved to: data/mayc-hash-index.json
✅ Successfully indexed: 19421 NFTs
❌ Failed: 2 NFTs
⏱️  Total time: 77.2 minutes
```

### Шаг 2: Деплой индекса

После построения индекса, файл `data/mayc-hash-index.json` должен быть:
1. Добавлен в git (или скопирован на prod сервер)
2. При старте сервера автоматически загружается в память
3. Кешируется на 24 часа

**Результат:**
- ✅ Первый поиск: < 2 секунды (вместо 60 сек)
- ✅ Все 19,423 NFT доступны для поиска
- ✅ Нет задержек при первом запросе

## API Endpoint

### POST /api/nft/search-by-image

**Request:**
```bash
curl -X POST http://localhost:6252/api/nft/search-by-image \
  -F "image=@path/to/mayc-image.png" \
  -F "limit=10" \
  -F "threshold=70"
```

**Parameters:**
- `image` (required): Image file (max 10MB, JPG/PNG/GIF/WebP)
- `limit` (optional): Max results, default 10
- `threshold` (optional): Min similarity %, default 70

**Response:**
```json
{
  "matches": [
    {
      "tokenId": 692,
      "name": "Mutant Ape Yacht Club #692",
      "image": "https://...",
      "similarity": 92.5,
      "hammingDistance": 6
    }
  ],
  "count": 10,
  "threshold": 70,
  "uploadedImageSize": 245678
}
```

## Performance Metrics

### Development (200 NFT sample)
- Index build time: 30-60 sec
- Search time: < 1 sec
- Memory usage: ~5 MB
- Cache TTL: 24 hours

### Production (19,423 NFT full index)
- Index build time: 2-3 hours (offline, one-time)
- Index load time: < 100ms (from file)
- Search time: < 2 sec
- Memory usage: ~30 MB
- File size: ~1.2 MB (JSON)

## Algorithm Details

### Perceptual Hash (pHash)
1. Resize image to 8x8 grayscale
2. Calculate average pixel value
3. Generate 64-bit binary hash (1 if pixel > avg, 0 otherwise)
4. Compare hashes using Hamming distance

### Similarity Calculation
```
similarity = (64 - hamming_distance) / 64 * 100%
```

- 0 distance = 100% identical
- 6 distance = 90.6% similar
- 19 distance = 70% similar (threshold)
- 64 distance = 0% similar (completely different)

## Troubleshooting

### "Search timeout" error
- **Причина**: Индекс строится при первом запросе
- **Решение**: Подождите 1 минуту и попробуйте снова, ИЛИ предварительно постройте индекс (см. Шаг 1)

### "No similar NFTs found"
- **Причина**: Загруженное изображение слишком отличается от коллекции
- **Решение**: Попробуйте другое изображение или уменьшите threshold до 60%

### Индекс не сохраняется
- **Причина**: Нет прав на запись в папку `data/`
- **Решение**: Создайте папку вручную: `mkdir -p backend/data`

## Future Improvements

1. **Database Storage**: Переместить индекс из JSON в PostgreSQL/MongoDB
2. **More Advanced Hashing**: Использовать DCT-based pHash вместо average hash
3. **GPU Acceleration**: Ускорить сравнение хешей на GPU для больших коллекций
4. **Incremental Updates**: Автоматически индексировать новые NFT
5. **Multi-Collection Support**: Поддержка других коллекций (BAYC, Azuki, etc.)
