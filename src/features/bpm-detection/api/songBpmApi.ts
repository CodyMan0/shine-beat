import { supabase } from '@/shared';

export interface SavedBpmData {
  bpm: number;
  verified: boolean;
  vote_count: number;
}

export async function fetchSavedBpm(videoUrl: string): Promise<SavedBpmData | null> {
  try {
    const { data } = await supabase
      .from('song_bpm')
      .select('bpm, verified, vote_count')
      .eq('video_url', videoUrl)
      .maybeSingle();
    if (!data) return null;
    return {
      bpm: data.bpm,
      verified: data.verified ?? false,
      vote_count: data.vote_count ?? 0,
    };
  } catch {
    return null;
  }
}

export async function saveSongBpm(
  videoUrl: string,
  videoTitle: string | null,
  bpm: number,
  verified = false,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('song_bpm')
      .upsert(
        { video_url: videoUrl, video_title: videoTitle, bpm, verified, vote_count: 0 },
        { onConflict: 'video_url' },
      );
    return !error;
  } catch {
    return false;
  }
}

export async function voteOnBpm(
  videoUrl: string,
  isUpvote: boolean,
  correctedBpm?: number,
): Promise<{ success: boolean; newVoteCount: number }> {
  try {
    // Get current data
    const { data: current } = await supabase
      .from('song_bpm')
      .select('bpm, vote_count, verified')
      .eq('video_url', videoUrl)
      .maybeSingle();

    if (!current) return { success: false, newVoteCount: 0 };

    if (isUpvote) {
      const newCount = (current.vote_count ?? 0) + 1;
      const shouldVerify = newCount >= 3;

      const { error } = await supabase
        .from('song_bpm')
        .update({
          vote_count: newCount,
          verified: shouldVerify || current.verified,
        })
        .eq('video_url', videoUrl);

      return { success: !error, newVoteCount: newCount };
    } else {
      // Downvote: if corrected BPM provided, update the BPM and reset votes
      const updateData: Record<string, unknown> = {
        vote_count: Math.max(0, (current.vote_count ?? 0) - 1),
        verified: false,
      };

      if (correctedBpm && correctedBpm >= 30 && correctedBpm <= 300) {
        updateData.bpm = correctedBpm;
        updateData.vote_count = 0;
      }

      const { error } = await supabase
        .from('song_bpm')
        .update(updateData)
        .eq('video_url', videoUrl);

      return {
        success: !error,
        newVoteCount: updateData.vote_count as number,
      };
    }
  } catch {
    return { success: false, newVoteCount: 0 };
  }
}
