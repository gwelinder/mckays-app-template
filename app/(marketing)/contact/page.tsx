/*
<ai_context>
This server page returns a simple "Contact Page" component as a (marketing) route.
</ai_context>
*/

"use server"

export default async function ContactPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="mb-6 text-4xl font-bold">Contact Us</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold">Board Members</h2>
          <p className="text-muted-foreground mt-2">
            Get personalized support for your board's document management needs
          </p>
          <div className="mt-4">
            <p className="font-medium">Email:</p>
            <a
              href="mailto:support@boardsolutions.no"
              className="text-blue-500 hover:underline"
            >
              support@boardsolutions.no
            </a>
          </div>
          <div className="mt-4">
            <p className="font-medium">Phone:</p>
            <a href="tel:+4747000000" className="text-blue-500 hover:underline">
              +47 47 00 00 00
            </a>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-2xl font-semibold">Enterprise Solutions</h2>
          <p className="text-muted-foreground mt-2">
            Learn about custom solutions for your organization's board
          </p>
          <div className="mt-4">
            <p className="font-medium">Sales:</p>
            <a
              href="mailto:enterprise@boardsolutions.no"
              className="text-blue-500 hover:underline"
            >
              enterprise@boardsolutions.no
            </a>
          </div>
          <div className="mt-4">
            <p className="font-medium">Office:</p>
            <address className="text-muted-foreground not-italic">
              Stortingsgata 22
              <br />
              0161 Oslo
              <br />
              Norway
            </address>
          </div>
        </div>
      </div>

      <div className="mt-12 rounded-lg border p-6">
        <h2 className="text-2xl font-semibold">Support Hours</h2>
        <p className="text-muted-foreground mt-2">
          Standard Support: Monday - Friday, 09:00 - 17:00 CET
          <br />
          Enterprise Support: 24/7 priority assistance
        </p>
      </div>
    </div>
  )
}
