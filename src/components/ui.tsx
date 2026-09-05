import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const cx = (...parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
  } as const;
  return <button className={cx(base, variants[variant], className)} {...props} />;
}

export function Label({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
      <span>{children}</span>
      {hint && <span className="font-normal text-slate-400">{hint}</span>}
    </span>
  );
}

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 placeholder:text-slate-400";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(fieldClass, props.className)} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={cx(fieldClass, "resize-y leading-snug", props.className)}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(fieldClass, "appearance-none bg-white", props.className)}
    />
  );
}

export function Badge({ status }: { status: "Completed" | "Pending" }) {
  const styles =
    status === "Completed"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        styles,
      )}
    >
      {status}
    </span>
  );
}
