import { useState, useCallback } from 'react';

export type BpmSource = 'verified' | 'deezer' | 'audio' | 'community' | 'manual';

interface BPMFeedbackProps {
  bpm: number;
  source: BpmSource;
  confidence?: number;
  isVerified: boolean;
  voteCount: number;
  onVote: (isUpvote: boolean, correctedBpm?: number) => void;
  videoUrl: string | null;
}

const SOURCE_BADGES: Record<BpmSource, { label: string; className: string }> = {
  verified: {
    label: '검증됨',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  deezer: {
    label: 'Deezer',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  audio: {
    label: '오디오 분석',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  community: {
    label: '커뮤니티',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  manual: {
    label: '수동 입력',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  },
};

export function BPMFeedback({
  bpm,
  source,
  confidence,
  isVerified,
  voteCount,
  onVote,
  videoUrl,
}: BPMFeedbackProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedBpm, setCorrectedBpm] = useState('');
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const badge = SOURCE_BADGES[isVerified ? 'verified' : source];

  const handleUpvote = useCallback(() => {
    if (voted) return;
    setVoted('up');
    onVote(true);
  }, [voted, onVote]);

  const handleDownvote = useCallback(() => {
    if (voted) return;
    setVoted('down');
    setShowCorrection(true);
  }, [voted]);

  const handleCorrectionSubmit = useCallback(() => {
    const parsed = parseInt(correctedBpm, 10);
    if (parsed >= 30 && parsed <= 300) {
      onVote(false, parsed);
      setShowCorrection(false);
    }
  }, [correctedBpm, onVote]);

  const handleSkipCorrection = useCallback(() => {
    onVote(false);
    setShowCorrection(false);
  }, [onVote]);

  if (!videoUrl) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Badge + Vote Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Source Badge */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.className}`}
        >
          {badge.label}
          {source === 'audio' && confidence != null && (
            <span className="opacity-70">({Math.round(confidence * 100)}%)</span>
          )}
        </span>

        {/* Vote Count */}
        {voteCount > 0 && (
          <span className="text-[10px] text-text-muted">+{voteCount}</span>
        )}

        {/* Vote Buttons */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleUpvote}
            disabled={voted !== null}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              voted === 'up'
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'border-surface-border text-text-muted hover:text-green-400 hover:border-green-500/30'
            } disabled:opacity-50`}
            title="BPM이 정확해요"
          >
            👍
          </button>
          <button
            onClick={handleDownvote}
            disabled={voted !== null}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              voted === 'down'
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'border-surface-border text-text-muted hover:text-red-400 hover:border-red-500/30'
            } disabled:opacity-50`}
            title="BPM이 틀려요"
          >
            👎
          </button>
        </div>
      </div>

      {/* Correction Input (shown after downvote) */}
      {showCorrection && (
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-text-muted shrink-0">정확한 BPM:</span>
          <input
            type="number"
            value={correctedBpm}
            onChange={(e) => setCorrectedBpm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCorrectionSubmit()}
            placeholder={String(bpm)}
            min="30"
            max="300"
            className="w-20 px-2 py-1 text-xs bg-surface border border-surface-border text-text-primary rounded-md placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleCorrectionSubmit}
            disabled={!correctedBpm}
            className="text-[11px] px-2 py-1 bg-accent text-black font-semibold rounded-md hover:brightness-110 disabled:opacity-40 transition-all"
          >
            수정
          </button>
          <button
            onClick={handleSkipCorrection}
            className="text-[11px] px-2 py-1 text-text-muted hover:text-text-secondary transition-colors"
          >
            건너뛰기
          </button>
        </div>
      )}
    </div>
  );
}
