import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Download, Share, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InvoiceView } from '@/components/InvoiceView';

interface Invoice {
  id: string;
  serial_number: string;
  contact_id: string;
  sales_pipeline_id: string;
  status: 'paid' | 'unpaid';
  amount: number;
  invoice_date: string;
  due_date: string;
  description: string;
  created_at: string;
  contacts: {
    name: string;
    email: string;
    phone: string;
    company: string;
  };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface SalesPipeline {
  id: string;
  title: string;
  description: string;
  amount: number;
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [salesPipelines, setSalesPipelines] = useState<SalesPipeline[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    serial_number: '',
    contact_id: '',
    sales_pipeline_id: '',
    status: 'unpaid' as 'paid' | 'unpaid',
    amount: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchContacts();
      fetchSalesPipelines();
      
      // Generate serial number for new invoice
      generateSerialNumber();
    }
  }, [user]);

  const generateSerialNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setFormData(prev => ({ ...prev, serial_number: `INV-${timestamp}` }));
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        contacts (
          name,
          email,
          phone,
          company
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch invoices', variant: 'destructive' });
      return;
    }
    setInvoices((data as Invoice[]) || []);
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch contacts', variant: 'destructive' });
      return;
    }
    setContacts(data || []);
  };

  const fetchSalesPipelines = async () => {
    const { data, error } = await supabase
      .from('sales_pipelines')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch sales pipelines', variant: 'destructive' });
      return;
    }
    setSalesPipelines(data || []);
  };

  const handleContactChange = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setFormData(prev => ({ ...prev, contact_id: contactId }));
  };

  const handleSalesPipelineChange = (pipelineId: string) => {
    const pipeline = salesPipelines.find(p => p.id === pipelineId);
    setFormData(prev => ({
      ...prev,
      sales_pipeline_id: pipelineId,
      description: pipeline?.description || '',
      amount: pipeline?.amount || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const invoiceData = {
        ...formData,
        contact_id: formData.contact_id || null,
        sales_pipeline_id: formData.sales_pipeline_id || null,
        due_date: formData.due_date || null,
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from('invoices')
          .update({
            ...invoiceData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingInvoice.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Invoice updated successfully' });
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert([{
            ...invoiceData,
            user_id: user?.id,
          }]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Invoice created successfully' });
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({ title: 'Error', description: 'Failed to save invoice', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      serial_number: '',
      contact_id: '',
      sales_pipeline_id: '',
      status: 'unpaid',
      amount: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      description: ''
    });
    setEditingInvoice(null);
    generateSerialNumber();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Invoice deleted successfully' });
    fetchInvoices();
  };

  const handleShare = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsShareDialogOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      serial_number: invoice.serial_number,
      contact_id: invoice.contact_id || '',
      sales_pipeline_id: invoice.sales_pipeline_id || '',
      status: invoice.status,
      amount: invoice.amount,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || '',
      description: invoice.description || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDownload = (invoice: Invoice) => {
    // This will be handled by the InvoiceView component
    handleView(invoice);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium text-foreground">Invoices</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={generateSerialNumber} className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'paid' | 'unpaid') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="contact_id">Select Contact</Label>
                <Select value={formData.contact_id} onValueChange={handleContactChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} - {contact.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sales_pipeline_id">Select Sales Pipeline</Label>
                <Select value={formData.sales_pipeline_id} onValueChange={handleSalesPipelineChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose sales pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesPipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="h-32"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium">Serial Number</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border">
                    <td className="p-4">{invoice.serial_number}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{invoice.contacts?.name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.contacts?.company}</div>
                      </div>
                    </td>
                    <td className="p-4">${invoice.amount}</td>
                    <td className="p-4">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="p-4">{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(invoice)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(invoice)} title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleShare(invoice)} title="Share">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(invoice.id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Invoice Link</Label>
              <Input value={`${window.location.origin}/invoice/${selectedInvoice?.id}`} readOnly />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  const url = `https://wa.me/?text=Invoice%20Link:%20${window.location.origin}/invoice/${selectedInvoice?.id}`;
                  window.open(url, '_blank');
                }}
                className="bg-[#25D366] text-white hover:bg-[#25D366]/90"
              >
                Share on WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice View Dialog */}
      {selectedInvoice && (
        <InvoiceView
          invoice={selectedInvoice}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedInvoice(null);
          }}
          onEdit={() => {
            setIsViewDialogOpen(false);
            handleEdit(selectedInvoice);
          }}
        />
      )}
    </div>
  );
};

export default Invoices;