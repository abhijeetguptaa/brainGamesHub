import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../styles/Passages.scss';

const LockIcon = () => (
  <div className="lock-icon-overlay">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </div>
);

const DifficultySelection = ({ difficulties, baseRoute }) => {
  const navigate = useNavigate();

  return (
    <div className={`kids-bg flex-center column difficulty-selection`}>
      <div className="difficulty-grid">
        {difficulties.map((d) => (
          <motion.div
            key={d.key}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className={`difficulty-card ${d.locked ? 'locked' : ''}`}
            style={{ background: d.color }}
            onClick={() => {
              if (d.locked && d.onClick) {
                d.onClick();
              } else {
                navigate(d.path || `${baseRoute}/${d.key}`);
              }
            }}
          >
            {d.locked && <LockIcon />}
            {d.image ? (
              <img src={d.image} alt={d.label} className="difficulty-image" />
            ) : (
              <div className="emoji">{d.emoji}</div>
            )}
            <div className="label">{d.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelection;
