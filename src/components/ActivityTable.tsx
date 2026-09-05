import { formatExcelDate } from "../lib/dates";
import { TERMINAL_TYPES, type ActivityLog } from "../lib/types";
import { Badge, Button } from "./ui";

function Row({
  log,
  onEdit,
  onDelete,
}: {
  log: ActivityLog;
  onEdit: (log: ActivityLog) => void;
  onDelete: (log: ActivityLog) => void;
}) {
  const showCount = TERMINAL_TYPES.includes(log.activity_type);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">
              {log.merchant_name}
            </span>
            <Badge status={log.status} />
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {log.merchant_location}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-medium text-slate-500">
            {formatExcelDate(log.activity_date)}
          </div>
          <div className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {log.activity_type}
            {showCount && (
              <span className="ml-1 font-bold text-brand">
                · {log.terminal_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {(log.customer_issues || log.action_taken) && (
        <dl className="mt-2 space-y-1 text-xs">
          {log.customer_issues && (
            <div>
              <dt className="inline font-semibold text-slate-500">Issue: </dt>
              <dd className="inline text-slate-700">{log.customer_issues}</dd>
            </div>
          )}
          {log.action_taken && (
            <div>
              <dt className="inline font-semibold text-slate-500">Action: </dt>
              <dd className="inline text-slate-700">{log.action_taken}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-2">
        <Button variant="ghost" className="!py-1.5" onClick={() => onEdit(log)}>
          Edit
        </Button>
        <Button
          variant="danger"
          className="!py-1.5"
          onClick={() => onDelete(log)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function ActivityTable({
  logs,
  onEdit,
  onDelete,
}: {
  logs: ActivityLog[];
  onEdit: (log: ActivityLog) => void;
  onDelete: (log: ActivityLog) => void;
}) {
  if (logs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500">
        No entries match. Log an activity or clear the filters.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Row key={log.id} log={log} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
