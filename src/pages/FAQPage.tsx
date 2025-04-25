
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQPage = () => {
  const faqItems = [
    {
      question: "Como me filiar ao SINDMOBA?",
      answer: "Para se filiar ao SINDMOBA, você deve preencher o formulário de filiação disponível neste aplicativo na seção 'Filiação ao Sindicato'. Após o preenchimento, nossa equipe analisará seus dados e documentos, e entrará em contato para finalizar o processo. Alternativamente, você também pode visitar nossa sede com seus documentos pessoais, comprovante de vínculo profissional e uma foto 3x4."
    },
    {
      question: "Quais documentos preciso enviar para me filiar?",
      answer: "Para se filiar, você precisará enviar: documento de identidade com foto (RG ou CNH), CPF, comprovante de residência recente, comprovante de vínculo como Perito Médico Legal ou Perito Odonto Legal (contracheque ou declaração), número de registro no conselho profissional (CRM ou CRO) e uma foto digital 3x4 recente."
    },
    {
      question: "Quais são os benefícios da sindicalização?",
      answer: "Ao se sindicalizar, você terá: representação jurídica em questões trabalhistas, assistência em processos administrativos, descontos em cursos e eventos de capacitação, acesso exclusivo a documentos e comunicados oficiais, participação nas assembleias com direito a voto, acesso ao clube de benefícios com descontos em estabelecimentos parceiros, auxílio jurídico em questões profissionais e networking com outros profissionais da área."
    },
    {
      question: "Como participar das assembleias?",
      answer: "As assembleias são divulgadas com antecedência por e-mail, pelo aplicativo na seção 'Agenda e Eventos' e no site do sindicato. Para participar, basta comparecer no horário e local indicados com seu documento de identificação. Assembleias virtuais terão links de acesso enviados por e-mail aos associados. Apenas membros em dia com suas contribuições têm direito a voto."
    },
    {
      question: "Qual é o valor da contribuição sindical?",
      answer: "A contribuição sindical atual é de 1% sobre o salário-base, limitado ao teto estabelecido em assembleia. O pagamento é feito mensalmente por desconto em folha, após autorização do associado. Para mais informações sobre valores e formas alternativas de pagamento, entre em contato com nossa secretaria."
    },
    {
      question: "Como entrar em contato com o departamento jurídico?",
      answer: "Para contatar nosso departamento jurídico, você pode: utilizar o botão 'Fale com o Jurídico' na seção 'Contato e Atendimento' deste aplicativo, enviar um e-mail para juridico@sindmoba.org.br, ligar para (71) 3333-2222 ramal 205 durante o horário comercial, ou agendar um atendimento presencial em nossa sede."
    },
    {
      question: "Como recuperar minha senha do aplicativo?",
      answer: "Na tela de login, clique em 'Esqueceu a senha?' e siga as instruções para redefinir sua senha. Você receberá um link de redefinição no e-mail cadastrado. Se continuar com problemas, entre em contato com nossa equipe de suporte."
    },
    {
      question: "Como atualizar meus dados cadastrais?",
      answer: "Para atualizar seus dados, acesse seu perfil no aplicativo e selecione a opção 'Atualizar dados cadastrais'. Alternativamente, você pode enviar um e-mail para cadastro@sindmoba.org.br com as informações atualizadas e documentos comprobatórios, quando necessário."
    }
  ];

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Perguntas Frequentes</h2>
      <p className="mb-6 text-gray-600">
        Encontre respostas para as dúvidas mais comuns sobre o SINDMOBA, processos de filiação, 
        benefícios e serviços oferecidos aos associados.
      </p>
      
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-medium text-sindmoba-dark">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-8 rounded-lg bg-sindmoba-light p-4">
        <p className="text-center text-gray-700">
          Não encontrou o que procurava?{' '}
          <a href="/contact" className="font-medium text-sindmoba-primary hover:underline">
            Fale conosco
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
