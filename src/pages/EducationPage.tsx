
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink } from 'lucide-react';

const EducationPage = () => {
  const [activeTab, setActiveTab] = useState('cursos');
  
  const courses = [
    {
      title: "Introdução à Perícia Médico-Legal",
      description: "Curso básico sobre os fundamentos da perícia médico-legal, metodologias e aplicações práticas.",
      instructor: "Dr. Carlos Mendes",
      link: "https://exemplo.com/curso-pericia"
    },
    {
      title: "Atualização em Traumatologia Forense",
      description: "Abordagem das mais recentes técnicas e protocolos em traumatologia forense.",
      instructor: "Dra. Maria Silva",
      link: "https://exemplo.com/traumatologia"
    }
  ];
  
  const materials = [
    {
      title: "Manual de Procedimentos Periciais",
      description: "Documento com diretrizes e procedimentos padrão para a realização de perícias.",
      type: "PDF",
      link: "https://exemplo.com/manual-procedimentos"
    },
    {
      title: "Vídeo-aulas: Identificação Humana",
      description: "Série de video-aulas sobre métodos de identificação humana em medicina legal.",
      type: "Vídeo",
      link: "https://exemplo.com/videoaulas"
    }
  ];

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Ensino e Capacitação</h2>
      
      <p className="mb-8 text-gray-700">
        O SINDMOBA disponibiliza recursos educacionais para o aperfeiçoamento profissional de seus associados. 
        Confira abaixo os cursos e materiais didáticos disponíveis.
      </p>
      
      <Tabs defaultValue="cursos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="cursos">Cursos</TabsTrigger>
          <TabsTrigger value="materiais">Materiais Didáticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cursos" className="space-y-4">
          {courses.map((course, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <a 
                    href={course.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sindmoba-primary hover:text-sindmoba-secondary"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <p className="text-sm text-gray-500 mt-1">Instrutor: {course.instructor}</p>
                <p className="mt-2">{course.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="materiais" className="space-y-4">
          {materials.map((material, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{material.title}</h3>
                  <a 
                    href={material.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sindmoba-primary hover:text-sindmoba-secondary"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tipo: {material.type}</p>
                <p className="mt-2">{material.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationPage;
