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
}

function norm(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g,'');
}

export default function SearchAssistInput({
  label, value, options, placeholder, onChange, disabled = false, hint
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
  return (
    <div className="comp-assist-field">
      <label className="comp-field">{label}
        <input type="search" aria-label={label} value={value} disabled={disabled}
          autoComplete="off" placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
      {isFocused && !disabled && matches.length > 0 &&
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
