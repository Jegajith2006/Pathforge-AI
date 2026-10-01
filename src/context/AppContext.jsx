import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockUserData, mockNotifications as initialNotifications, mockCareerRoles } from '../data/mockData';

const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pathforge_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Theme states (Dark is default)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('pathforge-theme') || localStorage.getItem('pathforge_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Modal and menu popover states
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Notifications and User data
  const [notifications, setNotifications] = useState(initialNotifications);
  const [user, setUser] = useState(mockUserData);
  const [careerRoles, setCareerRoles] = useState(mockCareerRoles);
  const [activeCareer, setActiveCareer] = useState(mockUserData.targetCareer);

  // Sync theme with HTML document
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;

    try {
      localStorage.setItem('pathforge-theme', theme);
      localStorage.setItem('pathforge_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Persist sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('pathforge_sidebar_collapsed', String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
      }

      // Close all modals / overlays on Escape
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }, []);

  const toggleNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const selectCareerRole = useCallback((roleTitle) => {
    setActiveCareer(roleTitle);
    setUser((prev) => ({
      ...prev,
      targetCareer: roleTitle,
    }));
    setCareerRoles((prev) =>
      prev.map((r) => ({
        ...r,
        isCurrent: r.title === roleTitle,
      }))
    );
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;

  const value = {
    // Layout UI State
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    toggleMobileSidebar,

    // Theme
    theme,
    setTheme,
    toggleTheme,

    // Dialogs & Dropdowns
    commandPaletteOpen,
    setCommandPaletteOpen,
    notificationMenuOpen,
    setNotificationMenuOpen,
    profileMenuOpen,
    setProfileMenuOpen,

    // Data & Handlers
    user,
    setUser,
    activeCareer,
    selectCareerRole,
    changeActiveCareer: selectCareerRole,
    careerRoles,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    toggleNotificationRead,
    deleteNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const AppProvider = AppContextProvider;

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};

export default AppContextProvider;

