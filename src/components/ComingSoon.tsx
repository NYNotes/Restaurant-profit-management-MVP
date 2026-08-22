export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">{title} is built in {phase}.</p>
      </div>
    </div>
  );
}
