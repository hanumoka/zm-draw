'use client';

import dynamic from 'next/dynamic';

// Konva requires window, so we need to dynamically import
const DrawCanvas = dynamic(
  () => import('@zm-draw/react').then((mod) => mod.DrawCanvas),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">zm-draw Demo</h1>
          <p className="text-gray-600">
            Figma-like diagram editor for developers (ERD, Flowchart)
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Canvas</h2>
          <DrawCanvas
            width={1000}
            height={600}
            backgroundColor="#fafafa"
            showGrid={true}
            gridSize={20}
          />
        </section>

        <section className="mt-8 text-sm text-gray-500">
          <p>
            <strong>Tech Stack:</strong> Konva.js, React 19, Next.js 15, TypeScript
          </p>
        </section>
      </div>
    </main>
  );
}
