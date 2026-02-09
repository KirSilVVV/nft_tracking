// ImageSearch - Find NFTs by image upload (ATLAS Design)

import React, { useState, useRef } from 'react';
import { useImageSearch } from '../hooks/useWhales';
import { BlockchainLoader, EmptyState } from '../components/loading';
import '../styles/image-search.css';

interface SearchResult {
  tokenId: number;
  name: string;
  image: string;
  similarity: number;
  hammingDistance: number;
}

const ImageSearch: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'ai' | 'hash' | 'trait'>('ai');
  const [threshold, setThreshold] = useState(85);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchDuration, setSearchDuration] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: searchByImage, isPending: isSearching } = useImageSearch();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(0)}KB`);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setFileName('');
    setFileSize('');
    setSearchResults([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const performSearch = () => {
    if (!uploadedFile) return;

    const startTime = Date.now();

    searchByImage(
      { image: uploadedFile, limit: 10, threshold },
      {
        onSuccess: (data) => {
          setSearchDuration((Date.now() - startTime) / 1000);
          setSearchResults(data.matches);
          setShowResults(true);
        },
        onError: (err) => {
          console.error('Search failed:', err);
          alert('Search failed. Please try again.');
        }
      }
    );
  };

  const hideResults = () => {
    setShowResults(false);
    resetUpload();
  };

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <>
      {!showResults ? (
        <>
          {/* Hero */}
          <div className="search-hero">
            <h1>Find Any NFT <span>by Image</span></h1>
            <p>Upload a screenshot or photo of any NFT and our AI will identify the exact token, its owner, traits, and market data — in seconds.</p>
            <div className="how-it-works">
              <div className="hiw-step"><div className="hiw-num">1</div> Upload image</div>
              <span className="hiw-arrow">→</span>
              <div className="hiw-step"><div className="hiw-num">2</div> AI analyzes</div>
              <span className="hiw-arrow">→</span>
              <div className="hiw-step"><div className="hiw-num">3</div> Match found</div>
              <span className="hiw-arrow">→</span>
              <div className="hiw-step"><div className="hiw-num">4</div> View owner & data</div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            {/* Drop Zone */}
            <div
              className={`upload-zone ${uploadedImage ? 'has-image' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="upload-input"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              {!uploadedImage ? (
                <div>
                  <div className="upload-icon">🖼️</div>
                  <h3>Drop your NFT image here</h3>
                  <p>or click to browse files</p>
                  <button className="browse-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    📁 Browse Files
                  </button>
                  <div className="or-divider">— OR paste from clipboard (Ctrl+V) —</div>
                  <div className="upload-formats">
                    Supports <span>PNG</span> <span>JPG</span> <span>GIF</span> <span>WEBP</span> · Max 10MB
                  </div>
                </div>
              ) : (
                <div className="preview-container" style={{ display: 'flex' }}>
                  <img className="preview-img" src={uploadedImage} alt="Preview" />
                  <div className="preview-info">{fileName} · {fileSize}</div>
                  <div className="preview-actions">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); resetUpload(); }}>
                      🗑️ Remove
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      🔄 Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search Options */}
            <div className="search-options">
              <div className="so-title">⚙️ Search Settings</div>

              <div className="option-group">
                <label>Collection</label>
                <select className="option-select">
                  <option>🔍 Auto-detect collection</option>
                  <option>🦍 Mutant Ape Yacht Club (MAYC)</option>
                  <option>🐵 Bored Ape Yacht Club (BAYC)</option>
                </select>
                <div className="option-hint">Select a collection for faster, more accurate results</div>
              </div>

              <div className="option-group">
                <label>Search Method</label>
                <div className="method-pills">
                  <div className={`method-pill ${searchMethod === 'ai' ? 'selected' : ''}`} onClick={() => setSearchMethod('ai')}>
                    <span className="mp-icon">🧠</span>
                    AI Visual
                  </div>
                  <div className={`method-pill ${searchMethod === 'hash' ? 'selected' : ''}`} onClick={() => setSearchMethod('hash')}>
                    <span className="mp-icon">#️⃣</span>
                    Hash Match
                  </div>
                  <div className={`method-pill ${searchMethod === 'trait' ? 'selected' : ''}`} onClick={() => setSearchMethod('trait')}>
                    <span className="mp-icon">🏷️</span>
                    Trait Match
                  </div>
                </div>
                <div className="option-hint">AI Visual uses neural network · Hash Match for exact copies</div>
              </div>

              <div className="option-group">
                <label>Similarity Threshold</label>
                <div className="threshold-row">
                  <input
                    type="range"
                    className="threshold-slider"
                    min="50"
                    max="99"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                  />
                  <span className="threshold-val">{threshold}%</span>
                </div>
                <div className="option-hint">Lower = more results. Higher = fewer, more precise.</div>
              </div>

              <button
                className="search-btn-big"
                disabled={!uploadedImage}
                onClick={performSearch}
              >
                🔍 Find This NFT
              </button>
            </div>
          </div>

          {/* Search History */}
          <div className="search-history">
            <div className="sh-header">
              <h3>🕐 Recent Searches</h3>
              <button className="btn btn-ghost btn-sm">Clear History</button>
            </div>
            <div className="sh-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="sh-item" onClick={performSearch}>
                  <div className="sh-thumb">
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--bg2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px'
                    }}>
                      🦍
                    </div>
                    <div className="sh-overlay">🔍 Search again</div>
                  </div>
                  <div className="sh-meta">
                    <strong>MAYC #{7495 + i}</strong>
                    {i === 1 ? '2 min ago' : `${i}h ago`} · {98 - i}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Results Section */
        <div className="results-section">
          <div className="results-header">
            <h2>
              {searchResults.length > 0 ? '✅ Match Found' : '⚠️ No Matches Found'}
              <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--t3)' }}>
                · {searchDuration.toFixed(2)}s
              </span>
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={hideResults}>← New Search</button>
          </div>

          {/* No Results Message */}
          {searchResults.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No matches found"
              message="Try lowering the similarity threshold or using a different search method."
              actionLabel="← Try Another Image"
              onAction={hideResults}
            />
          )}

          {/* Best Match */}
          {searchResults.length > 0 && (
            <div className="best-match">
              <div className="bm-inner">
                <div className="bm-image-col">
                  <img
                    src={searchResults[0].image}
                    alt={searchResults[0].name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="bm-similarity-bar">
                    <div className="sim-ring" style={{ color: searchResults[0].similarity >= 90 ? 'var(--ok)' : searchResults[0].similarity >= 80 ? 'var(--gold)' : 'var(--warn)' }}>
                      {searchResults[0].similarity.toFixed(0)}%
                    </div>
                    <div className="sim-label">
                      <strong>Visual Match</strong>
                      Confidence: {searchResults[0].similarity >= 90 ? 'Very High' : searchResults[0].similarity >= 80 ? 'High' : 'Medium'}
                    </div>
                  </div>
                </div>
                <div className="bm-details">
                  <div>
                    <div className="bm-token-header">
                      <span className="bm-token-id">{searchResults[0].name}</span>
                      <span className="bm-verified">✓ Verified</span>
                    </div>
                    <div className="bm-collection">Mutant Ape Yacht Club · Token #{searchResults[0].tokenId}</div>
                  </div>

                  <div className="bm-stats">
                    <div className="bm-stat">
                      <div className="label">Similarity</div>
                      <div className="val gold">{searchResults[0].similarity.toFixed(1)}%</div>
                    </div>
                    <div className="bm-stat">
                      <div className="label">Hash Distance</div>
                      <div className="val">{searchResults[0].hammingDistance}</div>
                    </div>
                    <div className="bm-stat">
                      <div className="label">Search Method</div>
                      <div className="val">{searchMethod.toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="bm-links">
                    <a
                      className="bm-link primary"
                      href={`https://opensea.io/assets/ethereum/0x60e4d786628fea6478f785a6d7e704777c86a7c6/${searchResults[0].tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🌊 View on OpenSea ↗
                    </a>
                    <a
                      className="bm-link"
                      href={`https://etherscan.io/token/0x60e4d786628fea6478f785a6d7e704777c86a7c6?a=${searchResults[0].tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📊 Etherscan ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Matches */}
          {searchResults.length > 1 && (
            <div className="trait-matches">
              <h3>🔍 Additional Matches ({searchResults.length - 1})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {searchResults.slice(1).map((result, idx) => (
                  <div key={idx} style={{
                    background: 'var(--bg2)',
                    borderRadius: '12px',
                    padding: '12px',
                    border: '1px solid var(--border)'
                  }}>
                    <img
                      src={result.image}
                      alt={result.name}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                    />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', marginBottom: '4px' }}>
                      {result.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '4px' }}>
                      Token #{result.tokenId}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>
                      {result.similarity.toFixed(1)}% match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {isSearching && (
        <div className="loading-overlay show">
          <BlockchainLoader
            title="Searching for your NFT..."
            message={`Analyzing image using ${searchMethod === 'ai' ? 'AI Visual' : searchMethod === 'hash' ? 'Hash Match' : 'Trait Match'} algorithm. Threshold: ${threshold}% · This may take up to 2 minutes`}
            currentStep={1}
            totalSteps={3}
          />
        </div>
      )}
    </>
  );
};

export default ImageSearch;
