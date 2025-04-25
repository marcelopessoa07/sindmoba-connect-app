
const LegislationPage = () => {
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
      
      <div className="space-y-6">
        <div className="sindmoba-card">
          <h4 className="mb-3">Legislação Federal e Estadual</h4>
          <p className="text-gray-600 mb-4">
            Acesse os principais documentos legislativos que regem a atividade pericial no Brasil e no estado da Bahia.
          </p>
          <div className="space-y-2">
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Lei Federal 12.030/2009 - Perícia Oficial
            </a>
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Lei Estadual 11.370/2009 - Estrutura da Polícia Técnica
            </a>
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Decreto 19.915/2020 - Regulamentação das Perícias
            </a>
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Ver todas as legislações aplicáveis...
            </a>
          </div>
        </div>
        
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
        
        <div className="sindmoba-card">
          <h4 className="mb-3">Jurisprudência e Pareceres Técnicos</h4>
          <p className="text-gray-600 mb-4">
            Acesse uma seleção de decisões judiciais favoráveis à categoria e pareceres técnicos sobre temas relevantes.
          </p>
          <div className="space-y-2">
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Parecer: Autonomia técnico-científica do perito
            </a>
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Decisão: Adicional de insalubridade para peritos
            </a>
            <a href="#" className="block text-sindmoba-primary hover:underline">
              • Ver mais documentos técnicos...
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegislationPage;
