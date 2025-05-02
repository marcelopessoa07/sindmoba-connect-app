

import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Contact = () => {
  const handleWhatsAppClick = () => {
    // Open WhatsApp with predefined message
    window.open('https://wa.me/5571XXXXXXXX?text=Olá%20SINDMOBA,%20gostaria%20de%20mais%20informações.', '_blank');
  };

  const handleEmailClick = () => {
    // Open default email client with predefined subject
    window.location.href = 'mailto:contato@sindmoba.org.br?subject=Contato%20via%20App';
  };

  const handlePhoneClick = () => {
    // Trigger phone call
    window.location.href = 'tel:+557133332222';
  };

  const handleJuridicClick = () => {
    // Open email client with predefined subject for legal department
    window.location.href = 'mailto:juridico@sindmoba.org.br?subject=Solicitação%20de%20Apoio%20Jurídico&body=Olá%20Departamento%20Jurídico%20do%20SINDMOBA,%20gostaria%20de%20solicitar%20apoio%20jurídico%20para%20o%20seguinte%20assunto:%20';
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Contato e Atendimento</h2>
      
      <div className="space-y-6">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-xl font-bold">Fale Conosco</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-3 rounded-full bg-sindmoba-light p-2">
                <Phone className="h-5 w-5 text-sindmoba-primary" />
              </div>
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-gray-600">(71) 3333-2222</p>
                <button 
                  onClick={handlePhoneClick}
                  className="mt-1 text-sm text-sindmoba-primary hover:underline"
                >
                  Ligar agora
                </button>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 rounded-full bg-sindmoba-light p-2">
                <Mail className="h-5 w-5 text-sindmoba-primary" />
              </div>
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-gray-600">contato@sindmoba.org.br</p>
                <button 
                  onClick={handleEmailClick}
                  className="mt-1 text-sm text-sindmoba-primary hover:underline"
                >
                  Enviar e-mail
                </button>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 rounded-full bg-sindmoba-light p-2">
                <MapPin className="h-5 w-5 text-sindmoba-primary" />
              </div>
              <div>
                <p className="font-medium">Endereço</p>
                <p className="text-gray-600">
                  Av. Tancredo Neves, 1632, Edf. Salvador Trade Center<br />
                  Torre Norte, Sala 1105<br />
                  Salvador - BA, 41820-020
                </p>
                <a 
                  href="https://maps.google.com/?q=Av.+Tancredo+Neves,+1632,+Salvador+-+BA,+41820-020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-sindmoba-primary hover:underline"
                >
                  Ver no mapa
                </a>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 rounded-full bg-sindmoba-light p-2">
                <Clock className="h-5 w-5 text-sindmoba-primary" />
              </div>
              <div>
                <p className="font-medium">Horário de Atendimento</p>
                <p className="text-gray-600">
                  Segunda a Sexta: 8h às 17h<br />
                  Exceto feriados
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg bg-sindmoba-light p-5 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-sindmoba-dark">Atendimento Rápido</h3>
          
          <div className="space-y-3">
            <Button 
              onClick={handleWhatsAppClick}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
            >
              WhatsApp da Secretaria
            </Button>
            
            <Button 
              onClick={handleJuridicClick}
              className="w-full bg-sindmoba-primary hover:bg-sindmoba-secondary"
            >
              Solicitar Apoio Jurídico
            </Button>
            
            <Button 
              onClick={handleEmailClick}
              variant="outline"
              className="w-full border-sindmoba-primary text-sindmoba-primary hover:bg-sindmoba-light"
            >
              Enviar e-mail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
