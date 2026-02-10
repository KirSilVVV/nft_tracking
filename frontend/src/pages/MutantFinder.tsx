import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNftMetadata } from '../hooks/useWhales';
import { NftTrait } from '../types/whale.types';
import { Spinner } from '../components/loading';

interface MutantFinderProps {
  initialTokenId?: number | null;
}

interface ImageSearchMatch {
  tokenId: number;
  name: string;
  image: string;
  similarity: number;
  hammingDistance: number;
}

interface OwnerSearchResult {
  tokenId: number;
  name: string;
  image: string;
  owner: string;
  ownerENS: string | null;
  similarity: number;
  confidence: string;
  openSeaUrl: string;
  etherscanUrl: string;
}

const MutantFinder: React.FC<MutantFinderProps> = ({ initialTokenId }) => {
  const [inputValue, setInputValue] = useState(initialTokenId?.toString() || '');
  const [searchTokenId, setSearchTokenId] = useState<number | null>(initialTokenId ?? null);
  const [searchMode, setSearchMode] = useState<'id' | 'image'>('id');

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<ImageSearchMatch[]>([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);

  // Owner search state
  const [ownerSearchResult, setOwnerSearchResult] = useState<OwnerSearchResult | null>(null);
  const [ownerSearchLoading, setOwnerSearchLoading] = useState(false);
  const [ownerSearchError, setOwnerSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTokenId !== null && initialTokenId !== undefined) {
      setInputValue(initialTokenId.toString());
      setSearchTokenId(initialTokenId);
      setSearchMode('id');
    }
  }, [initialTokenId]);

  const { data, isLoading, isError, error } = useNftMetadata(searchTokenId);

  const handleSearch = () => {
    const parsed = parseInt(inputValue);
    if (!isNaN(parsed) && parsed >= 0 && parsed < 30000) {
      setSearchTokenId(parsed);
      setSearchMode('id');
      setImageSearchResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Image upload handlers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageSearchError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageSearchError('File size must be less than 10MB');
      return;
    }

    setUploadedImage(file);
    setImageSearchError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageSearch = async () => {
    if (!uploadedImage) return;

    setImageSearchLoading(true);
    setImageSearchError(null);
    setSearchMode('image');

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);

      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

      // Add timeout warning for first-time indexing
      const timeout = 120000; // 2 minutes for indexing
      const response = await axios.post(`${API_BASE}/api/nft/search-by-image?limit=10&threshold=70`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
      });

      setImageSearchResults(response.data.matches);
      setSearchTokenId(null);

      // Show success message if results found
      if (response.data.matches.length === 0) {
        setImageSearchError('No similar NFTs found. Try a different image or lower the threshold.');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        setImageSearchError('Search timeout. The index may be building for the first time. Please try again in 1 minute.');
      } else {
        setImageSearchError(err.response?.data?.error || 'Image search failed. Please try again.');
      }
      console.error('Image search error:', err);
    } finally {
      setImageSearchLoading(false);
    }
  };

  const handleFindOwner = async () => {
    if (!uploadedImage) return;

    setOwnerSearchLoading(true);
    setOwnerSearchError(null);
    setOwnerSearchResult(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);

      const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/whales', '') || 'http://localhost:6252';

      const timeout = 120000; // 2 minutes
      const response = await axios.post(`${API_BASE}/api/nft/find-owner-by-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
      });

      setOwnerSearchResult(response.data);
      setImageSearchResults([]);
      setSearchTokenId(null);
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        setOwnerSearchError('Search timeout. Please try again.');
      } else {
        setOwnerSearchError(err.response?.data?.error || 'Owner search failed. Please try again.');
      }
      console.error('Owner search error:', err);
    } finally {
      setOwnerSearchLoading(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b-2 border-purple-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            🔍 Mutant Finder
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Search MAYC NFT by Token ID or Upload Image for Visual Search
          </p>

          {/* Search Mode Tabs */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setSearchMode('id'); setImageSearchResults([]); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'id'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Search by Token ID
            </button>
            <button
              onClick={() => { setSearchMode('image'); setSearchTokenId(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'image'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Search by Image
            </button>
          </div>

          {/* Search by Token ID */}
          {searchMode === 'id' && (
            <div className="flex gap-3 max-w-xl">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Token ID (e.g. 692)"
                min="0"
                max="29999"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}

          {/* Search by Image */}
          {searchMode === 'image' && (
            <div className="max-w-2xl">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img src={imagePreview} alt="Uploaded" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setImagePreview(null);
                          setImageSearchResults([]);
                          setOwnerSearchResult(null);
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleImageSearch}
                        disabled={imageSearchLoading || ownerSearchLoading}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                      >
                        {imageSearchLoading ? 'Searching...' : 'Search Similar NFTs'}
                      </button>
                      <button
                        onClick={handleFindOwner}
                        disabled={imageSearchLoading || ownerSearchLoading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                      >
                        {ownerSearchLoading ? 'Finding...' : '🔍 Find Exact Owner'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-6xl mb-4">📸</div>
                    <p className="text-gray-600 mb-4">Drag & drop an image here, or click to select</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                    >
                      Choose Image
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, GIF, WebP (max 10MB)</p>
                  </div>
                )}
              </div>

              {imageSearchError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {imageSearchError}
                </div>
              )}

              {ownerSearchError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {ownerSearchError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Token ID Search Results */}
        {searchMode === 'id' && (
          <>
            {/* Initial State */}
            {searchTokenId === null && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🐵</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Search for a Mutant Ape</h2>
                <p className="text-gray-600">
                  Enter a token ID (0-19422) to view its image, traits, current owner, and transfer history
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="bg-white rounded-xl shadow-lg p-12 flex flex-col items-center justify-center">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Loading NFT metadata...</p>
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-red-600 mb-2">NFT Not Found</h2>
                <p className="text-gray-600">
                  {error instanceof Error ? error.message : `Could not find MAYC #${searchTokenId}`}
                </p>
              </div>
            )}

            {/* Results */}
            {data && !isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Image & Basic Info */}
                <div>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {data.image ? (
                      <img
                        src={data.image}
                        alt={data.name}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                        <span className="text-6xl">🐵</span>
                      </div>
                    )}

                    <div className="p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h2>
                      {data.description && (
                        <p className="text-gray-600 text-sm mb-4">{data.description}</p>
                      )}

                      {/* Owner */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Current Owner</div>
                        {data.owner ? (
                          <div>
                            <a
                              href={`https://etherscan.io/address/${data.owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-mono text-sm"
                            >
                              {data.ownerENS || formatAddress(data.owner)}
                            </a>
                            {data.ownerENS && (
                              <div className="text-xs text-gray-400 font-mono mt-1">{formatAddress(data.owner)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Unknown</span>
                        )}
                      </div>

                      {/* Price Info */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-500">Last Sale</div>
                          <div className="text-lg font-bold text-gray-900">
                            {data.lastSalePrice ? `${data.lastSalePrice.toFixed(4)} ETH` : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="text-sm text-gray-500">Floor Price</div>
                          <div className="text-lg font-bold text-gray-900">
                            {data.floorPrice ? `${data.floorPrice.toFixed(4)} ETH` : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Traits & History */}
                <div className="space-y-6">
                  {/* Traits */}
                  {data.traits && data.traits.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Traits ({data.traits.length})</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {data.traits.map((trait: NftTrait, idx: number) => (
                          <div key={idx} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-purple-600 font-medium uppercase">{trait.trait_type}</div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">{trait.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfer History */}
                  {data.history && data.history.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Transfer History ({data.history.length})</h3>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {data.history.map((tx, idx) => (
                          <div key={idx} className="px-6 py-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://etherscan.io/address/${tx.from}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline font-mono"
                                >
                                  {formatAddress(tx.from)}
                                </a>
                                <span className="text-gray-400">→</span>
                                <a
                                  href={`https://etherscan.io/address/${tx.to}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline font-mono"
                                >
                                  {formatAddress(tx.to)}
                                </a>
                              </div>
                              <div className="flex items-center gap-3">
                                {tx.priceETH !== null && tx.priceETH > 0 && (
                                  <span className="font-semibold text-gray-900">{tx.priceETH.toFixed(4)} ETH</span>
                                )}
                                <a
                                  href={`https://etherscan.io/tx/${tx.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-blue-500"
                                  title="View transaction"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(tx.timestamp).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Image Search Results */}
        {searchMode === 'image' && imageSearchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Found {imageSearchResults.length} Similar NFTs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {imageSearchResults.map((match) => (
                <div key={match.tokenId} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                  <img src={match.image} alt={match.name} className="w-full aspect-square object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2">{match.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Similarity</div>
                        <div className="text-xl font-bold text-purple-600">{match.similarity.toFixed(1)}%</div>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTokenId(match.tokenId);
                          setSearchMode('id');
                          setImageSearchResults([]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Search Loading */}
        {imageSearchLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Searching for Similar NFTs...</h3>
            <p className="text-gray-600 mb-2">Analyzing image and comparing with MAYC collection</p>
            <p className="text-sm text-gray-500">
              ⏱️ First search may take 30-60 seconds while building index
            </p>
            <p className="text-sm text-gray-500">
              ⚡ Subsequent searches will be instant (cached for 24h)
            </p>
          </div>
        )}

        {/* Owner Search Loading */}
        {ownerSearchLoading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Exact Owner...</h3>
            <p className="text-gray-600 mb-2">Searching blockchain for matching NFT and owner</p>
            <p className="text-sm text-gray-500">
              🔍 Step 1: Finding exact token match...
            </p>
            <p className="text-sm text-gray-500">
              🔗 Step 2: Querying blockchain for current owner...
            </p>
          </div>
        )}

        {/* Owner Search Result */}
        {ownerSearchResult && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">✅ Exact Match Found!</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: NFT Image */}
                <div>
                  <img
                    src={ownerSearchResult.image}
                    alt={ownerSearchResult.name}
                    className="w-full rounded-lg shadow-md"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mt-4">{ownerSearchResult.name}</h3>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-600 font-medium">Token ID: #{ownerSearchResult.tokenId}</span>
                  </div>
                </div>

                {/* Right: Owner Info */}
                <div className="space-y-4">
                  {/* Confidence Badge */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium mb-1">Match Confidence</div>
                    <div className="text-2xl font-bold text-green-700">{ownerSearchResult.confidence}</div>
                    <div className="text-sm text-gray-600 mt-1">Similarity: {ownerSearchResult.similarity.toFixed(1)}%</div>
                  </div>

                  {/* Current Owner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium mb-2">Current Owner</div>
                    {ownerSearchResult.ownerENS ? (
                      <div>
                        <div className="text-lg font-bold text-gray-900">{ownerSearchResult.ownerENS}</div>
                        <div className="text-sm text-gray-500 font-mono mt-1">{formatAddress(ownerSearchResult.owner)}</div>
                      </div>
                    ) : (
                      <div className="text-lg font-mono font-bold text-gray-900 break-all">{ownerSearchResult.owner}</div>
                    )}
                  </div>

                  {/* Quick Links */}
                  <div className="flex gap-3">
                    <a
                      href={ownerSearchResult.etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white text-center font-medium rounded-lg transition-colors"
                    >
                      📋 Etherscan
                    </a>
                    <a
                      href={ownerSearchResult.openSeaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
                    >
                      🌊 OpenSea
                    </a>
                  </div>

                  {/* View Full Details Button */}
                  <button
                    onClick={() => {
                      setSearchTokenId(ownerSearchResult.tokenId);
                      setSearchMode('id');
                      setOwnerSearchResult(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    View Full NFT Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MutantFinder;
