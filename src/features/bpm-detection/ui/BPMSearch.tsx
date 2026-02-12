import { useBPMSearch } from '../model/useBPMSearch';
import { saveSongBpm } from '../api/songBpmApi';
import { useEffect, useRef, useCallback, useState } from 'react';

interface BPMSearchProps {
  videoUrl: string | null;
  onBpmDetected: (bpm: number) => void;
}

export function BPMSearch({ videoUrl, onBpmDetected }: BPMSearchProps) {
  const { detectedBpm, songInfo, isSearching, error, searchTitle, searchByUrl } = useBPMSearch();
  const lastSearchedUrl = useRef<string | null>(null);
  const [manualBpm, setManualBpm] = useState('');

  // Auto-search when a new video URL is provided
  useEffect(() => {
    if (videoUrl && videoUrl !== lastSearchedUrl.current) {
      lastSearchedUrl.current = videoUrl;
      setManualBpm('');
      searchByUrl(videoUrl);
    }
  }, [videoUrl, searchByUrl]);

  // Notify parent when BPM is detected (from Deezer)
  useEffect(() => {
    if (detectedBpm) {
      onBpmDetected(detectedBpm);
    }
  }, [detectedBpm, onBpmDetected]);

  const handleGoogleSearch = useCallback(() => {
    if (searchTitle) {
      const query = encodeURIComponent(`${searchTitle} BPM`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  }, [searchTitle]);

  const handleManualBpmSubmit = useCallback(() => {
    const bpm = parseInt(manualBpm, 10);
    if (bpm >= 30 && bpm <= 300) {
      onBpmDetected(bpm);
      if (videoUrl) {
        saveSongBpm(videoUrl, searchTitle, bpm);
      }
    }
  }, [manualBpm, onBpmDetected, videoUrl, searchTitle]);

  if (!videoUrl && !isSearching) return null;

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-4 space-y-3">
      {/* Status Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isSearching && (
            <>
              <div
                className="w-3 h-3 rounded-full bg-accent shrink-0"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
              <div className="text-sm text-text-secondary">BPM 검색 중...</div>
            </>
          )}
          {!isSearching && detectedBpm && songInfo && (
            <>
              <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
              <div className="text-sm text-text-primary truncate">
                <span className="font-mono font-bold text-accent">{detectedBpm} BPM</span>
                <span className="text-text-muted mx-1.5">|</span>
                <span>{songInfo}</span>
              </div>
            </>
          )}
          {!isSearching && error && (
            <>
              <div className="w-3 h-3 rounded-full bg-text-muted shrink-0" />
              <div className="text-sm text-text-secondary truncate">{error}</div>
            </>
          )}
        </div>

        {!isSearching && videoUrl && (
          <button
            onClick={() => {
              lastSearchedUrl.current = null;
              searchByUrl(videoUrl);
            }}
            className="shrink-0 text-xs px-3 py-1.5 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
          >
            재검색
          </button>
        )}
      </div>

      {/* Manual BPM Input (shown when Deezer fails) */}
      {!isSearching && error && searchTitle && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGoogleSearch}
            className="shrink-0 text-xs px-3 py-2 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
          >
            Google 검색
          </button>
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="number"
              value={manualBpm}
              onChange={(e) => setManualBpm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualBpmSubmit()}
              placeholder="BPM 입력"
              min="30"
              max="300"
              className="w-24 px-3 py-1.5 text-sm bg-surface border border-surface-border text-text-primary rounded-lg placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleManualBpmSubmit}
              disabled={!manualBpm}
              className="text-xs px-3 py-2 bg-accent text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
