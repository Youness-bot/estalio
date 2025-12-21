import React from 'react';
import Button from '../../../components/ui/Button';

const ThemeToggle = ({ isDarkMode, onToggle }) => {
  return (
    <div className="absolute top-4 right-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        iconName={isDarkMode ? "Sun" : "Moon"}
      />
    </div>
  );
};

export default ThemeToggle;