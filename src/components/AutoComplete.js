"use client";

import { useState, useRef, useEffect } from "react";

export default function AutoComplete({
  options = [],
  value,
  onChange,
  onSelect,
  placeholder = "Type to search...",
  displayKey = null, // For objects: which key to display
  valueKey = null, // For objects: which key to use as value
  className = "",
  disabled = false,
  required = false,
  renderOption = null, // Custom renderer for options
  filterFunction = null, // Custom filter function
  icon = null,
  clearable = false, // Enable clear button
  onClear = null, // Callback when cleared
}) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update input value when controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      const selectedOption = options.find((option) => {
        const optionValue = valueKey ? option[valueKey] : option;
        return optionValue === value;
      });

      if (selectedOption) {
        const displayValue = displayKey
          ? selectedOption[displayKey]
          : selectedOption;
        setInputValue(String(displayValue));
      } else if (value === "" || value === null || value === undefined) {
        setInputValue("");
      }
    }
  }, [value, options, displayKey, valueKey]);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredOptions(options);
      return;
    }

    let filtered;
    if (filterFunction) {
      filtered = filterFunction(options, inputValue);
    } else {
      filtered = options.filter((option) => {
        const searchText = displayKey ? option[displayKey] : String(option);
        return searchText.toLowerCase().includes(inputValue.toLowerCase());
      });
    }

    setFilteredOptions(filtered);
    setHighlightedIndex(-1);
  }, [inputValue, options, displayKey, filterFunction]);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowDropdown(true);
    setHighlightedIndex(-1);

    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option) => {
    const optionValue = valueKey ? option[valueKey] : option;
    const displayValue = displayKey ? option[displayKey] : option;

    setInputValue(String(displayValue));
    setShowDropdown(false);
    setHighlightedIndex(-1);

    if (onSelect) {
      onSelect(optionValue, option);
    }
    if (onChange) {
      onChange(optionValue);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown") {
        setShowDropdown(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setShowDropdown(false);
        break;
    }
  };

  // Handle focus
  const handleFocus = () => {
    setShowDropdown(true);
  };

  // Handle blur
  const handleBlur = (e) => {
    // Delay to allow click on dropdown option
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  // Handle clear
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue("");
    setShowDropdown(false);
    setHighlightedIndex(-1);

    if (onChange) {
      onChange("");
    }
    if (onClear) {
      onClear();
    }

    // Focus back to input
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-3 ${icon ? "pl-10" : ""} ${clearable && inputValue ? "pr-16" : "pr-10"} border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-airbnb-rausch focus:border-airbnb-rausch transition-airbnb bg-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          autoComplete="off"
        />
        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {clearable && inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-airbnb"
              tabIndex={-1}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {showDropdown && (
            <div className="text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {showDropdown && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-airbnb max-h-60 overflow-y-auto"
        >
          {filteredOptions.map((option, index) => {
            const displayValue = displayKey
              ? option[displayKey]
              : String(option);
            const isHighlighted = index === highlightedIndex;

            return (
              <div
                key={index}
                className={`px-4 py-3 cursor-pointer transition-airbnb ${
                  isHighlighted
                    ? "bg-red-50 text-airbnb-rausch"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {renderOption
                  ? renderOption(option, isHighlighted)
                  : displayValue}
              </div>
            );
          })}
        </div>
      )}

      {showDropdown && filteredOptions.length === 0 && inputValue.trim() && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg"
        >
          <div className="px-4 py-3 text-gray-500 text-sm">
            No options found
          </div>
        </div>
      )}
    </div>
  );
}
