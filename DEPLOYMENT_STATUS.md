# 🚀 Deployment Status

## Production URLs

- **Frontend (Cloudflare Pages)**: https://nft-tracking.pages.dev
- **Custom Domain**: https://nftai.one (pending DNS setup)
- **Backend (Render)**: https://mayc-backend.onrender.com

## Latest Deployment

- **Date**: 2026-02-11
- **Git Commit**: Testing auto-deployment
- **Status**: ✅ CI/CD pipeline configured

## Services

### Frontend (Cloudflare Pages)
- Framework: React (Vite)
- Build: `npm run build`
- Root: `frontend/`
- Auto-deploy: ✅ Enabled (main branch)

### Backend (Render)
- Framework: Node.js + Express
- Build: `npm install && npm run build`
- Root: `backend/`
- Auto-deploy: ✅ Enabled (main branch)

## Environment Variables

### Frontend (Cloudflare)
- `CI=false` - Bypass ESLint warnings
- `REACT_APP_API_URL=https://mayc-backend.onrender.com/api/whales`

### Backend (Render)
- `ALCHEMY_API_KEY` - Blockchain API key
- `NFT_CONTRACT_ADDRESS` - MAYC contract
- `ALCHEMY_NETWORK=eth-mainnet`
- `NODE_ENV=production`

## Next Steps

1. ✅ Configure custom domain `nftai.one`
2. ✅ Test end-to-end functionality
3. ✅ Monitor production logs
