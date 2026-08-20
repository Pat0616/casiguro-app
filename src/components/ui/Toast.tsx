export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-lg">
      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" />
      {message}
    </div>
  );
}
