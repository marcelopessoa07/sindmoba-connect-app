
import { useEffect } from 'react';

const ContactPage = () => {
  useEffect(() => {
    // Redirecionar para o fórum ao acessar esta página
    window.location.href = 'https://forum.sindmoba.org.br/';
  }, []);

  return <div className="sindmoba-container">Redirecionando para o fórum...</div>;
};

export default ContactPage;
