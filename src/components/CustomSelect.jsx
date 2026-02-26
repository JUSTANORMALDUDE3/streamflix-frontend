import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        // Mimic event object structure for seamless replacement of native selects
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className="custom-select-wrapper" ref={selectRef}>
            <div
                className={`input-field custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
                <ChevronDown size={18} className={`custom-select-icon ${isOpen ? 'open' : ''}`} />
            </div>
            {isOpen && (
                <div className="custom-select-dropdown glass animate-fade-in">
                    <div className="custom-select-search-container">
                        <Search size={16} className="custom-select-search-icon" />
                        <input
                            type="text"
                            className="custom-select-search-input"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="custom-select-options-list">
                        {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.value)}
                            >
                                {option.label}
                            </div>
                        )) : (
                            <div className="custom-select-no-results">No videos found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
