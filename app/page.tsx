import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold">🧬 Biometric Auth Demo</h1>
      <div className="mt-8 space-x-4">
        <Link href="/register" className="bg-blue-500 text-white px-4 py-2 rounded">Register</Link>
        <Link href="/login" className="bg-green-500 text-white px-4 py-2 rounded">Login</Link>
      </div>
      <p className="mt-8 text-gray-600">Uses Touch ID / Windows Hello – no database, in‑memory only.</p>
    </div>
  );
}