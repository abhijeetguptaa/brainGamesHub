import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { setScreen } from '../utils/analytics';
import { MATH_OPERATORS } from '../constants/appConstants';
import { downloadCustomWorksheetPdf } from '../utils/pdfUtils';
import ParentalGate from './ParentalGate';
import '../styles/Worksheets.scss';

const CustomSelect = ({ label, icon, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.key === value || opt.value === value);

  return (
    <div className="form-section" ref={dropdownRef}>
      <div className="section-header">
        <span className="icon">{icon}</span>
        <label>{label}</label>
      </div>
      <div className={`custom-dropdown ${isOpen ? 'open' : ''}`}>
        <div
          className="dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="trigger-content">
            {selectedOption?.icon && (
              <span style={{ marginRight: '8px' }}>{selectedOption.icon}</span>
            )}
            {selectedOption?.label}
          </div>
          <span className="arrow">▼</span>
        </div>
        <div className="dropdown-options" role="listbox">
          {options.map((option) => (
            <div
              key={option.key || option.value}
              className={`dropdown-option ${(option.key || option.value) === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.key || option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={(option.key || option.value) === value}
            >
              {option.icon && <span style={{ marginRight: '8px' }}>{option.icon}</span>}
              {option.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function Worksheets() {
  const { t } = useTranslation();
  const [operator, setOperator] = useState(MATH_OPERATORS.Addition);
  const [range1, setRange1] = useState(10);
  const [range2, setRange2] = useState(10);
  const [numPages, setNumPages] = useState(1);
  const [parentalGateOpen, setParentalGateOpen] = useState(false);

  useEffect(() => {
    setScreen('MathWorksheets');
  }, []);

  const operations = [
    { key: MATH_OPERATORS.Addition, label: t('mathWorksheets.addition'), icon: '➕' },
    { key: MATH_OPERATORS.Subtraction, label: t('mathWorksheets.subtraction'), icon: '➖' },
    { key: MATH_OPERATORS.Multiplication, label: t('mathWorksheets.multiplication'), icon: '✖️' },
    { key: MATH_OPERATORS.Division, label: t('mathWorksheets.division'), icon: '➗' },
  ];

  const ranges = [10, 20, 50, 100, 200].map((r) => ({
    value: r,
    label: `${t('mathApp.lessThan')} ${r}`,
  }));

  const pagesOptions = [
    { value: 1, label: `1 ${t('mathWorksheets.page')}` },
    { value: 2, label: `2 ${t('mathWorksheets.pages_label')}` },
    { value: 5, label: `5 ${t('mathWorksheets.pages_label')}` },
    { value: 10, label: `10 ${t('mathWorksheets.pages_label')}` },
    { value: 20, label: `20 ${t('mathWorksheets.pages_label')}` },
    { value: 50, label: `50 ${t('mathWorksheets.pages_label')}` },
  ];

  const handleGenerate = async () => {
    if (numPages > 1) {
      setParentalGateOpen(true);
    } else {
      await downloadCustomWorksheetPdf(operator, range1, range2, 1, t);
    }
  };

  const onConfirm = () => {
    const phoneNumber = '9717094901';
    const message = encodeURIComponent(
      `Hello, I would like to request a math worksheet.\n\n` +
        `Operation: ${operator}\n` +
        `Number 1 Range: <${range1}\n` +
        `Number 2 Range: <${range2}\n` +
        `Number of Pages: ${numPages}`,
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="app-container">
      <div className="worksheets-container dropdown-style">
        {numPages > 1 && (
          <div className="premium-notice">
            <span className="ad-badge">{t('common.actions.offerLabel')}</span>
            {t('mathWorksheets.chargeableMessage')}
          </div>
        )}
        <div className="worksheet-form">
          <CustomSelect
            label={t('mathWorksheets.operation')}
            icon="⚙️"
            options={operations}
            value={operator}
            onChange={setOperator}
          />

          <CustomSelect
            label={t('mathWorksheets.range1')}
            icon="🔢"
            options={ranges}
            value={range1}
            onChange={setRange1}
          />

          <CustomSelect
            label={t('mathWorksheets.range2')}
            icon="🔢"
            options={ranges}
            value={range2}
            onChange={setRange2}
          />

          <CustomSelect
            label={t('mathWorksheets.pages')}
            icon="📄"
            options={pagesOptions}
            value={numPages}
            onChange={setNumPages}
          />

          <button className="generate-button" onClick={handleGenerate}>
            <span className="btn-icon">🖨️</span>
            {numPages > 1 ? t('common.actions.externalLabel') : t('mathWorksheets.generate')}
          </button>
        </div>
      </div>
      <ParentalGate
        isOpen={parentalGateOpen}
        onClose={() => setParentalGateOpen(false)}
        onConfirm={onConfirm}
      />
    </div>
  );
}

export default Worksheets;
