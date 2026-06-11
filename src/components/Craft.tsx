import React, { useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { LEARNING_VIDEOS } from '../data/rhymeData';
import { setScreen, logEvent } from '../utils/analytics';

const Craft: React.FC = () => {
  useEffect(() => {
    setScreen('Craft');
  }, []);

  return (
    <VideoPlayer
      videos={LEARNING_VIDEOS}
      onVideoPlay={(video) => {
        logEvent('VideoPlay', {
          video_id: video.id,
          video_title: video.title,
          category: 'Craft',
        });
      }}
    />
  );
};

export default Craft;
