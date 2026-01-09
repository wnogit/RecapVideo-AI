'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Construction } from 'lucide-react';

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Promotions
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage promotional campaigns and special offers
          </p>
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Promotions Coming Soon</CardTitle>
          <CardDescription className="text-base">
            We're building an awesome promotions system for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Soon you'll be able to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✨ Create time-limited promotional offers</li>
            <li>🎨 Design custom themed promotional landing pages</li>
            <li>🎁 Set up promo codes with discount percentages</li>
            <li>📊 Track promotion performance and conversions</li>
            <li>🎯 Target specific user segments</li>
          </ul>
          <div className="pt-4">
            <Button disabled variant="outline">
              <Gift className="mr-2 h-4 w-4" />
              Create Promotion (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
