import React, { useEffect } from 'react';
import { RHYME_VIDEOS } from '../data/rhymeData';
import VideoPlayer from './VideoPlayer';
import { setScreen, logEvent } from '../utils/analytics';

const Rhymes: React.FC = () => {
  useEffect(() => {
    setScreen('Rhymes');
  }, []);

  return (
    <VideoPlayer
      videos={RHYME_VIDEOS}
      onVideoPlay={(video) => {
        logEvent('VideoPlay', {
          video_id: video.id,
          video_title: video.title,
          category: 'Rhymes',
        });
      }}
    />
  );
};

export default Rhymes;
