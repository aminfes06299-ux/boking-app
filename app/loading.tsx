export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse" aria-busy="true">
      <div className="h-8 w-56 rounded-lg bg-line" />
      <div className="mt-3 h-4 w-72 rounded bg-line" />
      <div className="mt-8 grid gap-5 md:grid-cols-[1.4fr_1fr]"><div className="h-44 rounded-3xl bg-line" /><div className="h-44 rounded-3xl bg-line" /></div>
      <div className="mt-5 h-20 rounded-2xl bg-line" />
    </div>
  );
}
