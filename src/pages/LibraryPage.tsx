
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Book, FileText, ExternalLink } from 'lucide-react';

const LibraryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const libraryItems = [
    {
      title: "Medicina Legal e Antropologia Forense",
      author: "Genival Veloso de França",
      type: "Livro",
      year: "2022",
      category: "Medicina Legal",
      description: "Obra de referência em medicina legal, com abordagem completa de temas essenciais para peritos.",
      link: "https://exemplo.com/livro-medicina-legal"
    },
    {
      title: "Revista Brasileira de Odontologia Legal",
      author: "Associação Brasileira de Odontologia Legal",
      type: "Periódico",
      year: "2023",
      category: "Odontologia Legal",
      description: "Publicação científica com os mais recentes estudos em odontologia legal e forense.",
      link: "https://exemplo.com/revista-odontologia"
    },
    {
      title: "Traumatologia Forense: Princípios e Práticas",
      author: "Eduardo R. Alves",
      type: "Livro",
      year: "2021",
      category: "Traumatologia",
      description: "Manual completo sobre traumatologia forense, com casos e aplicações práticas.",
      link: "https://exemplo.com/traumatologia-forense"
    },
    {
      title: "Artigo: Novas abordagens em identificação humana",
      author: "Marcos Silva, Ana Souza",
      type: "Artigo",
      year: "2024",
      category: "Identificação Humana",
      description: "Revisão científica sobre os métodos mais modernos de identificação humana em perícia forense.",
      link: "https://exemplo.com/artigo-identificacao"
    }
  ];
  
  const filteredItems = libraryItems.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.author.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Biblioteca</h2>
      
      <p className="mb-8 text-gray-700">
        Acesse o acervo bibliográfico especializado do SINDMOBA, com obras de referência, periódicos e artigos científicos 
        relevantes para a prática da perícia médico-legal e odontológica.
      </p>
      
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título, autor ou categoria..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => setSearchTerm('')}
          className="text-gray-500"
        >
          Limpar
        </Button>
      </div>
      
      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sindmoba-primary hover:text-sindmoba-secondary"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.author}, {item.year}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {item.type === "Livro" ? <Book size={14} /> : <FileText size={14} />}
                    {item.type}
                  </Badge>
                  <Badge variant="secondary">{item.category}</Badge>
                </div>
                <p className="mt-3">{item.description}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhum item encontrado para sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
