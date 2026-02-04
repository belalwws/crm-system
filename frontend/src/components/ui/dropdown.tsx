"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { MoreVertical, ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: ReactNode;
  align?: "left" | "right";
}

export function Dropdown({ items, trigger, align = "right" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
      >
        {trigger || <MoreVertical className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1 py-1 min-w-[160px]
            bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl
            animate-scale-in origin-top-right
            ${align === "right" ? "right-0" : "left-0"}
          `}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={`
                w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                transition-colors
                ${item.disabled
                  ? "text-neutral-600 cursor-not-allowed"
                  : item.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-neutral-300 hover:bg-neutral-700"
                }
              `}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectDropdown({ value, onChange, options, placeholder = "Select..." }: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-left hover:border-neutral-600 transition-colors"
      >
        <span className={selectedOption ? "text-white" : "text-neutral-500"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full py-1 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl animate-scale-in">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-sm text-left transition-colors
                ${option.value === value
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-300 hover:bg-neutral-700"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
