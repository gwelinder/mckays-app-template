/*
<ai_context>
This server page returns a simple "About Page" component as a (marketing) route.
</ai_context>
*/

"use server"

export default async function AboutPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="mb-6 text-4xl font-bold">About Our Platform</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground text-xl">
          We empower board members across Scandinavia with intelligent tools for
          document analysis and compliance management.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="mt-2">
              To streamline board member operations by providing an intelligent
              platform that simplifies document review, ensures compliance, and
              facilitates informed decision-making for companies across
              Scandinavia.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Why Choose Us</h2>
            <ul className="mt-2 list-inside list-disc space-y-2">
              <li>AI-powered document analysis and insights</li>
              <li>Comprehensive legal requirement tracking</li>
              <li>Secure collaboration tools for board members</li>
              <li>Scandinavian-focused compliance frameworks</li>
              <li>Multilingual support for Nordic languages</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Our Approach</h2>
          <p className="mt-2">
            We understand the complex responsibilities board members face in
            today's business environment. Our platform combines advanced
            technology with deep understanding of Scandinavian corporate
            governance, making it easier for board members to fulfill their
            duties effectively and efficiently.
          </p>
        </div>
      </div>
    </div>
  )
}
