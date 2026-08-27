"use client";

import {
  ClipboardList,
  Grid2x2,
  LayoutDashboard,
  Menu,
  NotebookText,
  Settings,
  Sparkles,
  User,
  Users,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { JoinBatchTrigger } from "@/components/join/JoinBatchTrigger";
import { CopyJoinCode } from "@/components/ui/CopyJoinCode";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export type SidebarVariant = "admin" | "student";

const BATCH_NAV_ITEMS: Record<SidebarVariant, NavItem[]> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/meetings", label: "Meetings", icon: Video },
    { href: "/admin/notes", label: "Notes", icon: NotebookText },
    { href: "/admin/tests", label: "Tests", icon: ClipboardList },
    { href: "/admin/fees", label: "Fees", icon: Wallet },
    { href: "/admin/ai", label: "OpenGrapes AI", icon: Sparkles },
  ],
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/meetings", label: "Meetings", icon: Video },
    { href: "/student/notes", label: "Notes", icon: NotebookText },
    { href: "/student/tests", label: "Tests", icon: ClipboardList },
    { href: "/student/fees", label: "Fees", icon: Wallet },
    { href: "/student/ai", label: "OpenGrapes AI", icon: Sparkles },
  ],
};

interface HubNavGroup {
  label: string;
  items: NavItem[];
}

const HUB_NAV: Record<SidebarVariant, HubNavGroup[]> = {
  admin: [
    {
      label: "Workspace",
      items: [
        { href: "/admin", label: "All batches", icon: Grid2x2, exact: true },
        { href: "/admin/fees-overview", label: "Fees overview", icon: Wallet },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "#", label: "Profile", icon: User },
        { href: "#", label: "Settings", icon: Settings },
      ],
    },
  ],
  student: [
    {
      label: "Learning",
      items: [
        { href: "/student", label: "My batches", icon: Grid2x2, exact: true },
      ],
    },
    {
      label: "Account",
      items: [{ href: "#", label: "Profile", icon: User }],
    },
  ],
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export function Sidebar({
  variant,
  subtitle,
  batchName,
  joinCode,
  userName,
  userEmail,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  batchName?: string;
  joinCode?: string;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const hubPath = variant === "admin" ? "/admin" : "/student";
  const isInBatch = BATCH_NAV_ITEMS[variant].some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isHub = !isInBatch;

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-violet-100 bg-white/70 backdrop-blur-sm md:flex sticky top-0 h-screen overflow-y-auto">
        {isHub ? (
          <HubSidebarContent
            variant={variant}
            subtitle={subtitle}
            pathname={pathname}
            userName={userName}
            userEmail={userEmail}
            onProfileClick={() => setProfileOpen(true)}
          />
        ) : (
          <BatchSidebarContent
            variant={variant}
            hubPath={hubPath}
            batchName={batchName}
            joinCode={joinCode}
            pathname={pathname}
            userName={userName}
            userEmail={userEmail}
            onProfileClick={() => setProfileOpen(true)}
          />
        )}
      </aside>

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        variant={variant}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}

function HubSidebarContent({
  variant,
  subtitle,
  pathname,
  userName,
  userEmail,
  onProfileClick,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  onProfileClick: () => void;
}) {
  const groups = HUB_NAV[variant];

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-600 to-violet-400 text-sm font-extrabold text-white">
          O
        </div>
        <span className="text-[17px] font-extrabold text-violet-700">
          OpenGrapes
        </span>
      </div>
      {subtitle && (
        <p className="ml-[46px] mt-[-2px] text-xs text-slate-400">
          {subtitle}
        </p>
      )}

      <div className="mt-6 flex flex-1 flex-col gap-1">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 mt-3 px-3 text-[10.5px] font-bold uppercase tracking-widest text-slate-400">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              const itemClass = cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-100 font-semibold text-violet-700"
                  : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"
              );

              if (item.label === "Profile") {
                return (
                  <button
                    key="profile"
                    onClick={onProfileClick}
                    className={cn(itemClass, "w-full text-left")}
                  >
                    <Icon className="size-[18px]" />
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={itemClass}
                >
                  <Icon className="size-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="flex-1" />

        <ProfileCard userName={userName} userEmail={userEmail} showSignOut onProfileClick={onProfileClick} />
      </div>
    </div>
  );
}

function ProfileCard({
  userName,
  userEmail,
  showSignOut = false,
  onProfileClick,
}: {
  userName?: string | null;
  userEmail?: string | null;
  showSignOut?: boolean;
  onProfileClick?: () => void;
}) {
  const initials = getInitials(userName, userEmail);

  const inner = (
    <>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-violet-400 text-xs font-bold text-white">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-slate-700">
          {userName ?? "User"}
        </p>
        {userEmail && (
          <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
        )}
      </div>
    </>
  );

  return (
    <div>
      {onProfileClick ? (
        <button
          onClick={onProfileClick}
          className="flex w-full items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-2.5 text-left transition-colors hover:bg-violet-100/60"
        >
          {inner}
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-2.5">
          {inner}
        </div>
      )}
      {showSignOut && <SignOutButton size="sm" className="mt-2 w-full" />}
    </div>
  );
}

function BatchSidebarContent({
  variant,
  hubPath,
  batchName,
  joinCode,
  pathname,
  userName,
  userEmail,
  onProfileClick,
}: {
  variant: SidebarVariant;
  hubPath: string;
  batchName?: string;
  joinCode?: string;
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  onProfileClick: () => void;
}) {
  const items = BATCH_NAV_ITEMS[variant];

  return (
    <>
      <div className="px-6 py-6">
        <h1 className="text-lg font-bold text-violet-700">OpenGrapes</h1>
        <p className="text-xs text-slate-500">
          {variant === "admin" ? "Admin panel" : "Student"}
        </p>
      </div>
      {batchName && (
        <div className="mx-3 mb-3 rounded-lg border border-violet-100 bg-violet-50 px-2 py-2">
          <Link
            href={hubPath}
            className="inline-flex items-center gap-1 rounded text-[13px] font-semibold text-violet-500 transition-colors hover:text-violet-700"
          >
            <span className="text-[15px] leading-none">‹</span>
            All batches
          </Link>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-700 px-1">
            {batchName}
          </p>
        </div>
      )}
      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              )}
            >
              <Icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {joinCode && (
        <div className="border-t border-violet-100 px-6 py-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Join code
          </p>
          <p className="mt-1 flex items-center gap-1 font-mono text-sm font-semibold text-black">
            {joinCode}
            <CopyJoinCode code={joinCode} />
          </p>
        </div>
      )}
      {variant === "student" && (
        <div className="border-t border-violet-100 px-3 py-3">
          <JoinBatchTrigger variant="sidebar" />
        </div>
      )}
      <div className=" px-3 py-4">
        <ProfileCard userName={userName} userEmail={userEmail} onProfileClick={onProfileClick} />
      </div>
    </>
  );
}

export function MobileSidebar({
  variant,
  subtitle,
  batchName,
  joinCode,
  userName,
  userEmail,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  batchName?: string;
  joinCode?: string;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const skipFocusMove = useRef(true);

  const hubPath = variant === "admin" ? "/admin" : "/student";
  const isInBatch = BATCH_NAV_ITEMS[variant].some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const isHub = !isInBatch;

  // Close the drawer whenever the route changes (e.g. a nav link was tapped).
  // Adjusted during render (not an effect) per React's guidance for state
  // that tracks a prop/derived value: https://react.dev/learn/you-might-not-need-an-effect
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Move focus into the drawer on open, and back to the toggle on close —
  // skip the very first render so mount doesn't steal page focus.
  useEffect(() => {
    if (skipFocusMove.current) {
      skipFocusMove.current = false;
      return;
    }
    if (open) {
      closeBtnRef.current?.focus();
    } else {
      toggleBtnRef.current?.focus();
    }
  }, [open]);

  const title = isHub ? "OpenGrapes" : batchName ?? "OpenGrapes";

  const handleProfileClick = () => {
    setOpen(false);
    setProfileOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-71 flex h-14 shrink-0 items-center justify-between border-b border-violet-100 bg-white/85 px-4 backdrop-blur-sm md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-linear-to-br from-violet-600 to-violet-400 text-xs font-extrabold text-white">
            O
          </div>
          <p className="truncate text-[15px] font-extrabold text-violet-700">{title}</p>
        </div>

        <button
          ref={toggleBtnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-sidebar-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-violet-600 transition-colors hover:bg-violet-50 active:bg-violet-100"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mounted &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className={cn(
                "fixed inset-0 z-70 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
                open ? "opacity-100" : "pointer-events-none opacity-0"
              )}
            />
            <div
              id="mobile-sidebar-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              inert={!open}
              className={cn(
                "fixed inset-y-0 left-0 z-80 w-70 max-w-[82%] bg-white shadow-2xl transition-transform duration-300 md:hidden",
                open ? "translate-x-0" : "-translate-x-full"
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                <X className="size-4" />
              </button>

              <div className="flex h-full flex-col overflow-y-auto">
                {isHub ? (
                  <HubSidebarContent
                    variant={variant}
                    subtitle={subtitle}
                    pathname={pathname}
                    userName={userName}
                    userEmail={userEmail}
                    onProfileClick={handleProfileClick}
                  />
                ) : (
                  <BatchSidebarContent
                    variant={variant}
                    hubPath={hubPath}
                    batchName={batchName}
                    joinCode={joinCode}
                    pathname={pathname}
                    userName={userName}
                    userEmail={userEmail}
                    onProfileClick={handleProfileClick}
                  />
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        variant={variant}
        userName={userName}
        userEmail={userEmail}
      />
    </>
  );
}
