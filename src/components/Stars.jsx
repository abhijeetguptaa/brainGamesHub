import React from 'react';
import '../styles/Stars.scss';
import useStarStore from '../store/useStarStore';

const Stars = () => {
  const stars = useStarStore((state) => state.stars);
  return (
    <div className="stars-container">
      <span className="star-icon">⭐</span>
      <span className="star-count">{stars}</span>
    </div>
  );
};

export default Stars;
