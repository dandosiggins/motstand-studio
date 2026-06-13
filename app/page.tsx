export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex max-w-2xl flex-col gap-6 text-center">
        <h1 className="text-5xl font-bold">Motstand Studio</h1>

        <p className="text-lg text-gray-600">
          Upload your artwork, choose a shirt, complete checkout, and create a
          Gelato draft order for print fulfillment.
        </p>

        <div className="flex justify-center gap-4">
          <a href="/signup" className="rounded border px-6 py-3">
            Create Account
          </a>

          <a href="/login" className="rounded border px-6 py-3">
            Log In
          </a>
        </div>
      </div>
    </main>
  );
}