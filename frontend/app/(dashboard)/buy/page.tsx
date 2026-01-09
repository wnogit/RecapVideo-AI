'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Coins, Check, Star, Loader2, ArrowLeft, ArrowRight, Upload, Copy, CheckCircle, AlertCircle, X, Phone, User } from 'lucide-react';
import { orderApi, paymentMethodsApi, creditPackagesApi, type PaymentMethod, type OrderData, type CreditPackage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Payment type colors/icons
const PAYMENT_TYPE_CONFIG: Record<string, { name: string; color: string; bgColor: string }> = {
  kbzpay: { name: 'KBZ Pay', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  wavepay: { name: 'Wave Pay', color: 'text-green-600', bgColor: 'bg-green-100' },
  cbpay: { name: 'CB Pay', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ayapay: { name: 'AYA Pay', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  okdollar: { name: 'OK$', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  mpitesan: { name: 'M-Pitesan', color: 'text-red-600', bgColor: 'bg-red-100' },
  onepay: { name: 'OnePay', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  uabpay: { name: 'UAB Pay', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
};

type CheckoutStep = 'packages' | 'payment' | 'upload' | 'complete';

export default function BuyCreditsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Checkout state
  const [step, setStep] = useState<CheckoutStep>('packages');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // Fetch packages and payment methods from database
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [packagesRes, methodsRes] = await Promise.all([
          creditPackagesApi.getPublic().catch(() => ({ data: [] })),
          paymentMethodsApi.getActive().catch(() => ({ data: [] })),
        ]);
        
        setPackages(packagesRes.data || []);
        setPaymentMethods(methodsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ title: 'Failed to load data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle package selection
  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
  };

  // Handle payment method selection
  const handleSelectPayment = (method: PaymentMethod, paymentType: string) => {
    setSelectedPaymentMethod(method);
    setSelectedPaymentType(paymentType);
  };

  // Create order and proceed to upload
  const handleProceedToUpload = async () => {
    if (!selectedPackage || !selectedPaymentMethod || !selectedPaymentType) return;
    
    setIsSubmitting(true);
    try {
      const response = await orderApi.create({
        package_id: selectedPackage.id,
        payment_method: selectedPaymentType,
        payment_method_id: selectedPaymentMethod.id,
        promo_code: promoCode || undefined,
      });
      
      setCurrentOrder(response.data);
      setStep('upload');
      toast({ title: 'Order created!', description: 'Please upload your payment screenshot.' });
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to create order', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({ title: 'Please upload a JPEG or PNG image', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File size must be less than 5MB', variant: 'destructive' });
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  // Upload screenshot and complete order
  const handleUploadScreenshot = async () => {
    if (!currentOrder || !screenshotFile) return;
    
    setIsSubmitting(true);
    try {
      await orderApi.uploadScreenshot(currentOrder.id, screenshotFile);
      setStep('complete');
      toast({ title: 'Screenshot uploaded!', description: 'Your order is being processed.' });
    } catch (error: any) {
      toast({ title: error.response?.data?.detail || 'Failed to upload screenshot', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  // Reset checkout
  const resetCheckout = () => {
    setStep('packages');
    setSelectedPackage(null);
    setSelectedPaymentMethod(null);
    setSelectedPaymentType(null);
    setCurrentOrder(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setPromoCode('');
  };

  // Get step number for progress indicator
  const getStepNumber = (s: CheckoutStep) => {
    const steps: CheckoutStep[] = ['packages', 'payment', 'upload', 'complete'];
    return steps.indexOf(s) + 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Progress Indicator */}
      {step !== 'packages' && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {['packages', 'payment', 'upload', 'complete'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  getStepNumber(step) >= i + 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {getStepNumber(step) > i + 1 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-1',
                    getStepNumber(step) > i + 1 ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Package Selection */}
        {step === 'packages' && (
          <motion.div
            key="packages"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h1 className="text-3xl font-bold">💎 Buy Credits</h1>
              <p className="text-muted-foreground mt-2">
                Choose a credit package that fits your needs. Each credit creates one
                AI-powered recap video with Burmese voiceover.
              </p>
            </div>

            {/* Empty State */}
            {packages.length === 0 && (
              <Card className="max-w-md mx-auto text-center p-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Packages Available</h3>
                <p className="text-muted-foreground">
                  Credit packages are not available at the moment. Please check back later.
                </p>
              </Card>
            )}

            {/* Packages Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    'relative cursor-pointer transition-all hover:shadow-lg',
                    pkg.is_popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'hover:border-primary/50'
                  )}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  {pkg.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary">
                        <Star className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle>{pkg.name}</CardTitle>
                    <CardDescription>{pkg.credits} credits</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {pkg.price_mmk ? `${pkg.price_mmk.toLocaleString()}` : `$${pkg.price_usd}`}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        {pkg.price_mmk ? 'MMK' : 'USD'}
                      </span>
                    </div>

                    {pkg.discount_percent && pkg.discount_percent > 0 && (
                      <Badge variant="secondary" className="mb-4">
                        Save {pkg.discount_percent}%
                      </Badge>
                    )}

                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    )}

                    <ul className="text-sm space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {pkg.credits} video creations
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        AI-powered scripts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        Never expires
                      </li>
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button className="w-full" variant={pkg.is_popular ? 'default' : 'outline'}>
                      <Coins className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 'payment' && selectedPackage && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Back button & Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep('packages')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold">Select Payment Method</h2>
                <p className="text-muted-foreground">
                  Choose how you want to pay for {selectedPackage.credits} credits
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedPackage.name} Package</p>
                    <p className="text-sm text-muted-foreground">{selectedPackage.credits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {selectedPackage.price_mmk 
                        ? `${selectedPackage.price_mmk.toLocaleString()} MMK`
                        : `$${selectedPackage.price_usd} USD`
                      }
                    </p>
                    {selectedPackage.price_mmk && (
                      <p className="text-sm text-muted-foreground">≈ ${selectedPackage.price_usd} USD</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            {paymentMethods.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No payment methods available. Please contact admin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{method.account_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Phone className="h-3 w-3" />
                            {method.phone}
                          </div>
                          
                          {/* Payment Types */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {method.payment_types.map((type) => {
                              const config = PAYMENT_TYPE_CONFIG[type] || { 
                                name: type, 
                                color: 'text-gray-600', 
                                bgColor: 'bg-gray-100' 
                              };
                              const isSelected = selectedPaymentMethod?.id === method.id && selectedPaymentType === type;
                              
                              return (
                                <button
                                  key={type}
                                  onClick={() => handleSelectPayment(method, type)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                    config.bgColor,
                                    config.color,
                                    isSelected && 'ring-2 ring-primary ring-offset-2',
                                    'hover:opacity-80'
                                  )}
                                >
                                  {config.name}
                                  {isSelected && <Check className="inline-block ml-1 h-3 w-3" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Promo Code */}
            <Card>
              <CardContent className="pt-4">
                <Label htmlFor="promo">Promo Code (optional)</Label>
                <Input
                  id="promo"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="mt-1"
                />
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleProceedToUpload}
                disabled={!selectedPaymentMethod || !selectedPaymentType || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Continue to Payment
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment & Screenshot Upload */}
        {step === 'upload' && selectedPackage && selectedPaymentMethod && selectedPaymentType && currentOrder && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setStep('payment')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold">Complete Payment</h2>
                <p className="text-muted-foreground">
                  Send payment and upload your screenshot
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Details</CardTitle>
                  <CardDescription>
                    Send exactly this amount to the account below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code */}
                  {selectedPaymentMethod.qr_code_url && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img
                        src={selectedPaymentMethod.qr_code_url}
                        alt="Payment QR Code"
                        className="max-w-[200px] max-h-[200px] object-contain"
                      />
                    </div>
                  )}

                  {/* Payment Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Account Name</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedPaymentMethod.account_name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedPaymentMethod.account_name)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Phone Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{selectedPaymentMethod.phone}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedPaymentMethod.phone)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Payment Method</span>
                      <Badge className={cn(
                        PAYMENT_TYPE_CONFIG[selectedPaymentType]?.bgColor,
                        PAYMENT_TYPE_CONFIG[selectedPaymentType]?.color
                      )}>
                        {PAYMENT_TYPE_CONFIG[selectedPaymentType]?.name || selectedPaymentType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium">Amount to Pay</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          {selectedPackage.price_mmk
                            ? `${selectedPackage.price_mmk.toLocaleString()} MMK`
                            : `$${selectedPackage.price_usd}`
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(
                            selectedPackage.price_mmk?.toString() || selectedPackage.price_usd.toString()
                          )}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Screenshot Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Screenshot</CardTitle>
                  <CardDescription>
                    After sending payment, upload a screenshot as proof
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                      screenshotFile
                        ? 'border-green-500 bg-green-50'
                        : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                    )}
                    onClick={() => document.getElementById('screenshot-input')?.click()}
                  >
                    {screenshotPreview ? (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="max-h-[200px] mx-auto rounded-lg"
                        />
                        <button
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScreenshotFile(null);
                            setScreenshotPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="screenshot-input"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Submit Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUploadScreenshot}
                    disabled={!screenshotFile || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Submit Order
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your order will be reviewed within 24 hours.
                    Credits will be added automatically after approval.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Step 4: Order Complete */}
        {step === 'complete' && currentOrder && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Your order #{currentOrder.id.slice(0, 8)} has been submitted and is pending approval.
              You&apos;ll receive credits once the admin approves your payment.
            </p>
            
            <Card className="max-w-md mx-auto mb-8">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono">{currentOrder.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span>{currentOrder.credits_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">Processing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/orders')}>
                View My Orders
              </Button>
              <Button onClick={resetCheckout}>
                Buy More Credits
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
