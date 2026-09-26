export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-semibold text-heading">Calorie Tracker</h1>
      <div className="h-1 w-28 rounded-sm bg-linear-to-r from-accent to-accent-secondary" />
      <p className="max-w-md text-lg">
        Track calories and protein, build diet plans, and calculate your daily needs.
      </p>
      <div className="rounded-2xl border-2 border-accent bg-surface px-6 py-4">
        <span className="text-accent-secondary">Theme check:</span>{" "}
        <a href="#" className="transition-colors hover:text-accent-hover">
          hover me
        </a>
      </div>
    </main>
  );
}
