'use client';

import { useState } from 'react';
import { useCredits } from '@/hooks/use-credits';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Check, Star, Loader2 } from 'lucide-react';

export default function BuyCreditsPage() {
  const { packages, isLoading } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // Default packages if none from API
  const defaultPackages = [
    {
      id: 'starter',
      name: 'Starter',
      credits: 10,
      price: 5,
      currency: 'USD',
      is_popular: false,
    },
    {
      id: 'popular',
      name: 'Popular',
      credits: 50,
      price: 20,
      currency: 'USD',
      is_popular: true,
      discount_percent: 20,
    },
    {
      id: 'pro',
      name: 'Pro',
      credits: 100,
      price: 35,
      currency: 'USD',
      is_popular: false,
      discount_percent: 30,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 500,
      price: 150,
      currency: 'USD',
      is_popular: false,
      discount_percent: 40,
    },
  ];

  const displayPackages = packages.length > 0 ? packages : defaultPackages;

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setPurchasing(true);
    
    // TODO: Implement payment flow
    // For now, just simulate
    setTimeout(() => {
      setPurchasing(false);
      setSelectedPackage(null);
      alert('Payment integration coming soon! Contact admin to buy credits manually.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold">Buy Credits</h1>
        <p className="text-muted-foreground mt-2">
          Choose a credit package that fits your needs. Each credit creates one
          AI-powered recap video with Burmese voiceover.
        </p>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {displayPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative ${
                pkg.is_popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'hover:border-primary/50'
              } transition-all`}
            >
              {pkg.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">
                    <Star className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.credits} credits
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold">${pkg.price}</span>
                  <span className="text-muted-foreground"> USD</span>
                </div>

                {pkg.discount_percent && (
                  <Badge variant="secondary" className="mb-4">
                    Save {pkg.discount_percent}%
                  </Badge>
                )}

                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {pkg.credits} video creations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    AI-powered scripts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Burmese voiceover
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Never expires
                  </li>
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={pkg.is_popular ? 'default' : 'outline'}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={purchasing && selectedPackage === pkg.id}
                >
                  {purchasing && selectedPackage === pkg.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Coins className="mr-2 h-4 w-4" />
                  )}
                  Buy Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Methods */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Payment Methods</CardTitle>
          <CardDescription>
            We accept the following payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-blue-600">K</span>
              </div>
              <span className="text-sm">KBZPay</span>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-green-600">W</span>
              </div>
              <span className="text-sm">Wave Pay</span>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-purple-600">CB</span>
              </div>
              <span className="text-sm">CB Pay</span>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-xl font-bold text-yellow-600">$</span>
              </div>
              <span className="text-sm">Bank Transfer</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
