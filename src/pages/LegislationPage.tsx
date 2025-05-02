
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LegislationItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
}

interface GroupedLegislation {
  [category: string]: LegislationItem[];
}

const LegislationPage = () => {
  const [legislationItems, setLegislationItems] = useState<LegislationItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedLegislation>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLegislation = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('legislation_items')
          .select('*')
          .order('title');

        if (error) {
          throw error;
        }

        setLegislationItems(data || []);
        
        // Group items by category
        const grouped = data?.reduce((acc: GroupedLegislation, item) => {
          if (!acc[item.category]) {
            acc[item.category] = [];
          }
          acc[item.category].push(item);
          return acc;
        }, {});
        
        setGroupedItems(grouped || {});
      } catch (error) {
        console.error('Error fetching legislation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLegislation();
  }, []);

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Legislação e Direitos</h2>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Seus Direitos como Perito Sindicalizado</h3>
        <p className="text-gray-600 mb-4">
          Como associado do SINDMOBA, você tem acesso a uma série de direitos e benefícios que visam proteger e 
          valorizar o seu trabalho como perito. Conheça abaixo os principais recursos disponíveis.
        </p>
      </div>
      
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="sindmoba-card">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="sindmoba-card">
                <h4 className="mb-3">{category}</h4>
                <div className="space-y-2">
                  {items.map(item => (
                    <a 
                      key={item.id} 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center text-sindmoba-primary hover:underline"
                    >
                      • {item.title} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ))}
                </div>
                
                {items.some(item => item.description) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {items
                      .filter(item => item.description)
                      .map(item => (
                        <p key={`desc-${item.id}`} className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">{item.title}:</span> {item.description}
                        </p>
                      ))
                    }
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="sindmoba-card">
              <p className="text-center text-gray-500">
                Não foram encontrados itens de legislação. Entre em contato com o administrador para adicionar conteúdo.
              </p>
            </div>
          )}
          
          <div className="sindmoba-card">
            <h4 className="mb-3">Direitos dos Sindicalizados</h4>
            <p className="text-gray-600 mb-4">
              Conheça os benefícios exclusivos para membros do SINDMOBA.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Representação jurídica em questões trabalhistas</li>
              <li>Assistência em processos administrativos</li>
              <li>Desconto em cursos de capacitação e pós-graduação</li>
              <li>Participação nas assembleias com direito a voto</li>
              <li>Acesso ao clube de benefícios com parceiros</li>
              <li>Auxílio jurídico em questões profissionais</li>
            </ul>
          </div>
          
          <div className="sindmoba-card">
            <h4 className="mb-3">Parcerias Jurídicas</h4>
            <p className="text-gray-600 mb-4">
              O SINDMOBA mantém parceria com escritórios de advocacia especializados em direito administrativo, 
              trabalhista e previdenciário para atender às necessidades dos nossos associados.
            </p>
            <button className="sindmoba-btn-primary">
              Fale com um advogado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegislationPage;
