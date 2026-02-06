# NFT Tracking Bot - Mutant Ape Yacht Club Analytics

Real-time Telegram bot for tracking and analyzing Mutant Ape Yacht Club (MAYC) NFT collection transactions on Ethereum.

## 🚀 Features

- **Top Holders Analysis**: Identify the largest NFT holders (whales)
- **Distribution Statistics**: See how NFTs are distributed across holders
- **Transaction History**: Track all transfers and sales
- **Trading Metrics**: Volume, average price, floor price by time period
- **Real-time Monitoring**: WebSocket connection for live updates
- **Whale Alerts**: Get notified when large holders make moves
- **RESTful API**: Easy-to-use JSON API endpoints

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Alchemy API key (get one at https://dashboard.alchemy.com/)

## ⚙️ Installation

```bash
cd backend
npm install
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Alchemy API key:
```env
ALCHEMY_API_KEY=your_api_key_here
ALCHEMY_NETWORK=eth-mainnet
NFT_CONTRACT_ADDRESS=0x60E4d786628Fea6478F785A6d7e704777c86a7c6
PORT=3000
WS_PORT=3001
LOG_LEVEL=info
```

## 🏃 Running the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` and WebSocket on `ws://localhost:3001`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status.

### Top Holders
```
GET /api/holders/top?limit=50
```
Get the top N NFT holders by count.

**Response:**
```json
{
  "count": 50,
  "limit": 50,
  "holders": [
    {
      "address": "0x...",
      "count": 542,
      "tokenIds": [1, 2, 3, ...],
      "firstSeen": "2021-04-23T18:25:43.511Z",
      "lastActivity": "2026-02-06T07:51:25.000Z",
      "percentageOfCollection": 5.42
    }
  ],
  "timestamp": "2026-02-06T09:50:25.123Z"
}
```

### Holder Distribution
```
GET /api/holders/distribution
```
Get statistics on how NFTs are distributed.

**Response:**
```json
{
  "totalHolders": 9999,
  "totalSupply": 10000,
  "averageNFTsPerHolder": 1.00,
  "distribution": {
    "single": 9000,
    "small": 800,
    "medium": 150,
    "whales": 49
  },
  "timestamp": "2026-02-06T09:50:25.123Z"
}
```

### Specific Holder
```
GET /api/holders/:address
```
Get details for a specific holder address.

### Recent Transactions
```
GET /api/transactions/recent?hours=24&limit=100
```
Get recent transactions within the specified hour window.

### Trading Metrics
```
GET /api/metrics?period=24h
```
Get trading metrics for a specific period. Periods: `24h`, `7d`, `30d`

**Response:**
```json
{
  "period": "24h",
  "metrics": {
    "transactionCount": 150,
    "volume": 1250.75,
    "avgPrice": 8.34,
    "medianPrice": 7.50,
    "uniqueBuyers": 45,
    "uniqueSellers": 38,
    "floorPrice": 5.00,
    "topTransaction": {
      "tokenId": 5000,
      "priceETH": 50.5
    }
  },
  "timestamp": "2026-02-06T09:50:25.123Z"
}
```

### Whale Addresses
```
GET /api/whales?minNFTs=10
```
Get list of whale addresses (holders with 10+ NFTs by default).

### Cache Stats
```
GET /api/cache/stats
```
Get cache statistics and hit/miss rates.

### Clear Cache
```
POST /api/cache/clear
```
Clear the application cache.

## 🔌 WebSocket Events

Connect to `ws://localhost:3001` to receive real-time updates.

### new_transfer
Emitted when a new NFT transfer occurs.
```json
{
  "type": "new_transfer",
  "data": {
    "txHash": "0x...",
    "from": "0x...",
    "to": "0x...",
    "tokenId": 1234,
    "blockNumber": 19000000,
    "timestamp": "2026-02-06T09:50:25.123Z",
    "transactionType": "transfer"
  }
}
```

### whale_alert
Emitted when a whale (10+ NFT holder) makes a transaction.
```json
{
  "type": "whale_alert",
  "data": {
    "whaleAddress": "0x...",
    "action": "buy",
    "tokenIds": [100, 101, 102],
    "totalNFTs": 25,
    "timestamp": "2026-02-06T09:50:25.123Z"
  }
}
```

### large_sale
Emitted when a high-value sale occurs.
```json
{
  "type": "large_sale",
  "data": {
    "tokenId": 5000,
    "priceETH": 50.5,
    "from": "0x...",
    "to": "0x...",
    "txHash": "0x...",
    "timestamp": "2026-02-06T09:50:25.123Z"
  }
}
```

### metrics_update
Emitted every 10 minutes with updated trading metrics.
```json
{
  "type": "metrics_update",
  "data": {
    "period": "24h",
    "metrics": { ... },
    "timestamp": "2026-02-06T09:50:25.123Z"
  }
}
```

### top_holders_update
Emitted every 30 minutes with updated top holders list.
```json
{
  "type": "top_holders_update",
  "data": {
    "topHolders": [ ... ],
    "timestamp": "2026-02-06T09:50:25.123Z"
  }
}
```

## 🧪 Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Top holders
curl http://localhost:3000/api/holders/top?limit=10

# Metrics for 24 hours
curl http://localhost:3000/api/metrics?period=24h

# Whales
curl http://localhost:3000/api/whales
```

Test WebSocket connection (using wscat):
```bash
npm install -g wscat
wscat -c ws://localhost:3001
```

## 📊 Architecture

```
backend/
├── src/
│   ├── services/              # Business logic
│   │   ├── blockchain.service.ts    # Blockchain interaction
│   │   ├── analytics.service.ts     # Analytics calculations
│   │   └── cache.service.ts         # Caching layer
│   ├── providers/             # External APIs
│   │   └── alchemy.provider.ts      # Alchemy API wrapper
│   ├── models/                # TypeScript interfaces
│   ├── api/                   # API endpoints
│   │   ├── routes.ts          # REST routes
│   │   └── websocket.ts       # WebSocket server
│   ├── utils/                 # Utilities
│   │   ├── logger.ts          # Logging
│   │   └── helpers.ts         # Helper functions
│   └── index.ts               # Application entry point
├── dist/                      # Compiled JavaScript
└── package.json
```

## 🔐 Security Notes

- Never commit your `.env` file with real API keys
- Use environment variables for sensitive data
- Consider rate limiting in production
- Validate all inputs on the API layer

## 📈 Performance Considerations

- Caching is used to reduce API calls to Alchemy
- Cache TTL (Time-To-Live) is set appropriately for different data types
- WebSocket broadcasts are efficient and only go to connected clients
- Historical data fetching is memory-efficient with chunking

## 🚀 Future Enhancements

1. **Database Integration**: Store historical data in PostgreSQL
2. **Advanced Analytics**: ML-based price prediction
3. **Email/SMS Alerts**: Notify users of important events
4. **Mobile App**: React Native client
5. **Multiple Collections**: Support for other NFT collections
6. **Dashboard UI**: Beautiful web interface for data visualization
7. **Trading Signals**: Algorithmic detection of trading patterns
8. **Market Comparisons**: Compare MAYC with other blue-chip NFTs

## 🐛 Troubleshooting

### API key not recognized
- Check that `ALCHEMY_API_KEY` is correctly set in `.env`
- Verify the key is valid at https://dashboard.alchemy.com/

### WebSocket connection refused
- Ensure `WS_PORT` is not in use
- Check firewall settings

### Slow response times
- Cache data is automatically refreshed; wait for refresh or manually clear cache
- Consider increasing `PORT` and `WS_PORT` if system resources are low

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## 📞 Support

For issues or questions, check the architecture diagrams in the plan file: `../claude.plans/bubbly-sprouting-canyon.md`
