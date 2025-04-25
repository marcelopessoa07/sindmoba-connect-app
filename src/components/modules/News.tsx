
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  date: string;
  image?: string;
}

const News = () => {
  // Mocked news data
  const [newsArticles] = useState<NewsArticle[]>([
    {
      id: 1,
      title: 'Nova resolução sobre perícias médicas',
      summary: 'O Conselho Nacional de Justiça publicou uma nova resolução que altera os procedimentos para perícias médicas judiciais.',
      date: '25/04/2025',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d'
    },
    {
      id: 2,
      title: 'Assembleia Geral Extraordinária',
      summary: 'Convocamos todos os associados para a Assembleia Geral Extraordinária que ocorrerá no dia 15/05/2025 às 18h.',
      date: '23/04/2025',
    },
    {
      id: 3,
      title: 'Curso de atualização em Traumatologia Forense',
      summary: 'O SINDMOBA promoverá um curso de atualização em Traumatologia Forense nos dias 10 e 11 de junho.',
      date: '20/04/2025',
      image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81'
    },
    {
      id: 4,
      title: 'Conquista histórica para a classe pericial',
      summary: 'Após anos de luta sindical, conseguimos aprovar o novo plano de carreira para os peritos médicos e odonto legais.',
      date: '15/04/2025',
    },
    {
      id: 5,
      title: 'Novo convênio com instituição de ensino',
      summary: 'O SINDMOBA firmou convênio com a Universidade Federal da Bahia que oferece 20% de desconto em cursos de pós-graduação.',
      date: '10/04/2025',
    }
  ]);

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Últimas Notícias</h2>
      
      <div className="space-y-4">
        {newsArticles.map((article) => (
          <div key={article.id} className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
            {article.image && (
              <div className="h-40 w-full overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{article.date}</span>
              </div>
              <h3 className="text-lg font-bold mb-2">{article.title}</h3>
              <p className="text-gray-600 mb-4">{article.summary}</p>
              <Link 
                to={`/news/${article.id}`}
                className="inline-block text-sindmoba-primary font-medium hover:underline"
              >
                Leia mais
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
