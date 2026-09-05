import { useState } from "react";
import { useStore } from "../lib/store";
import { Button, Label, TextInput } from "./ui";

export function SettingsModal({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [officer, setOfficer] = useState(settings.officer_name);
  const [branch, setBranch] = useState(settings.branch_name);

  function save() {
    setSettings({
      officer_name: officer.trim() || settings.officer_name,
      branch_name: branch.trim() || settings.branch_name,
    });
    onToast("Settings saved");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl safe-bottom sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Settings</h2>
        <p className="mb-4 text-xs text-slate-500">
          These populate the Officer and Branch columns on every export.
        </p>

        <div className="space-y-3">
          <label className="block">
            <Label>Officer name</Label>
            <TextInput
              value={officer}
              placeholder="e.g. Tinashe Mariridza"
              onChange={(e) => setOfficer(e.target.value)}
            />
          </label>
          <label className="block">
            <Label hint="optional">Branch name</Label>
            <TextInput
              value={branch}
              placeholder="e.g. Digital"
              onChange={(e) => setBranch(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
