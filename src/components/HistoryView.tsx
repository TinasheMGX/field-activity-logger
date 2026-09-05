import { useMemo, useState } from "react";
import {
  ACTIVITY_TYPES,
  STATUSES,
  type ActivityLog,
  type ActivityType,
  type Status,
} from "../lib/types";
import { todayYmd } from "../lib/dates";
import {
  downloadXlsx,
  exportFilename,
  toTsv,
} from "../lib/export";
import { useStore } from "../lib/store";
import { ActivityTable } from "./ActivityTable";
import { Button, Label, Select, TextInput } from "./ui";

type TypeFilter = ActivityType | "All";
type StatusFilter = Status | "All";

export function HistoryView({
  onEdit,
  onToast,
}: {
  onEdit: (log: ActivityLog) => void;
  onToast: (msg: string) => void;
}) {
  const logs = useStore((s) => s.logs);
  const settings = useStore((s) => s.settings);
  const deleteLog = useStore((s) => s.deleteLog);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<TypeFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (l.deleted) return false;
      if (from && l.activity_date < from) return false;
      if (to && l.activity_date > to) return false;
      if (type !== "All" && l.activity_type !== type) return false;
      if (status !== "All" && l.status !== status) return false;
      return true;
    });
  }, [logs, from, to, type, status]);

  // Display newest-first; export chronologically so it pastes in date order.
  const forDisplay = useMemo(
    () => [...filtered].sort((a, b) => b.activity_date.localeCompare(a.activity_date)),
    [filtered],
  );
  const forExport = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          a.activity_date.localeCompare(b.activity_date) ||
          a.created_at.localeCompare(b.created_at),
      ),
    [filtered],
  );

  const hasFilters = from || to || type !== "All" || status !== "All";

  async function copyTsv() {
    if (forExport.length === 0) return onToast("Nothing to copy");
    const tsv = toTsv(forExport, settings);
    try {
      await navigator.clipboard.writeText(tsv);
      onToast(`Copied ${forExport.length} row(s) — paste at A2`);
    } catch {
      onToast("Clipboard blocked — use Download instead");
    }
  }

  function download() {
    if (forExport.length === 0) return onToast("Nothing to export");
    downloadXlsx(forExport, settings, exportFilename("xlsx", todayYmd()));
    onToast(`Exported ${forExport.length} row(s)`);
  }

  function confirmDelete(log: ActivityLog) {
    if (window.confirm(`Delete the ${log.activity_type} entry for ${log.merchant_name}?`)) {
      deleteLog(log.id);
      onToast("Entry deleted");
    }
  }

  return (
    <div className="space-y-3 p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <Label>From</Label>
            <TextInput
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="block">
            <Label>To</Label>
            <TextInput
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="block">
            <Label>Activity type</Label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as TypeFilter)}
            >
              <option value="All">All types</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <Label>Status</Label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="All">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {hasFilters && (
          <button
            className="mt-2 text-xs font-semibold text-brand underline"
            onClick={() => {
              setFrom("");
              setTo("");
              setType("All");
              setStatus("All");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {forDisplay.length} of {logs.length} entries
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={copyTsv}>
          Copy for Excel (TSV)
        </Button>
        <Button variant="secondary" onClick={download}>
          Download .xlsx
        </Button>
      </div>

      <ActivityTable
        logs={forDisplay}
        onEdit={onEdit}
        onDelete={confirmDelete}
      />
    </div>
  );
}
