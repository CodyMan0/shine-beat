import { supabase } from '@/shared';

export async function fetchSavedBpm(videoUrl: string): Promise<number | null> {
  try {
    const { data } = await supabase
      .from('song_bpm')
      .select('bpm')
      .eq('video_url', videoUrl)
      .single();
    return data?.bpm ?? null;
  } catch {
    return null;
  }
}

export async function saveSongBpm(videoUrl: string, videoTitle: string | null, bpm: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('song_bpm')
      .upsert(
        { video_url: videoUrl, video_title: videoTitle, bpm },
        { onConflict: 'video_url' }
      );
    return !error;
  } catch {
    return false;
  }
}
