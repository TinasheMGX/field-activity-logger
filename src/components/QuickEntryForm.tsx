import { useEffect, useState } from "react";
import {
  ACTIVITY_TYPES,
  STATUSES,
  TERMINAL_TYPES,
  type ActivityInput,
  type ActivityLog,
  type ActivityType,
  type Status,
} from "../lib/types";
import { todayYmd } from "../lib/dates";
import { useStore } from "../lib/store";
import { Button, Label, Select, TextArea, TextInput } from "./ui";

function blank(): ActivityInput {
  return {
    activity_date: todayYmd(),
    activity_type: "Deployment",
    terminal_count: 0,
    merchant_name: "",
    merchant_location: "",
    customer_issues: "",
    action_taken: "",
    status: "Completed",
  };
}

function fromLog(log: ActivityLog): ActivityInput {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = log;
  return rest;
}

export function QuickEntryForm({
  editing,
  onDone,
  onToast,
}: {
  editing: ActivityLog | null;
  onDone: () => void;
  onToast: (msg: string) => void;
}) {
  const addLog = useStore((s) => s.addLog);
  const updateLog = useStore((s) => s.updateLog);
  const [form, setForm] = useState<ActivityInput>(() =>
    editing ? fromLog(editing) : blank(),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(editing ? fromLog(editing) : blank());
    setError(null);
  }, [editing]);

  const terminalRelevant = TERMINAL_TYPES.includes(form.activity_type);

  function set<K extends keyof ActivityInput>(key: K, value: ActivityInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    if (!form.merchant_name.trim()) return setError("Merchant name is required.");
    if (!form.merchant_location.trim())
      return setError("Merchant location is required.");
    if (!form.action_taken.trim())
      return setError("Action taken / resolution is required.");

    const clean: ActivityInput = {
      ...form,
      merchant_name: form.merchant_name.trim(),
      merchant_location: form.merchant_location.trim(),
      customer_issues: form.customer_issues.trim(),
      action_taken: form.action_taken.trim(),
      terminal_count: Math.max(0, Math.trunc(Number(form.terminal_count) || 0)),
    };

    if (editing) {
      updateLog(editing.id, clean);
      onToast("Entry updated");
      onDone();
    } else {
      addLog(clean);
      onToast("Logged ✓");
      setForm(blank()); // clear and reset date to today
      setError(null);
    }
  }

  return (
    <div className="space-y-3 p-4">
      {editing && (
        <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>Editing entry</span>
          <button className="font-semibold underline" onClick={onDone}>
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <Label>Date</Label>
          <TextInput
            type="date"
            value={form.activity_date}
            max={todayYmd()}
            onChange={(e) => set("activity_date", e.target.value)}
          />
        </label>
        <label className="block">
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as Status)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <label className="block">
        <Label>Activity type</Label>
        <Select
          value={form.activity_type}
          onChange={(e) => set("activity_type", e.target.value as ActivityType)}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>

      {terminalRelevant && (
        <label className="block rounded-xl bg-brand/5 p-3 ring-1 ring-brand/30">
          <Label hint="applies to Deployment / Idle Recall">
            Terminal count
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-11 !px-0 text-lg"
              onClick={() =>
                set("terminal_count", Math.max(0, form.terminal_count - 1))
              }
              aria-label="Decrease terminal count"
            >
              &minus;
            </Button>
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              className="text-center text-lg font-semibold"
              value={form.terminal_count}
              onChange={(e) => set("terminal_count", Number(e.target.value))}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-11 !px-0 text-lg"
              onClick={() => set("terminal_count", form.terminal_count + 1)}
              aria-label="Increase terminal count"
            >
              +
            </Button>
          </div>
        </label>
      )}

      <label className="block">
        <Label>Merchant name</Label>
        <TextInput
          value={form.merchant_name}
          placeholder="e.g. Steers Samora Machel"
          onChange={(e) => set("merchant_name", e.target.value)}
        />
      </label>

      <label className="block">
        <Label>Merchant location</Label>
        <TextInput
          value={form.merchant_location}
          placeholder="e.g. Harare - Samora Machel"
          onChange={(e) => set("merchant_location", e.target.value)}
        />
      </label>

      <label className="block">
        <Label hint="optional">Customer issues / challenges</Label>
        <TextArea
          value={form.customer_issues}
          placeholder="Errors, balance/order sweeps, terminal faults…"
          onChange={(e) => set("customer_issues", e.target.value)}
        />
      </label>

      <label className="block">
        <Label>Action taken / resolution</Label>
        <TextArea
          value={form.action_taken}
          placeholder="Configs, testing, tickets raised, dispatch details…"
          onChange={(e) => set("action_taken", e.target.value)}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button className="w-full py-3 text-base" onClick={submit}>
        {editing ? "Save changes" : "Submit & Log"}
      </Button>
    </div>
  );
}
