import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const SearchBar = ({ onSearch, onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e) => {
    const value = e?.target?.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Icon 
            name="Search" 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={`
              w-full pl-10 pr-10 py-2.5 border rounded-md bg-input text-foreground placeholder-muted-foreground
              transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              ${isSearchFocused ? 'border-ring' : 'border-border'}
            `}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {isSearchFocused && searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-modal z-50 max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2">Search suggestions:</div>
              <div className="space-y-1">
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-foreground">
                  Search in article names
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-foreground">
                  Search in categories
                </button>
                <button className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded text-foreground">
                  Search in suppliers
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Quick Filters */}
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearch('type:consumable')}
            iconName="Package"
          >
            Consumables
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearch('type:durable')}
            iconName="Wrench"
          >
            Durables
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearch('status:low-stock')}
            iconName="AlertTriangle"
            className="text-warning border-warning"
          >
            Low Stock
          </Button>
        </div>

        {/* Add Item Button */}
        <Button
          onClick={onAddItem}
          iconName="Plus"
          className="whitespace-nowrap"
        >
          Add Item
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;