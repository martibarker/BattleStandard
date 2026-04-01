import { NavLink, Outlet } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const armyItems: NavItem[] = [
  { to: '/army-builder', label: 'My Armies', icon: '🛡', end: true },
];

const companionItems: NavItem[] = [
  { to: '/turn-tracker', label: "General's Adjutant", icon: '⏱' },
  { to: '/rules', label: 'Rules', icon: '📖' },
  { to: '/documents', label: 'Documents', icon: '📄' },
];

const mobileTabItems: NavItem[] = [
  { to: '/', label: 'Home', icon: '⚔', end: true },
  { to: '/army-builder', label: 'Army', icon: '🛡', end: true },
  { to: '/turn-tracker', label: 'Adjutant', icon: '⏱' },
  { to: '/rules', label: 'Rules', icon: '📖' },
  { to: '/documents', label: 'Docs', icon: '📄' },
];

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
          isActive ? 'text-amber-500 bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
        ].join(' ')
      }
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

function TabItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors flex-1',
          isActive ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300',
        ].join(' ')
      }
    >
      <span className="text-lg leading-none">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="mb-4">
      <p
        className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
      </p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarNavItem key={item.to} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Top nav bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
      >
        <NavLink
          to="/"
          className="text-lg font-semibold tracking-wide"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-amber)', textDecoration: 'none' }}
        >
          Battle Standard
        </NavLink>

        {/* Desktop header links */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLink
            to="/army-builder"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-amber-500' : 'text-gray-400 hover:text-gray-200'}`
            }
          >
            Army Builder
          </NavLink>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <NavLink
            to="/turn-tracker"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-amber-500' : 'text-gray-400 hover:text-gray-200'}`
            }
          >
            General's Adjutant
          </NavLink>
        </nav>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 border-r shrink-0 py-4"
          style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
        >
          <SidebarSection title="Army Builder" items={armyItems} />
          <SidebarSection title="General's Adjutant" items={companionItems} />
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer
        className="border-t px-4 py-3 text-xs text-center hidden md:block"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Unofficial. Not affiliated with Games Workshop Limited.</span>
        <span className="mx-2">·</span>
        <span>
          Rules index:{' '}
          <a
            href="https://tow.whfb.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent-blue)' }}
          >
            Warhammer Fantasy Online Rules Index Project — tow.whfb.app
          </a>
        </span>
      </footer>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 inset-x-0 flex items-center border-t md:hidden z-40"
        style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
      >
        {mobileTabItems.map((item) => (
          <TabItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Mobile footer */}
      <div
        className="border-t px-4 py-2 text-xs text-center md:hidden"
        style={{
          backgroundColor: 'var(--color-bg-dark)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Unofficial. Not affiliated with Games Workshop Limited. ·{' '}
        <a href="https://tow.whfb.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-blue)' }}>
          tow.whfb.app
        </a>
      </div>
    </div>
  );
}
