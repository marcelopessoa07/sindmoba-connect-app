
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  published_at: string;
  image_url?: string;
}

const News = () => {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('published_at', { ascending: false });

        if (error) {
          console.error('Error fetching news:', error);
          return;
        }

        setNewsArticles(data || []);
      } catch (error) {
        console.error('Error in news fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Format date from ISO to DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Últimas Notícias</h2>
      
      {newsArticles.length > 0 ? (
        <div className="space-y-4">
          {newsArticles.map((article) => (
            <div key={article.id} className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
              {article.image_url && (
                <div className="h-40 w-full overflow-hidden">
                  <img 
                    src={article.image_url} 
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(article.published_at)}</span>
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
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhuma notícia disponível no momento.</p>
        </div>
      )}
    </div>
  );
};

export default News;
