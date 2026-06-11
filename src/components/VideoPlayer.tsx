import React, { useEffect, useState, useCallback, useMemo } from 'react';
import '../styles/VideoPlayer.scss';
import { pauseMusic, playMusic } from '../utils/bgMusicManager';
import { stopAllTones, stopSpeech } from '../utils/soundUtils';
import type { Video } from '../types/video';
import { DARK_VISIBLE_COLORS } from '@/constants/coloringConstants';

interface VideoPlayerProps {
  videos: Video[];
  loading?: boolean;
  statusMessage?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onVideoPlay?: (video: Video) => void;
}

type VideoItemProps = {
  video: Video;
  isActive: boolean;
  borderColor: string;
  onPlay: (id: string) => void;
};

const VideoItem = React.memo(function VideoItem({
  video,
  isActive,
  borderColor,
  onPlay,
}: VideoItemProps) {
  return (
    <div
      className={`video-item ${isActive ? 'active' : ''}`}
      onClick={() => onPlay(video.id)}
      style={{ borderColor }}
    >
      <div className="thumbnail-container">
        <img
          src={video.thumbnail ?? `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
          alt={video.title}
        />
        <div className="video-info">
          <h3>{video.title}</h3>
        </div>
      </div>
    </div>
  );
});

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videos, onVideoPlay }) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    pauseMusic();
    return () => {
      playMusic();
    };
  }, []);

  const videoColors = useMemo(() => {
    const colors: Record<string, string> = {};
    videos.forEach((video) => {
      let hash = 0;
      for (let i = 0; i < video.id.length; i++) {
        hash = video.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % DARK_VISIBLE_COLORS.length;
      colors[video.id] = DARK_VISIBLE_COLORS[index];
    });
    return colors;
  }, [videos]);

  const handlePlayVideo = useCallback((id: string) => {
    setSelectedVideoId(id);
    stopAllTones();
    stopSpeech();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const video = videos.find((v) => v.id === id);
    if (video && onVideoPlay) {
      onVideoPlay(video);
    }
  }, [videos, onVideoPlay]);

  const handleCloseVideo = () => {
    setSelectedVideoId(null);
  };

  const handlePlayNext = () => {
    const currentIndex = videos.findIndex((v) => v.id === selectedVideoId);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      setSelectedVideoId(nextVideo.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (onVideoPlay) {
        onVideoPlay(nextVideo);
      }
    }
  };

  const getEmbedUrl = (id: string) => {
    const url = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    url.searchParams.set('autoplay', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('modestbranding', '1');

    const origin = window.location.origin;
    if (origin.startsWith('http')) {
      url.searchParams.set('origin', origin);
    }
    return url.toString();
  };

  return (
    <div className="video-player-container">
      <div className="video-list">
        {videos.map((video) => (
          <VideoItem
            key={video.id}
            video={video}
            isActive={selectedVideoId === video.id}
            borderColor={videoColors[video.id]}
            onPlay={handlePlayVideo}
          />
        ))}
      </div>

      {selectedVideoId && (
        <div className="main-player-section">
          <div className="video-responsive">
            <iframe
              src={getEmbedUrl(selectedVideoId)}
              title="YouTube video player"
              style={{ border: 0 }}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            <div className="video-actions">
              <button onClick={handlePlayNext}>Next Video</button>
            </div>

            <button className="close-video-btn" onClick={handleCloseVideo}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
