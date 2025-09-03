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

        <div id="invoice-content" className="bg-white p-8 min-h-[600px]">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Invoice</h1>
              <p className="text-lg text-gray-600">Blackbox</p>
            </div>
            <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
          </div>

          {/* Company & Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-2">From:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">Blackbox</p>
                <p>ABN: 77 552 027 392</p>
                <p>Email: hello@blackbox.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Business St, Suite 100, City, State 12345</p>
              </div>
            </div>
            <div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Invoice for:</span>
                  <span>{contact?.company || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Invoice ID:</span>
                  <span>{invoice.serial_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date of issue:</span>
                  <span>{new Date(invoice.invoice_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment due:</span>
                  <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          {contact && (
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Bill To:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{contact.name}</p>
                {contact.company && <p>{contact.company}</p>}
                {contact.email && <p>{contact.email}</p>}
                {contact.phone && <p>{contact.phone}</p>}
              </div>
            </div>
          )}

          {/* Services Table */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Description of services</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-sm">Description</th>
                  <th className="text-right py-2 font-medium text-sm">Quantity</th>
                  <th className="text-right py-2 font-medium text-sm">Unit price</th>
                  <th className="text-right py-2 font-medium text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 text-sm">
                    {salesPipeline?.title || invoice.description || 'Service'}
                  </td>
                  <td className="text-right py-3 text-sm">1</td>
                  <td className="text-right py-3 text-sm">${invoice.amount.toFixed(2)}</td>
                  <td className="text-right py-3 text-sm">${invoice.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total amount due</span>
                  <span>${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="font-semibold mb-2">Bank details for payment:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Bank: Wells Fargo</p>
              <p>BSB: 123-456</p>
              <p>Account number: 987654321</p>
              <p>Name: Blackbox</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};