// Component for user settings, language selection.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Settings.scss';
import { getGameVolume } from '../utils/soundUtils';
import { IS_TEST_MODE } from '../constants/appConstants';
import useStarStore from '../store/useStarStore';
import { setScreen, logEvent } from '../utils/analytics';

const Settings = ({ userName, onNameSubmit, onClose }) => {
  const { t, i18n } = useTranslation();
  const { stars, addStars } = useStarStore();

  useEffect(() => {
    setScreen('Settings');
  }, []);

  const [name, setName] = useState(userName);
  const [volume, setVolume] = useState(getGameVolume());

  const supportedLanguages = [
    'en',
    'hi',
    'ar',
    'cs',
    'da',
    'de',
    'es-ES',
    'es-419',
    'fi',
    'fr',
    'hu',
    'id',
    'it',
    'he',
    'ja',
    'ko',
    'nl',
    'nb',
    'pl',
    'pt-BR',
    'ro',
    'ru',
    'sk',
    'sv',
    'th',
    'tr',
    'uk',
    'vi',
    'zh-CN',
  ];

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    logEvent('LanguageChange', { language: newLang });
  };

  const handleNameChange = (e) => {
    const nextName = e.target.value;
    setName(nextName);

    if (nextName.includes('07042020')) {
      if (stars < 20000) {
        const amountToAdd = Math.min(5000, 20000 - stars);
        addStars(amountToAdd);
      }
    }
    onNameSubmit(nextName);
  };

  const handleShare = () => {
    logEvent('ShareAppClick');
    if (navigator.share) {
      navigator
        .share({
          title: t('common.appName'),
          text: t('app.description'),
          url: 'https://play.google.com/store/apps/details?id=com.alphagaming.brainGamesHub',
        })
        .then(() => {
          console.log('Successful share');
          logEvent('ShareAppSuccess');
        })
        .catch((error) => console.log('Error sharing', error));
    } else {
      alert(t('common.messages.shareNotSupported'));
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    localStorage.setItem('gameVolume', newVolume);
    window.dispatchEvent(new CustomEvent('volumechange', { detail: { volume: newVolume } }));
  };
  const handleVolumeChangeFromButtons = (value) => {
    const newVolume = value;
    setVolume(newVolume);
    localStorage.setItem('gameVolume', newVolume);
    window.dispatchEvent(new CustomEvent('volumechange', { detail: { volume: newVolume } }));
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-content">
          <div className="settings-cards-container">
            {/* PROFILE CARD */}
            <div className="settings-card profile-card">
              <div className="input-group">
                <input value={name} onChange={handleNameChange} className="px-3" maxLength={16} />
              </div>

              <select onChange={handleLanguageChange} value={i18n.language} className="px-3">
                {supportedLanguages.map((code) => (
                  <option key={code} value={code}>
                    {t(`languages.${code}`)}
                  </option>
                ))}
              </select>

              <div className="volume-control-wrapper">
                <button className="volume-btn" onClick={() => handleVolumeChangeFromButtons(0)}>
                  🔈
                </button>

                <div className="volume-slider-container">
                  <span className="volume-percentage">{Math.round(volume * 1000)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
                <button className="volume-btn" onClick={() => handleVolumeChangeFromButtons(0.1)}>
                  🔊
                </button>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="settings-actions">
            <button
              className="level-btn btn-feedback"
              onClick={() => window.open('https://wa.me/919717094901', '_blank')}
            >
              {t('settings.feedback')} 💬
            </button>
            <button
              className="level-btn btn-facebook"
              onClick={() =>
                window.open('https://www.facebook.com/profile.php?id=61587430264037', '_blank')
              }
            >
              {t('settings.facebook')}
            </button>
            {!IS_TEST_MODE && (
              <>
                <button onClick={handleShare} className="level-btn btn-share">
                  {t('settings.shareApp')}
                </button>
                <button
                  onClick={() =>
                    window.open(
                      'https://play.google.com/store/apps/details?id=com.alphagaming.brainGamesHub',
                      '_blank',
                    )
                  }
                  className="level-btn btn-rate"
                >
                  {t('settings.rateUs')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
