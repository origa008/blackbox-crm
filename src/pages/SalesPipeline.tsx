import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Filter, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  company: string;
}

interface SalesPipeline {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  status: 'in_progress' | 'closed_won' | 'closed_lost';
  notes: string | null;
  amount: number;
  created_at: string;
  contacts?: Contact;
}

interface PipelineFormData {
  title: string;
  description: string;
  contact_id: string;
  status: 'in_progress' | 'closed_won' | 'closed_lost';
  notes: string;
  amount: number;
}

const SalesPipeline = () => {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<SalesPipeline[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<SalesPipeline | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<PipelineFormData>({
    title: '',
    description: '',
    contact_id: '',
    status: 'in_progress',
    notes: '',
    amount: 0,
  });

  useEffect(() => {
    if (user) {
      fetchPipelines();
      fetchContacts();
    }
  }, [user]);

  const fetchPipelines = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_pipelines')
        .select(`
          *,
          contacts (
            id,
            name,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPipelines((data as SalesPipeline[]) || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Failed to fetch sales pipelines');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const pipelineData = {
        ...formData,
        contact_id: formData.contact_id === 'none' ? null : formData.contact_id || null,
      };

      if (editingPipeline) {
        const { error } = await supabase
          .from('sales_pipelines')
          .update({
            ...pipelineData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPipeline.id);

        if (error) throw error;
        toast.success('Sales pipeline updated successfully');
      } else {
        const { error } = await supabase
          .from('sales_pipelines')
          .insert({
            ...pipelineData,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success('Sales pipeline created successfully');
      }

      setDialogOpen(false);
      setEditingPipeline(null);
      resetForm();
      fetchPipelines();
    } catch (error) {
      console.error('Error saving pipeline:', error);
      toast.error('Failed to save sales pipeline');
    }
  };

  const handleEdit = (pipeline: SalesPipeline) => {
    setEditingPipeline(pipeline);
    setFormData({
      title: pipeline.title,
      description: pipeline.description || '',
      contact_id: pipeline.contact_id || '',
      status: pipeline.status,
      notes: pipeline.notes || '',
      amount: pipeline.amount,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (pipelineId: string) => {
    if (!confirm('Are you sure you want to delete this sales pipeline?')) return;

    try {
      const { error } = await supabase
        .from('sales_pipelines')
        .delete()
        .eq('id', pipelineId);

      if (error) throw error;
      toast.success('Sales pipeline deleted successfully');
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast.error('Failed to delete sales pipeline');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      contact_id: '',
      status: 'in_progress',
      notes: '',
      amount: 0,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'closed_won':
        return 'bg-green-100 text-green-800';
      case 'closed_lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPipelines = statusFilter === 'all' 
    ? pipelines 
    : pipelines.filter(p => p.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sales Pipeline</h1>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Pipeline</h1>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed_won">Closed Won</SelectItem>
              <SelectItem value="closed_lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingPipeline(null);
                resetForm();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Pipeline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPipeline ? 'Edit Pipeline' : 'Add New Pipeline'}</DialogTitle>
                <DialogDescription>
                  {editingPipeline ? 'Update pipeline information' : 'Enter the pipeline details below'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-32"
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Select 
                    value={formData.contact_id} 
                    onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No contact</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} - {contact.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'in_progress' | 'closed_won' | 'closed_lost') => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed_won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingPipeline ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                      setEditingPipeline(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPipelines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  {statusFilter === 'all' 
                    ? 'No sales pipelines found. Create your first pipeline to get started.'
                    : `No pipelines found with status "${statusFilter}".`
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredPipelines.map((pipeline) => (
                <TableRow key={pipeline.id}>
                  <TableCell className="font-medium">{pipeline.title}</TableCell>
                  <TableCell className="max-w-40 truncate">
                    {pipeline.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pipeline.contacts?.name || 'No contact'}</div>
                      {pipeline.contacts?.company && (
                        <div className="text-sm text-muted-foreground">{pipeline.contacts.company}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${pipeline.amount}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(pipeline.status)}>
                      {pipeline.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(pipeline.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-32 truncate">
                    {pipeline.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(pipeline)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(pipeline.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SalesPipeline;