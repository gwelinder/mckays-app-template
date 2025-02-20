/*
<ai_context>
This server page is the marketing homepage.
</ai_context>
*/

"use server"

import { FeaturesSection } from "@/components/landing/features"
import { HeroSection } from "@/components/landing/hero"

export default async function HomePage() {
  return (
    <div className="pb-20">
      <HeroSection />
      <div className="container mx-auto mt-12 text-center">
        <h2 className="text-muted-foreground text-2xl font-semibold">
          Empowering Board Members Across Scandinavia
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Join leading companies in Norway, Sweden, and Denmark in streamlining
          board oversight
        </p>
      </div>
      <FeaturesSection />
    </div>
  )
}
