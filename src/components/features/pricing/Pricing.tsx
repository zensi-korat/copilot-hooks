"use client";

import { useState } from "react";
import { BillingToggle } from "./BillingToggle";
import { PricingCard, type PricingFeature } from "./PricingCard";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PricingFeature[];
  isPopular?: boolean;
  ctaText?: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    description: "Perfect for individuals and small projects",
    monthlyPrice: 9,
    annualPrice: 86,
    features: [
      { text: "Up to 5 projects", included: true },
      { text: "Basic analytics", included: true },
      { text: "24/7 support", included: true },
      { text: "Advanced features", included: false },
      { text: "Custom integrations", included: false },
    ],
    ctaText: "Start Free Trial",
  },
  {
    name: "Professional",
    description: "For growing teams and businesses",
    monthlyPrice: 29,
    annualPrice: 278,
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
      { text: "Advanced features", included: true },
      { text: "Custom integrations", included: false },
    ],
    isPopular: true,
    ctaText: "Get Started",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    monthlyPrice: 99,
    annualPrice: 950,
    features: [
      { text: "Unlimited projects", included: true },
      { text: "Enterprise analytics", included: true },
      { text: "Dedicated support", included: true },
      { text: "All advanced features", included: true },
      { text: "Custom integrations", included: true },
    ],
    ctaText: "Contact Sales",
  },
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Choose the perfect plan for your needs. All plans include a 14-day
            free trial.
          </p>
          <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              description={tier.description}
              monthlyPrice={tier.monthlyPrice}
              annualPrice={tier.annualPrice}
              isAnnual={isAnnual}
              features={tier.features}
              isPopular={tier.isPopular}
              ctaText={tier.ctaText}
              onCtaClick={() => console.log(`Selected ${tier.name} plan`)}
            />
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include SSL certificates, automatic backups, and 99.9%
            uptime guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}
