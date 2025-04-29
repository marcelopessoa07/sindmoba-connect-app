
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail } from 'lucide-react';

// Define a custom interface for our contact settings
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
      
      // Use generic fetch method to avoid TypeScript errors while database types update
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contact settings:', error);
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar as configurações de contato.',
          variant: 'destructive',
        });
        return;
      }
      
      if (data) {
        // Need to cast the data to our ContactSettings type
        const contactSettings = data as unknown as ContactSettings;
        setSettings(contactSettings);
        setFormData({
          whatsapp_number: contactSettings.whatsapp_number || '',
          legal_email: contactSettings.legal_email || '',
          contact_email: contactSettings.contact_email || '',
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
      const payload = {
        whatsapp_number: formData.whatsapp_number || null,
        legal_email: formData.legal_email || null,
        contact_email: formData.contact_email || null,
        updated_at: new Date().toISOString(),
      };
      
      let response;
      
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('contact_settings')
          .update(payload)
          .eq('id', settings.id);
          
        if (error) throw error;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('contact_settings')
          .insert([payload])
          .select();
          
        if (error) throw error;
        
        if (data && data[0]) {
          // Cast to our ContactSettings type
          setSettings(data[0] as unknown as ContactSettings);
        }
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações de contato foram atualizadas com sucesso.',
      });

      fetchSettings();
    } catch (error: any) {
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
