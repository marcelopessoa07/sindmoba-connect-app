
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

interface NewsDetail {
  id: string;
  title: string;
  content: string;
  published_at: string;
  image_url?: string;
}

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        if (!id) {
          setError('ID da notícia não encontrado');
          setLoading(false);
          return;
        }

        const { data, error: supabaseError } = await supabase
          .from('news')
          .select('*')
          .eq('id', id)
          .single();

        if (supabaseError) {
          console.error('Error fetching news detail:', supabaseError);
          setError('Não foi possível carregar esta notícia.');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Notícia não encontrada');
          setLoading(false);
          return;
        }

        setNewsItem(data);
        console.log('Fetched news detail:', data);
      } catch (error) {
        console.error('Exception in news detail fetch:', error);
        setError('Ocorreu um erro ao carregar a notícia');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [id]);

  // Format date from ISO to DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
  };

  const handleBack = () => {
    navigate('/news');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="sindmoba-container">
        <div className="flex flex-col items-center py-12">
          <p className="text-lg text-gray-600 mb-6">{error || 'Notícia não encontrada'}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Notícias
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sindmoba-container">
      <Button 
        variant="ghost" 
        onClick={handleBack} 
        className="mb-4 pl-0 hover:bg-transparent text-sindmoba-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <article className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {newsItem.image_url && (
          <div className="w-full h-48 sm:h-64 overflow-hidden">
            <img 
              src={newsItem.image_url} 
              alt={newsItem.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(newsItem.published_at)}</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{newsItem.title}</h1>
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />
        </div>
      </article>
    </div>
  );
};

export default NewsDetailPage;
