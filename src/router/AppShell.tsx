import { useLocale } from '../i18n/LocaleProvider';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/adventure', label: 'Aventura' },
  { to: '/collection', label: 'Colección' },
  { to: '/competitive', label: 'Competitivo' },
  { to: '/saved', label: 'Guardados' }
];

export default function AppShell() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="route-shell">
      <nav className="route-nav" aria-label="Navegación principal">
        <NavLink className="route-brand" to="/adventure">
          <span className="brand-mark">◉</span>
          <span>
            <strong>Pokémon Adventure</strong>
            <small>TEAM GENERATOR</small>
          </span>
        </NavLink>
        <div className="route-links">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `route-link${isActive ? ' active' : ''}`}
            >
              {t(item.label)}
            </NavLink>
          ))}
        </div>
        <label className="site-language">
          <span>Idioma</span>
          <select aria-label="Idioma de la página" value={locale}
            onChange={event => setLocale(event.target.value as 'es-419' | 'es-ES')}>
            <option value="es-419">Español (Latinoamérica)</option>
            <option value="es-ES">Español (España)</option>
          </select>
        </label>
      </nav>
      <Outlet />
      <footer>
        <span>Proyecto fan · Pokémon pertenece a sus respectivos propietarios.</span>
        <span>V2 · navegación modular y progreso persistente.</span>
      </footer>
    </div>
  );
}
