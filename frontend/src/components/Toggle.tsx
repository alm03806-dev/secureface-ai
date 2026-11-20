import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  id: string;
}

/** iOS-style switch with a 44px touch target. */
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-4 min-h-[44px] cursor-pointer select-none">
    <span className="text-sm text-ink-2 leading-relaxed">{label}</span>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-[51px] h-[31px] rounded-full transition-colors duration-200 ${checked ? 'bg-ok' : 'bg-ink-4/40'}`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow ${checked ? 'right-[2px]' : 'left-[2px]'}`}
      />
    </button>
  </label>
);
