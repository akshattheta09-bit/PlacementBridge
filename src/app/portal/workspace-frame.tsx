'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { viewUrl, type View } from '@/lib/workspace';
import { Brand } from '../identity';

const sidebarPreference = 'placementbridge.sidebar-collapsed';
const mobileViewport = '(max-width: 760px)';

type FrameProps = {
  navigation: { view: View; label: string }[];
  view: View;
  title: string;
  displayName: string;
  role: string;
  signOutAction: () => Promise<void>;
  children: ReactNode;
};

export function WorkspaceFrame({
  navigation,
  view,
  title,
  displayName,
  role,
  signOutAction,
  children,
}: FrameProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(sidebarPreference) === 'true');
    } catch {
      // The sidebar remains usable when browser storage is unavailable.
    }
    const viewport = window.matchMedia(mobileViewport);
    function closeOnDesktop() {
      if (!viewport.matches) drawer.current?.close();
    }
    viewport.addEventListener('change', closeOnDesktop);
    return () => viewport.removeEventListener('change', closeOnDesktop);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(sidebarPreference, String(next));
    } catch {
      // The current layout still updates.
    }
  }

  function openDrawer() {
    if (!drawer.current || drawer.current.open) return;
    drawer.current.showModal();
    setDrawerOpen(true);
  }

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join('');
  function sidebar(onNavigate?: () => void) {
    return (
      <>
        <div className="sidebar-title">
          <Brand />
        </div>
        <div className="sidebar-role">{role}</div>
        <nav className="workspace-nav" aria-label="Workspace">
          {navigation.map(({ view: destination, label }) => (
            <Link
              key={destination}
              href={viewUrl(destination)}
              aria-current={view === destination ? 'page' : undefined}
              onClick={onNavigate}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-account">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <strong>{displayName}</strong>
            <form action={signOutAction}>
              <button>Sign out</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="workspace"
      data-sidebar={collapsed ? 'collapsed' : 'expanded'}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        className="workspace-sidebar"
        id="workspace-sidebar"
        inert={collapsed}
      >
        {sidebar()}
      </aside>
      <dialog
        className="workspace-drawer"
        id="workspace-drawer"
        ref={drawer}
        aria-label="Workspace navigation"
        onClose={() => {
          setDrawerOpen(false);
          if (window.matchMedia(mobileViewport).matches)
            opener.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) drawer.current?.close();
        }}
      >
        <div className="drawer-content">
          <button
            className="menu-toggle drawer-close"
            type="button"
            autoFocus
            aria-label="Close navigation"
            onClick={() => drawer.current?.close()}
          >
            ×
          </button>
          {sidebar(() => drawer.current?.close())}
        </div>
      </dialog>
      <div className="workspace-body">
        <header className="workspace-bar">
          <div className="workspace-bar-main">
            <button
              className="menu-toggle desktop-toggle"
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              aria-controls="workspace-sidebar"
              onClick={toggleSidebar}
            >
              <span className="sidebar-icon" aria-hidden="true" />
            </button>
            <button
              className="menu-toggle mobile-toggle"
              ref={opener}
              type="button"
              aria-label="Open navigation"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              aria-controls="workspace-drawer"
              onClick={openDrawer}
            >
              <span className="menu-icon" aria-hidden="true" />
            </button>
            <div className="toolbar-wordmark">
              <Brand />
            </div>
            <span className="workspace-breadcrumb">
              <span> / </span>
              <strong>{title}</strong>
            </span>
          </div>
          <div className="workspace-toolbar-actions">
            <span className="demo-label">Synthetic demo</span>
            <Link
              className="avatar workspace-profile"
              href={viewUrl('profile')}
              aria-label="Open my profile"
              title="My profile"
            >
              <span aria-hidden="true">{initials}</span>
            </Link>
          </div>
        </header>
        <main className="workspace-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer">
          PlacementBridge · Independent academic prototype
        </footer>
      </div>
    </div>
  );
}
