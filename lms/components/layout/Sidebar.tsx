"use client";

import {
  Award,
  BadgeCheck,
  Building2,
  CloudLightning,
  ClipboardList,
  FolderOpen,
  Grid2x2,
  Layers,
  LayoutDashboard,
  Megaphone,
  Network,
  Menu,
  CalendarRange,
  MessageSquare,
  MessagesSquare,
  PenLine,
  NotebookText,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { JoinBatchTrigger } from "@/components/join/JoinBatchTrigger";
import { CopyJoinCode } from "@/components/ui/CopyJoinCode";
import { getInitials, plumSphere } from "@/components/ui/avatar";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { GOV_EMBLEM_SRC } from "@/lib/gov-emblem";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export type SidebarVariant = "admin" | "student" | "platform";

interface HubNavGroup {
  /** Empty string renders the group without a heading. */
  label: string;
  items: NavItem[];
}

/** Top-level ("hub") route for each variant. */
const HUB_PATH: Record<SidebarVariant, string> = {
  admin: "/admin",
  student: "/student",
  platform: "/platform",
};

/**
 * Course-workspace navigation.
 *
 * The trainer list is grouped rather than flat: fifteen undifferentiated
 * destinations is a wall to scan every time. The groups follow the trainer's
 * actual jobs — run the course, author material, look after the trainees, and
 * feed the assistant.
 *
 * The trainee list stays a single unlabelled group; six items need no
 * signposting, and adding headings to them would be decoration.
 */
const BATCH_NAV_ITEMS: Record<SidebarVariant, HubNavGroup[]> = {
  admin: [
    {
      label: "Course",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/weeks", label: "Weeks", icon: CalendarRange },
        { href: "/admin/meetings", label: "Meetings", icon: Video },
        { href: "/admin/notices", label: "Notices", icon: Megaphone },
        { href: "/admin/competency", label: "Competency", icon: Target },
      ],
    },
    {
      label: "Material",
      items: [
        { href: "/admin/notes", label: "Notes", icon: NotebookText },
        { href: "/admin/library", label: "Library", icon: FolderOpen },
        { href: "/admin/tests", label: "Tests", icon: ClipboardList },
        { href: "/admin/assignments", label: "Assignments", icon: PenLine },
        { href: "/admin/drill", label: "Forecast drill", icon: CloudLightning },
      ],
    },
    {
      label: "Trainees",
      items: [
        { href: "/admin/students", label: "Roster", icon: Users },
        { href: "/admin/discussion", label: "Discussion", icon: MessagesSquare },
        { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
        { href: "/admin/certificates", label: "Certificates", icon: Award },
      ],
    },
    {
      label: "MeghDoot",
      items: [
        { href: "/admin/knowledge", label: "Knowledge", icon: Network },
        { href: "/admin/ai", label: "Ask MeghDoot", icon: Sparkles },
      ],
    },
  ],
  // Readings, recordings, quizzes and assignments are not listed here: they all
  // live inside the course rail at /student/course, grouped by week and marked
  // with what the trainee has finished. Repeating them as four flat indexes
  // gave the trainee two navigations for one set of content.
  //
  // Discussion stays top-level because the rail only links into threads that
  // already exist — asking a new question needs the index. SWAYAM keeps Q&A
  // top-level for the same reason.
  student: [
    {
      label: "",
      items: [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student/course", label: "Course content", icon: CalendarRange },
        { href: "/student/discussion", label: "Discussion", icon: MessagesSquare },
        { href: "/student/meetings", label: "Meetings", icon: Video },
        { href: "/student/feedback", label: "Feedback", icon: MessageSquare },
        { href: "/student/ai", label: "MeghDoot", icon: Sparkles },
      ],
    },
  ],
  // The ministry admin owns no single course, so it never enters a batch
  // workspace — an empty list keeps it on the hub view permanently.
  platform: [],
};

const HUB_NAV: Record<SidebarVariant, HubNavGroup[]> = {
  admin: [
    {
      label: "Workspace",
      items: [{ href: "/admin", label: "All courses", icon: Grid2x2, exact: true }],
    },
    {
      label: "Account",
      items: [{ href: "/admin/profile", label: "Profile", icon: User }],
    },
  ],
  student: [
    {
      label: "Learning",
      items: [
        { href: "/student", label: "My courses", icon: Grid2x2, exact: true },
        { href: "/student/recommendations", label: "Recommended for you", icon: Sparkles },
        { href: "/student/competency", label: "My competencies", icon: Target },
        { href: "/student/drill", label: "Forecast drill", icon: CloudLightning },
        { href: "/student/passport", label: "Competency passport", icon: BadgeCheck },
        { href: "/student/certificates", label: "My certificates", icon: Award },
      ],
    },
    {
      label: "Account",
      items: [{ href: "/student/profile", label: "Profile", icon: User }],
    },
  ],
  platform: [
    {
      label: "Ministry",
      items: [
        { href: "/platform", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/platform/analyst", label: "Analyst", icon: Sparkles },
        { href: "/platform/competency", label: "Competency", icon: Target },
        { href: "/platform/skills", label: "Skills", icon: Layers },
        { href: "/platform/departments", label: "Offices", icon: Building2 },
        { href: "/platform/feedback", label: "Feedback", icon: MessageSquare },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/platform/announcements", label: "Announcements", icon: Megaphone },
        { href: "/platform/graph", label: "Knowledge base", icon: Network },
      ],
    },
    {
      label: "Public",
      items: [{ href: "/platform/verify", label: "Verify a certificate", icon: ShieldCheck }],
    },
  ],
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/* ONE nav-item treatment, hub and batch alike. */
function navItemClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors",
    active
      ? "bg-plum-100 font-semibold text-plum-700"
      : "font-medium text-ink-500 hover:bg-plum-50 hover:text-ink-900"
  );
}

function SphereLogo({ className }: { className?: string }) {
  // When the deploying team has supplied the State Emblem, the brand mark is
  // the emblem; otherwise it stays the plum sphere. See lib/gov-emblem.ts.
  if (GOV_EMBLEM_SRC) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={GOV_EMBLEM_SRC}
        alt="State Emblem of India"
        className={cn("block h-9 w-auto shrink-0", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("block size-8 shrink-0 rounded-full", className)}
      style={plumSphere}
    />
  );
}

export function Sidebar({
  variant,
  subtitle,
  batchName,
  joinCode,
  userName,
  userEmail,
  slot,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  batchName?: string;
  joinCode?: string;
  userName?: string | null;
  userEmail?: string | null;
  /** A shell control rendered in the sidebar header (e.g. the notification bell). */
  slot?: ReactNode;
}) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const hubPath = HUB_PATH[variant];
  const isInBatch = BATCH_NAV_ITEMS[variant]
    .flatMap((g) => g.items)
    .some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const isHub = !isInBatch;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-hair bg-paper md:flex print:!hidden">
        {isHub ? (
          <HubSidebarContent
            variant={variant}
            subtitle={subtitle}
            pathname={pathname}
            userName={userName}
            userEmail={userEmail}
            slot={slot}
            onProfileClick={variant === "platform" ? undefined : () => setProfileOpen(true)}
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
            slot={slot}
            onProfileClick={variant === "platform" ? undefined : () => setProfileOpen(true)}
          />
        )}
      </aside>

      {variant !== "platform" && (
        <ProfileDrawer
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          variant={variant}
          userName={userName}
          userEmail={userEmail}
        />
      )}
    </>
  );
}

function HubSidebarContent({
  variant,
  subtitle,
  pathname,
  userName,
  userEmail,
  slot,
  onProfileClick,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  slot?: ReactNode;
  onProfileClick?: () => void;
}) {
  const groups = HUB_NAV[variant];

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="flex items-start gap-2.5">
        <SphereLogo />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-medium leading-snug text-ink-900">
            Ministry of Earth Sciences
          </p>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {subtitle}
            </p>
          )}
        </div>
        {slot && <div className="ml-auto -mr-1">{slot}</div>}
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-1">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 mt-3 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const itemClass = navItemClass(isActive(pathname, item));

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
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-paper"
        style={plumSphere}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-ink-700">
          {userName ?? "User"}
        </p>
        {userEmail && (
          <p className="truncate text-[11px] text-ink-300">{userEmail}</p>
        )}
      </div>
    </>
  );

  return (
    <div>
      {onProfileClick ? (
        <button
          onClick={onProfileClick}
          className="flex w-full items-center gap-3 rounded-[10px] border border-hair p-2.5 text-left transition-colors hover:bg-plum-50"
        >
          {inner}
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-[10px] border border-hair p-2.5">
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
  slot,
  onProfileClick,
}: {
  variant: SidebarVariant;
  hubPath: string;
  batchName?: string;
  joinCode?: string;
  pathname: string;
  userName?: string | null;
  userEmail?: string | null;
  slot?: ReactNode;
  onProfileClick?: () => void;
}) {
  const groups = BATCH_NAV_ITEMS[variant];

  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-6">
        <SphereLogo />
        <div className="min-w-0">
          <h1 className="font-display text-[15px] font-medium leading-snug text-ink-900">
            Ministry of Earth Sciences
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            {variant === "admin" ? "Admin panel" : variant === "student" ? "Student" : "Ministry"}
          </p>
        </div>
        {slot && <div className="ml-auto -mr-1">{slot}</div>}
      </div>
      {batchName && (
        <div className="mx-3 mb-3 rounded-[10px] border border-hair bg-sunken/40 px-2 py-2">
          <Link
            href={hubPath}
            className="inline-flex items-center gap-1 rounded text-[13px] font-semibold text-plum-700 transition-colors hover:text-plum-600"
          >
            <span className="text-[15px] leading-none">‹</span>
            All batches
          </Link>
          <p className="mt-0.5 truncate px-1 text-sm font-semibold text-ink-900">
            {batchName}
          </p>
        </div>
      )}
      <nav className="flex-1 px-3">
        {groups.map((group) => (
          <div key={group.label || "main"} className="space-y-1">
            {group.label && (
              <p className="mb-2 mt-4 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 first:mt-0">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navItemClass(isActive(pathname, item))}
                >
                  <Icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {joinCode && (
        <div className="border-t border-hair px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            Join code
          </p>
          <p className="mt-1 flex items-center gap-1 font-mono text-sm font-semibold text-ink-900">
            {joinCode}
            <CopyJoinCode code={joinCode} />
          </p>
        </div>
      )}
      {variant === "student" && (
        <div className="border-t border-hair px-3 py-3">
          <JoinBatchTrigger variant="sidebar" />
        </div>
      )}
      <div className="px-3 py-4">
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
  slot,
}: {
  variant: SidebarVariant;
  subtitle?: string;
  batchName?: string;
  joinCode?: string;
  userName?: string | null;
  userEmail?: string | null;
  slot?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const skipFocusMove = useRef(true);

  const hubPath = HUB_PATH[variant];
  const isInBatch = BATCH_NAV_ITEMS[variant]
    .flatMap((g) => g.items)
    .some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
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

  const title = isHub ? "Capacity Connect" : batchName ?? "Capacity Connect";

  const handleProfileClick = () => {
    setOpen(false);
    setProfileOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-71 flex h-14 shrink-0 items-center justify-between border-b border-hair bg-paper/90 px-4 backdrop-blur reduce-transparency:bg-paper reduce-transparency:backdrop-blur-none md:hidden print:!hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <SphereLogo />
          <p className="truncate font-display text-[15px] font-medium text-ink-900">{title}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {slot}
          <button
            ref={toggleBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-sidebar-drawer"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-ink-700 transition-colors hover:bg-plum-50 active:bg-plum-100"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {mounted &&
        createPortal(
          <>
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className={cn(
                "fixed inset-0 z-70 bg-ink-900/40 backdrop-blur-[2px] transition-opacity duration-300 reduce-transparency:backdrop-blur-none md:hidden",
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
                "fixed inset-y-0 left-0 z-80 w-70 max-w-[82%] bg-paper transition-transform duration-300 md:hidden",
                open ? "translate-x-0" : "-translate-x-full"
              )}
              style={{
                transitionTimingFunction: "var(--ease-drawer)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-plum-50 hover:text-ink-900"
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
                    onProfileClick={variant === "platform" ? undefined : handleProfileClick}
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
                    onProfileClick={variant === "platform" ? undefined : handleProfileClick}
                  />
                )}
              </div>
            </div>
          </>,
          document.body
        )}

      {variant !== "platform" && (
        <ProfileDrawer
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          variant={variant}
          userName={userName}
          userEmail={userEmail}
        />
      )}
    </>
  );
}
