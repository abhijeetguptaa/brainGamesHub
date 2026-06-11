import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/ShareButton.scss';

interface ShareButtonProps {
  onDownloadClick: () => void;
  onShareClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onDownloadClick }) => {
  const { t } = useTranslation();

  return (
    <div className="share-buttons-container">
      <button
        className="nav-button nav-button--share share-button"
        onClick={onDownloadClick}
        title={t('mathApp.downloadAsFile')}
        aria-label={t('mathApp.downloadAsFile')}
      >
        🖨️
      </button>
    </div>
  );
};

export default ShareButton;
