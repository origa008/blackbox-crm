import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();
  const [customQuote, setCustomQuote] = useState('');

  const pricingPlans = [
    {
      name: 'Starter',
      price: 15000,
      description: 'For small businesses getting started.',
      features: [
        '50 contacts',
        '10 sales pipelines',
        '20 invoices per month',
        '2 user accounts',
        'Basic support'
      ],
      buttonText: 'Apply Plan',
      popular: false
    },
    {
      name: 'Professional',
      price: 35000,
      description: 'For growing businesses with advanced needs.',
      features: [
        '500 contacts',
        '50 sales pipelines',
        'Unlimited invoices',
        '5 user accounts',
        'Priority support'
      ],
      buttonText: 'Apply Plan',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 75000,
      description: 'For large organizations with complex requirements.',
      features: [
        'Unlimited contacts',
        'Unlimited sales pipelines',
        'Unlimited invoices',
        'Unlimited user accounts',
        '24/7 dedicated support'
      ],
      buttonText: 'Apply Plan',
      popular: false
    }
  ];

  const calculateCustomPrice = () => {
    const quantity = parseInt(customQuote) || 0;
    if (quantity <= 0) return 0;
    return quantity * 850; // PKR 850 per additional unit
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal
          </Button>
          
          <h1 className="text-4xl font-bold tracking-tight mb-4">Pricing</h1>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative overflow-hidden ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <CardHeader className={plan.popular ? 'pt-12' : ''}>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    PKR {plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full mt-6 ${
                    plan.popular 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'bg-background text-foreground border border-input hover:bg-accent'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Pricing Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Custom Pricing</CardTitle>
            <CardDescription className="text-base">
              Looking for more than standard plans? Get a custom quote.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter number of additional users"
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  className="text-lg py-6 px-4"
                />
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold">
                  PKR {calculateCustomPrice().toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  PKR 850/additional user
                </div>
              </div>
              
              <Button size="lg" className="px-8">
                Get Quote
              </Button>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>Custom pricing includes:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Unlimited contacts and pipelines</li>
                <li>• Advanced analytics and reporting</li>
                <li>• Custom integrations</li>
                <li>• Dedicated account manager</li>
                <li>• Priority support with SLA</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Pricing;