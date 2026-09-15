import { Search, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@/app/generated/prisma/client";
import type { ApprovalStatus, Role } from "@/app/generated/prisma/enums";
import { TeacherStatusButton } from "@/components/platform/TeacherStatusButton";
import { UserRoleSelect } from "@/components/platform/UserRoleSelect";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/roles";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;
const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

const STATUS_COLOR: Record<ApprovalStatus, "green" | "amber" | "red" | "slate"> = {
  APPROVED: "green",
  PENDING: "amber",
  SUSPENDED: "red",
  REJECTED: "slate",
};

const ROLE_VALUES: Role[] = ["SUPER_ADMIN", "ADMIN", "STUDENT"];
const STATUS_VALUES: ApprovalStatus[] = ["APPROVED", "PENDING", "SUSPENDED", "REJECTED"];

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    department?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const params = await searchParams;
  const q = params.q?.trim() || "";
  const roleFilter = ROLE_VALUES.includes(params.role as Role) ? (params.role as Role) : undefined;
  const statusFilter = STATUS_VALUES.includes(params.status as ApprovalStatus)
    ? (params.status as ApprovalStatus)
    : undefined;
  const departmentFilter = params.department?.trim() || "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(departmentFilter
      ? { profile: { department: { contains: departmentFilter, mode: "insensitive" } } }
      : {}),
  };

  const [total, people, departments] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
        profile: { select: { department: true, organisation: true } },
        _count: { select: { enrollments: true, ownedBatches: true, certificates: true } },
      },
    }),
    prisma.profile.findMany({
      where: { department: { not: null } },
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
  ]);

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-normal text-ink-900">People</h1>
          <p className="mt-1 text-sm text-ink-500">
            {total} {total === 1 ? "person" : "people"} across the platform.
          </p>
        </div>
        <Link href="/platform" className="text-sm text-plum-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      {/* Filters — a plain GET form, no client JS required. */}
      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
            <Input name="q" defaultValue={q} placeholder="Search name or email" className="pl-9" />
          </div>
          <Select name="role" defaultValue={roleFilter ?? ""} aria-label="Role">
            <option value="">All roles</option>
            {ROLE_VALUES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={statusFilter ?? ""} aria-label="Status">
            <option value="">All statuses</option>
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Input
              name="department"
              defaultValue={departmentFilter}
              placeholder="Department"
              list="dept-list"
            />
            <datalist id="dept-list">
              {departments.map((d) => (
                <option key={d.department} value={d.department ?? ""} />
              ))}
            </datalist>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper hover:bg-plum-700"
            >
              Filter
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Users className="size-5 text-ink-300" />
              Directory
            </span>
          </CardTitle>
        </CardHeader>
        {people.length === 0 ? (
          <EmptyState icon={Users} title="No people match these filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Person</th>
                  <th className="py-2 pr-4 font-normal">Role</th>
                  <th className="py-2 pr-4 font-normal">Status</th>
                  <th className="py-2 pr-4 font-normal">Department</th>
                  <th className="py-2 pr-4 text-right font-normal">Courses</th>
                  <th className="py-2 pr-4 text-right font-normal">Certs</th>
                  <th className="py-2 pr-4 font-normal">Last active</th>
                  <th className="py-2 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {people.map((p) => {
                  const courses = p.role === "STUDENT" ? p._count.enrollments : p._count.ownedBatches;
                  return (
                    <tr key={p.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-ink-900">{p.name ?? "Unnamed"}</p>
                        <p className="text-xs text-ink-500">{p.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <UserRoleSelect userId={p.id} role={p.role} />
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={STATUS_COLOR[p.status]}>{p.status.toLowerCase()}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-ink-700">
                        {p.profile?.department ?? <span className="text-ink-300">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{courses}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">
                        {p._count.certificates}
                      </td>
                      <td className="py-3 pr-4 font-mono text-ink-500">{formatDate(p.updatedAt)}</td>
                      <td className="py-3">
                        {p.role === "ADMIN" && p.status === "APPROVED" && (
                          <TeacherStatusButton teacherId={p.id} status="SUSPENDED" variant="outline">
                            Suspend
                          </TeacherStatusButton>
                        )}
                        {p.role === "ADMIN" && p.status === "SUSPENDED" && (
                          <TeacherStatusButton teacherId={p.id} status="APPROVED" variant="primary">
                            Reinstate
                          </TeacherStatusButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          basePath="/platform/people"
          params={{ q, role: roleFilter, status: statusFilter, department: departmentFilter }}
        />
      </Card>
    </div>
  );
}
