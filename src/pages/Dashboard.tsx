import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, TrendingUp, MessageSquare } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  dealsClosed: number;
  conversionRate: number;
  revenueGrowth: number;
  dealsGrowth: number;
  conversionGrowth: number;
}

interface Deal {
  id: string;
  title: string;
  status: string;
  amount: number;
  contact?: {
    name: string;
    company: string;
  };
}

interface Message {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [stats, setStats] = useState<DashboardStats>({ 
    totalRevenue: 0, 
    dealsClosed: 0, 
    conversionRate: 0,
    revenueGrowth: 12.5,
    dealsGrowth: 8.3,
    conversionGrowth: 5.2
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeFilter]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Fetch deals in progress
      const { data: dealsData } = await supabase
        .from('sales_pipelines')
        .select(`
          id,
          title,
          status,
          amount,
          contacts (
            name,
            company
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'In progress')
        .limit(5);

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const { data: closedDeals } = await supabase
        .from('sales_pipelines')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'Closed won');

      const { data: totalDeals } = await supabase
        .from('sales_pipelines')
        .select('*')
        .eq('user_id', user.id);

      const totalRevenue = closedDeals?.reduce((sum, deal) => sum + deal.amount, 0) || 0;
      const dealsClosed = closedDeals?.length || 0;
      const conversionRate = totalDeals?.length 
        ? Math.round((dealsClosed / totalDeals.length) * 100)
        : 0;

      setDeals(dealsData || []);
      setMessages(messagesData || []);
      setStats(prev => ({
        ...prev,
        totalRevenue,
        dealsClosed,
        conversionRate,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    growth: number;
    period: string;
  }> = ({ title, value, icon, growth, period }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-green-600">+{growth}% from last {period}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          growth={stats.revenueGrowth}
          period={timeFilter.slice(0, -2)}
        />
        <MetricCard
          title="Deals Closed"
          value={stats.dealsClosed}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          growth={stats.dealsGrowth}
          period={timeFilter.slice(0, -2)}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          growth={stats.conversionGrowth}
          period={timeFilter.slice(0, -2)}
        />
      </div>

      {/* Deals and Messages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deals in Progress</CardTitle>
            <CardDescription>Sales pipelines with In progress status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deals in progress found</p>
              ) : (
                deals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <h4 className="font-medium">{deal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.contact?.name || 'No contact'} - ${deal.amount}
                      </p>
                    </div>
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Inbox
            </CardTitle>
            <CardDescription>Recent messages received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages found</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{message.sender_name}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {message.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;