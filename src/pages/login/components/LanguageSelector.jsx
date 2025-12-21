import React from 'react';
import Select from '../../../components/ui/Select';

const LanguageSelector = ({ currentLanguage, onLanguageChange }) => {
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'ar', label: 'العربية' }
  ];

  return (
    <div className="mb-6">
      <Select
        options={languages}
        value={currentLanguage}
        onChange={onLanguageChange}
        placeholder="Select Language"
        className="w-full"
      />
    </div>
  );
};

export default LanguageSelector;