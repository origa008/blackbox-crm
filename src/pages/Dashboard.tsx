import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Target, TrendingUp, MessageSquare, Eye } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  description: string | null;
  contact_id: string | null;
  status: string;
  notes: string | null;
  amount: number;
  created_at: string;
  contacts?: {
    name: string;
    company: string;
    phone: string;
    email: string;
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
    revenueGrowth: 0,
    dealsGrowth: 0,
    conversionGrowth: 0
  });
  const [previousStats, setPreviousStats] = useState<DashboardStats>({ 
    totalRevenue: 0, 
    dealsClosed: 0, 
    conversionRate: 0,
    revenueGrowth: 0,
    dealsGrowth: 0,
    conversionGrowth: 0
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, timeFilter]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Get time range for comparison
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;
      
      switch (timeFilter) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
          previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      }

      // Fetch deals in progress with full contact info
      const { data: dealsData } = await supabase
        .from('sales_pipelines')
        .select(`
          *,
          contacts (
            name,
            company,
            phone,
            email
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .limit(10);

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Current period stats
      const { data: currentClosedDeals } = await supabase
        .from('sales_pipelines')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'closed_won')
        .gte('created_at', startDate.toISOString());

      const { data: currentTotalDeals } = await supabase
        .from('sales_pipelines')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      // Previous period stats
      const { data: previousClosedDeals } = await supabase
        .from('sales_pipelines')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .eq('status', 'closed_won')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      const { data: previousTotalDeals } = await supabase
        .from('sales_pipelines')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());

      // Calculate current stats
      const totalRevenue = currentClosedDeals?.reduce((sum, deal) => sum + deal.amount, 0) || 0;
      const dealsClosed = currentClosedDeals?.length || 0;
      const conversionRate = currentTotalDeals?.length 
        ? Math.round((dealsClosed / currentTotalDeals.length) * 100)
        : 0;

      // Calculate previous stats
      const prevTotalRevenue = previousClosedDeals?.reduce((sum, deal) => sum + deal.amount, 0) || 0;
      const prevDealsClosed = previousClosedDeals?.length || 0;
      const prevConversionRate = previousTotalDeals?.length 
        ? Math.round((prevDealsClosed / previousTotalDeals.length) * 100)
        : 0;

      // Calculate growth rates
      const revenueGrowth = prevTotalRevenue > 0 
        ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
        : 0;
      const dealsGrowth = prevDealsClosed > 0 
        ? Math.round(((dealsClosed - prevDealsClosed) / prevDealsClosed) * 100)
        : 0;
      const conversionGrowth = prevConversionRate > 0 
        ? Math.round(((conversionRate - prevConversionRate) / prevConversionRate) * 100)
        : 0;

      setDeals(dealsData || []);
      setMessages(messagesData || []);
      setStats({
        totalRevenue,
        dealsClosed,
        conversionRate,
        revenueGrowth,
        dealsGrowth,
        conversionGrowth,
      });
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
        <p className={`text-xs ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {growth >= 0 ? '+' : ''}{growth}% from last {period}
        </p>
      </CardContent>
    </Card>
  );

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setViewDialogOpen(true);
  };

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
          value={`PKR ${stats.totalRevenue.toLocaleString()}`}
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
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Deals in Progress</CardTitle>
            <CardDescription>Sales pipelines with In Progress status</CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals in progress found</p>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">{deal.title}</TableCell>
                        <TableCell>{deal.contacts?.company || 'No company'}</TableCell>
                        <TableCell>{deal.contacts?.phone || 'No phone'}</TableCell>
                        <TableCell>PKR {deal.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDeal(deal)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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

      {/* Deal Details Dialog */}
      {selectedDeal && (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Deal Details</DialogTitle>
              <DialogDescription>Complete information about this sales pipeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm">Title</h4>
                  <p className="text-sm text-muted-foreground">{selectedDeal.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm">Amount</h4>
                  <p className="text-sm text-muted-foreground">PKR {selectedDeal.amount.toLocaleString()}</p>
                </div>
              </div>
              {selectedDeal.description && (
                <div>
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedDeal.description}</p>
                </div>
              )}
              {selectedDeal.contacts && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedDeal.contacts.name}
                    </div>
                    <div>
                      <span className="font-medium">Company:</span> {selectedDeal.contacts.company || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedDeal.contacts.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedDeal.contacts.email || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
              {selectedDeal.notes && (
                <div>
                  <h4 className="font-medium text-sm">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedDeal.notes}</p>
                </div>
              )}
              <div>
                <h4 className="font-medium text-sm">Status</h4>
                <Badge variant="outline" className="mt-1">In Progress</Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Dashboard;