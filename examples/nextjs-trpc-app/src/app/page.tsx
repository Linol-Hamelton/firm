import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Next.js + tRPC + FIRM Validator</h1>
      <p>
        Production-ready example of Next.js 14+ App Router with tRPC and FIRM validation.
      </p>

      <h2>Features</h2>
      <ul>
        <li>✅ Next.js 14+ App Router</li>
        <li>✅ tRPC for type-safe API</li>
        <li>✅ FIRM validation for inputs</li>
        <li>✅ React Query for data fetching</li>
        <li>✅ SuperJSON for serialization</li>
        <li>✅ Full TypeScript type safety</li>
      </ul>

      <h2>Pages</h2>
      <ul>
        <li>
          <Link href="/users">User Management</Link> - Full CRUD with FIRM validation
        </li>
      </ul>

      <h2>Stack</h2>
      <ul>
        <li><strong>Next.js 14+:</strong> App Router with Server Components</li>
        <li><strong>tRPC:</strong> End-to-end typesafe APIs</li>
        <li><strong>FIRM:</strong> Schema validation with pre-compiled schemas</li>
        <li><strong>React Query:</strong> Data fetching and caching</li>
      </ul>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Quick Start</h3>
        <pre style={{ background: '#333', color: '#fff', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          npm install{'\n'}
          npm run dev
        </pre>
        <p>Visit <code>/users</code> to see the full CRUD example.</p>
      </div>
    </main>
  );
}
