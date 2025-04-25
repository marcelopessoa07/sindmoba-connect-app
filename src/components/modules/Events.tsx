
import { useState } from 'react';
import { Calendar } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'assembly' | 'course' | 'celebration' | 'other';
}

const Events = () => {
  // Mocked events data
  const [events] = useState<Event[]>([
    {
      id: 1,
      title: 'Assembleia Geral Extraordinária',
      description: 'Discussão sobre a nova tabela salarial proposta pelo governo estadual.',
      date: '15/05/2025',
      time: '18:00',
      location: 'Sede do SINDMOBA - Av. Tancredo Neves, 1632, Salvador',
      type: 'assembly'
    },
    {
      id: 2,
      title: 'Curso de atualização em Traumatologia Forense',
      description: 'Curso ministrado pelo Dr. João Mendes, com carga horária de 16h e certificado.',
      date: '10/06/2025',
      time: '08:00',
      location: 'Auditório da Faculdade de Medicina da UFBA',
      type: 'course'
    },
    {
      id: 3,
      title: 'Confraternização de Aniversário do Sindicato',
      description: '12 anos do SINDMOBA. Venha celebrar conosco com um coquetel especial!',
      date: '22/07/2025',
      time: '19:30',
      location: 'Restaurante Vista Bahia - Salvador',
      type: 'celebration'
    },
    {
      id: 4,
      title: 'Workshop sobre Laudos Periciais',
      description: 'Padronização e melhores práticas para elaboração de laudos periciais.',
      date: '05/08/2025',
      time: '14:00',
      location: 'Sala de Treinamento do SINDMOBA',
      type: 'course'
    },
    {
      id: 5,
      title: 'Assembleia Ordinária',
      description: 'Prestação de contas do primeiro semestre e planejamento para o segundo semestre.',
      date: '10/09/2025',
      time: '17:00',
      location: 'Sede do SINDMOBA - Av. Tancredo Neves, 1632, Salvador',
      type: 'assembly'
    }
  ]);

  const getEventTypeStyle = (type: Event['type']) => {
    switch (type) {
      case 'assembly':
        return 'bg-sindmoba-accent text-sindmoba-dark';
      case 'course':
        return 'bg-sindmoba-success text-white';
      case 'celebration':
        return 'bg-sindmoba-warning text-white';
      default:
        return 'bg-sindmoba-light text-sindmoba-dark';
    }
  };

  const getEventTypeName = (type: Event['type']) => {
    switch (type) {
      case 'assembly':
        return 'Assembleia';
      case 'course':
        return 'Curso';
      case 'celebration':
        return 'Celebração';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Agenda e Eventos</h2>
      
      <div className="mb-6 flex gap-2 flex-wrap">
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-accent mr-1"></span>
          <span className="text-xs">Assembleias</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-success mr-1"></span>
          <span className="text-xs">Cursos</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-warning mr-1"></span>
          <span className="text-xs">Celebrações</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex">
              <div className="flex-shrink-0 w-2 h-full bg-opacity-80" style={{ backgroundColor: event.type === 'assembly' ? '#3498db' : event.type === 'course' ? '#27ae60' : '#f39c12' }}></div>
              <div className="p-4 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-sindmoba-primary" />
                    <span className="text-sm font-medium">{event.date} às {event.time}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeStyle(event.type)}`}>
                    {getEventTypeName(event.type)}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2">{event.description}</p>
                <div className="text-sm text-gray-500">
                  <strong>Local:</strong> {event.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
