/*
<ai_context>
This server page displays pricing options for the product, integrating Stripe payment links.
</ai_context>
*/

"use server"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { auth } from "@clerk/nextjs/server"
import { Check } from "lucide-react"

export default async function PricingPage() {
  const { userId } = await auth()

  return (
    <div className="container mx-auto py-12">
      <h1 className="mb-4 text-center text-3xl font-bold">
        Board Member Solutions
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        Choose the plan that best fits your board's needs
      </p>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <PricingCard
          title="Standard Board"
          price="990kr"
          description="Per board member, billed monthly"
          features={[
            "Document management & analysis",
            "AI-powered document insights",
            "Basic compliance tracking",
            "Collaboration tools",
            "Standard support"
          ]}
          buttonText="Start Standard Plan"
          buttonLink={
            process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY || "#"
          }
          userId={userId}
        />
        <PricingCard
          title="Enterprise Board"
          price="9900kr"
          description="Per board, billed annually"
          features={[
            "All Standard features",
            "Advanced legal requirement analysis",
            "Custom compliance frameworks",
            "Unlimited board members",
            "Priority 24/7 support",
            "Custom integrations"
          ]}
          buttonText="Contact Sales"
          buttonLink={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_YEARLY || "#"}
          userId={userId}
        />
      </div>
    </div>
  )
}

interface PricingCardProps {
  title: string
  price: string
  description: string
  features: string[]
  buttonText: string
  buttonLink: string
  userId: string | null
}

function PricingCard({
  title,
  price,
  description,
  features,
  buttonText,
  buttonLink,
  userId
}: PricingCardProps) {
  const finalButtonLink = userId
    ? `${buttonLink}?client_reference_id=${userId}`
    : buttonLink

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex grow flex-col">
        <p className="mb-6 text-4xl font-bold">{price}</p>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="size-5 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <a
            href={finalButtonLink}
            className={cn(
              "inline-flex items-center justify-center",
              finalButtonLink === "#" && "pointer-events-none opacity-50"
            )}
          >
            {buttonText}
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
