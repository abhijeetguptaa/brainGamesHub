import React, { useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { STORIES_VIDEOS } from '../data/rhymeData';
import { setScreen, logEvent } from '../utils/analytics';

const VideoStories: React.FC = () => {
  useEffect(() => {
    setScreen('VideoStories');
  }, []);

  return (
    <VideoPlayer
      videos={STORIES_VIDEOS}
      onVideoPlay={(video) => {
        logEvent('VideoPlay', {
          video_id: video.id,
          video_title: video.title,
          category: 'Stories',
        });
      }}
    />
  );
};

export default VideoStories;
