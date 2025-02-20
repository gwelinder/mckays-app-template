/*
<ai_context>
This client component provides the features section for the landing page.
</ai_context>
*/

"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { motion } from "framer-motion"
import {
  AppWindow,
  Database,
  DollarSign,
  LucideIcon,
  Shield,
  FileText,
  Brain,
  History,
  AlertCircle
} from "lucide-react"

interface FeatureProps {
  title: string
  description: string
  icon: LucideIcon
}

const features: FeatureProps[] = [
  {
    title: "AI-Powered Analysis",
    description:
      "Intelligent review of board materials for inconsistencies, compliance issues, and missing information",
    icon: Brain
  },
  {
    title: "Document Management",
    description:
      "Secure repository for board materials, policies, and corporate governance documents",
    icon: FileText
  },
  {
    title: "Compliance Tracking",
    description:
      "Automated checks against corporate policies and Scandinavian regulatory requirements",
    icon: Shield
  },
  {
    title: "Risk Monitoring",
    description:
      "Proactive identification of potential liability risks and governance issues",
    icon: AlertCircle
  },
  {
    title: "Historical Context",
    description:
      "Track changes and decisions across meetings for better continuity",
    icon: History
  },
  {
    title: "Secure Infrastructure",
    description:
      "Enterprise-grade security with local data processing and storage",
    icon: Database
  }
]

const FeatureCard = ({ title, description, icon: Icon }: FeatureProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="transform-gpu"
  >
    <Card className="group h-full transition-shadow duration-200 hover:shadow-lg">
      <CardHeader>
        <Icon className="text-primary mb-2 size-12" />
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  </motion.div>
)

export const FeaturesSection = () => {
  return (
    <section className="mt-20 bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="mb-4 text-center text-4xl font-bold">
            Comprehensive Board Support
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-center text-lg">
            Everything you need to fulfill your board member responsibilities
            effectively and securely
          </p>
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
