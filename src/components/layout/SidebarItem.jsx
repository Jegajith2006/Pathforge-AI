import React from 'react';
import { NavLink } from 'react-router-dom';
import { Tooltip } from '../common/Tooltip';

/**
 * SidebarItem component
 * Handles active state, hover state, collapsed icon mode, and accessibility.
 * In collapsed mode:
 * - Perfectly centered icon container
 * - Active background stays inside sidebar
 * - Label text omitted completely to avoid clipping
 * - Full label + badge accessible via Portal Tooltip on hover/focus
 */
export const SidebarItem = ({
  icon: Icon,
  label,
  to,
  isCollapsed = false,
  badge = null,
  onClick,
}) => {
  const tooltipContent = badge ? `${label} (${badge})` : label;

  const itemContent = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `
        group
        relative
        flex
        items-center
        ${
          isCollapsed
            ? 'w-10 h-10 mx-auto justify-center rounded-xl p-0'
            : 'w-full px-3.5 py-2.5 gap-3 rounded-xl'
        }
        text-xs
        font-medium
        transition-colors
        duration-150
        cursor-pointer
        select-none
        ${
          isActive
            ? 'bg-[var(--sidebar-item-active)] text-[var(--text-primary)] border border-indigo-500/40 shadow-xs font-semibold'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-hover)] border border-transparent'
        }
      `}
    >
      {({ isActive }) => (
        <>
          {/* Active Accent Indicator */}
          {isActive && (
            <span
              className={`
                absolute
                rounded-full
                bg-indigo-600
                dark:bg-cyan-400
                shadow-sm
                shadow-indigo-500/50
                ${
                  isCollapsed
                    ? 'left-1 top-1/2 -translate-y-1/2 w-1 h-5'
                    : 'left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r'
                }
              `}
              aria-hidden="true"
            />
          )}

          {/* Icon - Always centered and fixed size */}
          {Icon && (
            <div className="flex items-center justify-center shrink-0 w-5 h-5">
              <Icon
                className={`
                  w-4
                  h-4
                  transition-colors
                  ${
                    isActive
                      ? 'text-indigo-600 dark:text-cyan-400'
                      : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                  }
                `}
              />
            </div>
          )}

          {/* Collapsed Badge Dot Indicator */}
          {isCollapsed && badge && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 ring-2 ring-[var(--sidebar-bg)]"
              aria-hidden="true"
            />
          )}

          {/* Label (only when expanded) */}
          {!isCollapsed && (
            <span className="truncate flex-1 tracking-wide font-sans text-left">
              {label}
            </span>
          )}

          {/* Expanded Badge Pill */}
          {!isCollapsed && badge && (
            <span className="ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent-primary)] border border-indigo-500/30 shrink-0">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={tooltipContent} position="right">
        {itemContent}
      </Tooltip>
    );
  }

  return itemContent;
};

export default SidebarItem;

