"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createCoupon, updateCoupon } from "@/app/actions/coupons";
import type { CouponItem, CouponType, CouponValueType } from "@/lib/coupons";

export function CouponForm({
  item,
  type,
  trigger,
}: {
  item?: CouponItem;
  type: CouponType;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState(item?.merchant ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [code, setCode] = useState(item?.code ?? "");
  const [value, setValue] = useState(item ? String(item.value) : "");
  const [valueType, setValueType] = useState<CouponValueType>(item?.valueType ?? "flat");
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMerchant(item?.merchant ?? "");
    setTitle(item?.title ?? "");
    setCode(item?.code ?? "");
    setValue(item ? String(item.value) : "");
    setValueType(item?.valueType ?? "flat");
    setExpiryDate(item?.expiryDate ?? "");
    setNotes(item?.notes ?? "");
    setError(null);
  }

  function handleSave() {
    if (!merchant.trim()) {
      setError("Enter a merchant or store name");
      return;
    }
    if (!title.trim()) {
      setError("Describe the offer");
      return;
    }
    const parsedValue = parseFloat(value);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError("Enter a valid value");
      return;
    }
    const input = {
      type,
      merchant: merchant.trim(),
      title: title.trim(),
      code: code.trim() || undefined,
      value: parsedValue,
      valueType,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    };
    startTransition(async () => {
      const result = item ? await updateCoupon(item.id, input) : await createCoupon(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={item ? "Edit Entry" : "New Entry"}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Merchant / Store</label>
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Amazon" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">What&apos;s the offer?</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 20% off electronics" />
          </div>
          {type === "coupon" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Coupon Code (optional)</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE20" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Value</label>
              <Input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Value Type</label>
              <Select value={valueType} onChange={(e) => setValueType(e.target.value as CouponValueType)}>
                <option value="flat">₹ Flat amount</option>
                <option value="percent">% Percent off</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Expiry Date (optional)</label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes (optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Min order ₹999" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSave} disabled={isPending} size="lg">
            {isPending ? "Saving…" : "Save Entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
