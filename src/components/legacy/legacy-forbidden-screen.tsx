export function LegacyForbiddenScreen() {
  return (
    <main className="min-h-screen bg-[#222] text-white">
      <div
        className="mx-auto pt-[10vh] text-center"
        style={{ fontFamily: "Calibri, Arial, sans-serif" }}
      >
        <h1 className="text-4xl font-bold">Forbidden</h1>
        <h2 className="mt-4 text-2xl font-bold">
          You don&apos;t have the right privilege to use this functionality
        </h2>
      </div>
    </main>
  );
}
