import { useMemo, useState } from 'react';

export interface AssistOption { id: string; label: string }
interface Props {
  label: string;
  value: string;
  options: AssistOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  /** Localized rendering of a canonical stored value; stored data stays stable. */
  displayValue?: (value: string) => string;
}

function norm(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g,'');
}

export default function SearchAssistInput({
  label, value, options, placeholder, onChange, disabled = false, hint, displayValue
}: Props) {
  const [isFocused, setFocused] = useState(false);
  const matches = useMemo(() => {
    const q = norm(value);
    return options.filter(option => !q || norm(option.label).includes(q) || norm(option.id).includes(q))
      .sort((a,b) => {
        const aScore = norm(a.label).startsWith(q) || norm(a.id).startsWith(q) ? 0 : 1;
        const bScore = norm(b.label).startsWith(q) || norm(b.id).startsWith(q) ? 0 : 1;
        return aScore-bScore || a.label.localeCompare(b.label);
      })
      .slice(0,8);
  },[options,value]);
  const exactOption = options.find(option =>
    norm(option.id) === norm(value) || norm(option.label) === norm(value));
  const exactChoice = Boolean(exactOption);
  const shownValue = exactOption?.label ?? (displayValue?.(value) ?? value);
  const showSuggestions = isFocused || (value.trim().length > 0 && !exactChoice);
  return (
    <div className="comp-assist-field">
      <label className="comp-field">{label}
        <input type="search" aria-label={label} value={shownValue} disabled={disabled}
          autoComplete="off" placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            // Spanish or English exact typed names resolve to their canonical ID.
            if (exactOption && value !== exactOption.id) onChange(exactOption.id);
          }}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && isFocused && matches.length > 0) {
              event.preventDefault();
              onChange(matches[0].id);
              setFocused(false);
            }
            if (event.key === 'Escape') setFocused(false);
          }}/>
      </label>
      {hint && <small className="comp-assist-hint">{hint}</small>}
      {showSuggestions && !disabled && matches.length > 0 &&
        <ul className="comp-assist-suggestions" aria-label={'Opciones para ' + label}>
          {matches.map(option => <li key={option.id}>
            <button type="button" onMouseDown={event=>event.preventDefault()}
              onClick={() => { onChange(option.id); setFocused(false); }}
              aria-label={'Elegir ' + option.label}>{option.label}</button>
          </li>)}
        </ul>}
    </div>
  );
}
