import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Edit2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Contact {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}

interface SalesPipeline {
  id: string;
  title: string;
  description: string | null;
  amount: number;
}

interface Invoice {
  id: string;
  serial_number: string;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  status: string;
  description: string | null;
  contact_id: string | null;
  sales_pipeline_id: string | null;
}

interface InvoiceViewProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ 
  invoice, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [salesPipeline, setSalesPipeline] = useState<SalesPipeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchInvoiceData();
    }
  }, [isOpen, invoice]);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      // Fetch contact if exists
      if (invoice.contact_id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('id, name, company, email, phone')
          .eq('id', invoice.contact_id)
          .single();
        setContact(contactData);
      }

      // Fetch sales pipeline if exists
      if (invoice.sales_pipeline_id) {
        const { data: pipelineData } = await supabase
          .from('sales_pipelines')
          .select('id, title, description, amount')
          .eq('id', invoice.sales_pipeline_id)
          .single();
        setSalesPipeline(pipelineData);
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`invoice-${invoice.serial_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading invoice...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>Invoice {invoice.serial_number}</DialogTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div id="invoice-content" className="bg-gradient-to-br from-background to-muted/20 p-8 rounded-xl border shadow-sm min-h-[600px]">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-border/50">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">INVOICE</h1>
              <p className="text-muted-foreground text-lg">#{invoice.serial_number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-foreground">BlackBox</h2>
              <p className="text-muted-foreground text-sm mt-1">Professional Services</p>
            </div>
          </div>

          {/* Company Info and Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* From Section */}
            <div className="bg-card/50 p-6 rounded-lg border border-border/30">
              <h3 className="text-sm font-semibold text-foreground mb-4">FROM</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">BlackBox Solutions</p>
                <p>123 Business Street, Karachi, Pakistan</p>
                <p>+92 300 1234567</p>
                <p>info@blackbox.com</p>
              </div>
            </div>

            {/* To Section */}
            <div className="bg-card/50 p-6 rounded-lg border border-border/30">
              <h3 className="text-sm font-semibold text-foreground mb-4">BILL TO</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">{contact?.name || 'N/A'}</p>
                {contact?.company && <p className="text-foreground">{contact.company}</p>}
                {contact?.phone && <p>{contact.phone}</p>}
                {contact?.email && <p>{contact.email}</p>}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Invoice Date</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Due Date</p>
              <p className="text-sm font-semibold text-foreground">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                invoice.status === 'paid' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-6">Description of Services</h3>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-lg">
                      {salesPipeline?.title || invoice.description || 'Professional Services'}
                    </p>
                    <p className="text-muted-foreground mt-2">Quality service delivery as per agreement</p>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold text-primary">PKR {invoice.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between items-center py-3 border-b border-primary/20">
                  <span className="font-medium text-muted-foreground">Subtotal:</span>
                  <span className="font-medium text-foreground">PKR {invoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-xl font-bold text-foreground">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">PKR {invoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Payment Information</h3>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-3">Bank Details:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p><span className="font-medium">Bank:</span> Meezan Bank Limited</p>
                    <p><span className="font-medium">Account:</span> 0123456789012345</p>
                    <p><span className="font-medium">IBAN:</span> PK36MEZN0000010123456789</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-3">Payment Terms:</p>
                  <div className="space-y-1 text-muted-foreground">
                    <p>Net 30 days</p>
                    <p>Late payment may incur charges</p>
                    <p>All payments in PKR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-lg font-medium text-foreground mb-2">Thank you for your business!</p>
            <p className="text-sm text-muted-foreground">For any queries regarding this invoice, please contact us at info@blackbox.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};