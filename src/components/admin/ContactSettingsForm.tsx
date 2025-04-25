
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail } from 'lucide-react';

interface ContactSettings {
  id: string;
  whatsapp_number: string | null;
  legal_email: string | null;
  contact_email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const ContactSettingsForm = () => {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    whatsapp_number: '',
    legal_email: '',
    contact_email: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Use REST API call to avoid TypeScript errors with the table that might not exist yet
      const response = await fetch(
        'https://agennmpmizazbapvqkqq.supabase.co/rest/v1/contact_settings?limit=1',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZW5ubXBtaXphemJhcHZxa3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODkxMjksImV4cCI6MjA2MTE2NTEyOX0.k1hZTLzco6zFXgngGIBazVxjywWeRTyV81FXZAq9hmk',
            'Authorization': `Bearer ${supabase.auth.getSession().then(res => res?.data?.session?.access_token || '')}`
          }
        }
      );

      if (!response.ok) {
        console.error('Error fetching contact settings:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (data && data[0]) {
        setSettings(data[0] as ContactSettings);
        setFormData({
          whatsapp_number: data[0].whatsapp_number || '',
          legal_email: data[0].legal_email || '',
          contact_email: data[0].contact_email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching contact settings:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Não foi possível carregar as configurações de contato.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const headers = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZW5ubXBtaXphemJhcHZxa3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODkxMjksImV4cCI6MjA2MTE2NTEyOX0.k1hZTLzco6zFXgngGIBazVxjywWeRTyV81FXZAq9hmk',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        'Content-Type': 'application/json',
        'Prefer': settings ? 'return=minimal' : 'return=representation'
      };
      
      const payload = {
        whatsapp_number: formData.whatsapp_number || null,
        legal_email: formData.legal_email || null,
        contact_email: formData.contact_email || null,
        updated_at: new Date().toISOString(),
      };
      
      let response;
      
      if (settings) {
        // Update existing settings using PATCH
        response = await fetch(
          `https://agennmpmizazbapvqkqq.supabase.co/rest/v1/contact_settings?id=eq.${settings.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
          }
        );
      } else {
        // Insert new settings using POST
        response = await fetch(
          'https://agennmpmizazbapvqkqq.supabase.co/rest/v1/contact_settings',
          {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          }
        );
      }

      if (!response.ok) {
        console.error('Error saving contact settings:', response.statusText);
        throw new Error(`Erro ao salvar: ${response.statusText}`);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de contato foram atualizadas com sucesso.',
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving contact settings:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações de contato.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove anything that's not a digit
    const digits = value.replace(/\D/g, '');
    
    // Apply phone format: (00) 00000-0000
    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = digits.replace(/^(\d{2})/, '($1) ');
    }
    if (digits.length > 7) {
      formattedValue = formattedValue.replace(/^(\(\d{2}\) )(\d{5})/, '$1$2-');
    }

    return formattedValue;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      whatsapp_number: formattedPhone
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Carregando configurações...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Configurações de Contato</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> WhatsApp da Secretaria
            </Label>
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
            <p className="text-sm text-gray-500">Número de WhatsApp que aparecerá como contato da secretaria.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="legal_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> E-mail do Jurídico
            </Label>
            <Input
              id="legal_email"
              name="legal_email"
              type="email"
              value={formData.legal_email}
              onChange={handleChange}
              placeholder="juridico@example.com"
            />
            <p className="text-sm text-gray-500">E-mail usado para a opção "Fale com o Jurídico".</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> E-mail de Contato
            </Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="contato@example.com"
            />
            <p className="text-sm text-gray-500">E-mail usado para a opção "Enviar e-mail".</p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </form>
    </div>
  );
};

export default ContactSettingsForm;
