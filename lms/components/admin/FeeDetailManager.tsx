"use client";

import { Receipt, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition, useActionState } from "react";
import toast from "react-hot-toast";
import { deletePayment, recordPayment, setFeeAmount } from "@/app/admin/fees/actions";
import type { Fee, Payment } from "@/app/generated/prisma/client";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, Input, Select } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { formatDate, formatPaise, getFeeStatus } from "@/lib/utils";
import { paymentMethods } from "@/lib/validations/fee";

type StudentWithFee = {
  id: string;
  name: string | null;
  email: string;
  fee: Fee | null;
  payments: Payment[];
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partially paid",
  UNPAID: "Unpaid",
};

const STATUS_COLORS: Record<string, BadgeColor> = {
  PAID: "green",
  PARTIAL: "amber",
  UNPAID: "red",
};

export function FeeDetailManager({ student }: { student: StudentWithFee }) {
  const totalAmount = student.fee?.totalAmount ?? 0;
  const paidAmount = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const status = getFeeStatus(totalAmount, paidAmount);

  const [feeState, feeAction, feePending] = useActionState(setFeeAmount, initialActionState);
  const [paymentState, paymentAction, paymentPending] = useActionState(recordPayment, initialActionState);
  const paymentFormRef = useRef<HTMLFormElement>(null);

  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (feeState?.success) toast.success("Fee amount updated");
    else if (feeState?.error) toast.error(feeState.error);
  }, [feeState]);

  useEffect(() => {
    if (paymentState?.success) {
      toast.success("Payment recorded");
      paymentFormRef.current?.reset();
    } else if (paymentState?.error) {
      toast.error(paymentState.error);
    }
  }, [paymentState]);

  function handleDeletePayment(id: string) {
    if (!confirm("Delete this payment record?")) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await deletePayment(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Payment deleted");
      setPendingId(null);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{student.name ?? "Unnamed"}</h1>
        <p className="mt-1 text-sm text-slate-500">{student.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fee summary</CardTitle>
            <Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
          </CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total fee</span>
              <span className="font-medium text-slate-800">{formatPaise(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid</span>
              <span className="font-medium text-emerald-600">{formatPaise(paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Outstanding</span>
              <span className="font-medium text-amber-600">
                {formatPaise(Math.max(totalAmount - paidAmount, 0))}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Set total fee</CardTitle>
          </CardHeader>
          <form action={feeAction} className="space-y-4">
            <input type="hidden" name="studentId" value={student.id} />
            <FormField
              label="Total fee amount (₹)"
              htmlFor="totalAmount"
              error={feeState?.fieldErrors?.totalAmount?.[0]}
            >
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={totalAmount / 100}
              />
            </FormField>
            <Button type="submit" loading={feePending}>
              Save
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
          </CardHeader>
          <form ref={paymentFormRef} action={paymentAction} className="space-y-4">
            <input type="hidden" name="studentId" value={student.id} />
            <FormField label="Amount (₹)" htmlFor="amount" error={paymentState?.fieldErrors?.amount?.[0]}>
              <Input id="amount" name="amount" type="number" min={0} step="0.01" placeholder="0.00" />
            </FormField>
            <FormField label="Date" htmlFor="date" error={paymentState?.fieldErrors?.date?.[0]}>
              <Input id="date" name="date" type="date" defaultValue={today} />
            </FormField>
            <FormField label="Method" htmlFor="method" error={paymentState?.fieldErrors?.method?.[0]}>
              <Select id="method" name="method" defaultValue="UPI">
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Note (optional)" htmlFor="note" error={paymentState?.fieldErrors?.note?.[0]}>
              <Input id="note" name="note" placeholder="e.g. First installment" />
            </FormField>
            <Button type="submit" loading={paymentPending}>
              Record payment
            </Button>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        {student.payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments recorded" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {student.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formatPaise(payment.amount)} · {payment.method}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(payment.date)}
                    {payment.note ? ` · ${payment.note}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  loading={pending && pendingId === payment.id}
                  onClick={() => handleDeletePayment(payment.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
