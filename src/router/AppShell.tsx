import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/adventure', label: 'Aventura' },
  { to: '/collection', label: 'Colección' },
  { to: '/competitive', label: 'Competitivo' },
  { to: '/saved', label: 'Guardados' }
];

export default function AppShell() {
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
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
