
// File categories for reuse across the application
export const fileCategories = [
  { value: 'estatuto', label: 'Estatuto do SINDMOBA' },
  { value: 'atas', label: 'Atas de assembleias' },
  { value: 'convenios', label: 'Convênios e acordos coletivos' },
  { value: 'comunicados', label: 'Comunicados oficiais' },
  { value: 'outros', label: 'Outros documentos' }
];

// Recipient types
export const recipientTypes = [
  { value: 'all', label: 'Todos os associados' },
  { value: 'specialty', label: 'Por especialidade' },
  { value: 'specific', label: 'Associados específicos' }
];

// Acceptable file types for document uploads
export const documentAcceptedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
