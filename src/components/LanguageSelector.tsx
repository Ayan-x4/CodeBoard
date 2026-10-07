import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { getLanguage, languages, type LanguageId } from '../editor/languages';

export function LanguageSelector({ language, onChange }: { language: LanguageId; onChange: (language: LanguageId) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapper = useRef<HTMLDivElement>(null);
  const selected = getLanguage(language);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', key);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', key); };
  }, [open]);
  return <div className="language-select" ref={wrapper}><button className="language-trigger" onClick={() => { setOpen(!open); setQuery(''); }} aria-haspopup="dialog" aria-expanded={open}><span className="language-badge" style={{ color: selected.color, background: `${selected.color}15` }}>{selected.badge}</span><span>{selected.label}</span><ChevronDown size={13} /></button>
    {open && <div className="language-menu" role="dialog" aria-label="Select language"><div className="menu-search"><Search size={15} /><input autoFocus placeholder="Find a language…" aria-label="Search programming languages" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="language-list">{languages.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).map((item) => <button key={item.id} className={item.id === language ? 'selected' : ''} onClick={() => { onChange(item.id); setOpen(false); }}><span className="language-badge" style={{ color: item.color }}>{item.badge}</span><span>{item.label}</span>{item.id === language && <Check size={15} />}</button>)}{!languages.some((item) => item.label.toLowerCase().includes(query.toLowerCase())) && <p className="menu-empty">No languages found.</p>}</div><footer>19 languages. One workspace.</footer></div>}
  </div>;
}
