/**
 * useCredits Hook - Credit management utilities
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { creditApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface CreditTransaction {
  id: string;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  balance_after: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  is_popular: boolean;
  discount_percent?: number;
}

export function useCredits() {
  const { user, updateUser } = useAuthStore();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = user?.credit_balance ?? 0;

  const fetchTransactions = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await creditApi.transactions(page);
      setTransactions(response.data.transactions || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await creditApi.packages();
      setPackages(response.data.packages || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch packages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const response = await creditApi.balance();
      updateUser({ credit_balance: response.data.balance });
    } catch (err) {
      console.error('Failed to refresh balance');
    }
  }, [updateUser]);

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    balance,
    transactions,
    packages,
    isLoading,
    error,
    fetchTransactions,
    fetchPackages,
    refreshBalance,
  };
}
