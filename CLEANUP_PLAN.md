# Optional Cleanup Plan

## Files to Remove (Old recharts components - unused in Dashboard)

These files are no longer used after Chart.js migration:

- `frontend/src/components/charts/ActivityTrendChart.tsx`
- `frontend/src/components/charts/HistoricalTrendChart.tsx`
- `frontend/src/components/charts/HolderDistributionPieChart.tsx`
- `frontend/src/components/charts/TopHoldersBarChart.tsx`
- `frontend/src/components/charts/TraitRarityChart.tsx`

## Files Still Using recharts

- `frontend/src/pages/PortfolioAnalyzer.tsx` - uses recharts PieChart

## Recommendation

Option 1: Keep as-is (recharts in package.json for PortfolioAnalyzer)
Option 2: Migrate PortfolioAnalyzer to Chart.js PieChart and remove recharts dependency

## Package.json Cleanup

If all recharts components are removed:
```bash
npm uninstall recharts
```

This would reduce bundle size by ~200KB.
