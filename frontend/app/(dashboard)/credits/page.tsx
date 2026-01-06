'use client';

import { useEffect } from 'react';
import { useCredits } from '@/hooks/use-credits';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function CreditsPage() {
  const { user } = useAuthStore();
  const { balance, transactions, isLoading, fetchTransactions } = useCredits();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credits</h1>
          <p className="text-muted-foreground mt-1">
            Manage your credit balance and view transaction history
          </p>
        </div>
        <Link href="/buy">
          <Button>
            <Coins className="mr-2 h-4 w-4" />
            Buy Credits
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-5xl font-bold">{balance}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Credits available for video creation
              </p>
            </div>
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Coins className="h-10 w-10 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credit Usage</CardTitle>
            <CardDescription>1 credit = 1 video</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Videos you can create</span>
                <span className="font-medium">{balance} videos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated savings</span>
                <span className="font-medium text-green-600">
                  ~${(balance * 5).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need More Credits?</CardTitle>
            <CardDescription>Get the best value with bulk packages</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/buy">
              <Button className="w-full">
                View Packages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.amount > 0
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.amount > 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.transaction_type === 'purchase' && 'Credit Purchase'}
                        {tx.transaction_type === 'usage' && 'Video Creation'}
                        {tx.transaction_type === 'bonus' && 'Bonus Credits'}
                        {tx.transaction_type === 'refund' && 'Refund'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tx.description || formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {tx.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
