"use client";

// Vendors are a real per-restaurant model (see Vendor in schema.prisma) — new ones
// are created automatically when a form saves an unrecognized name (findOrCreateVendor),
// so this only needs to offer the existing ones as quick picks. No add/remove here.
export function VendorPicker({ vendorNames, onPick }: { vendorNames: string[]; onPick: (name: string) => void }) {
  if (vendorNames.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {vendorNames.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
