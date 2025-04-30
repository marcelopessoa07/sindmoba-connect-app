
// Common document utility constants and helpers

export const fileCategories = [
  { id: "estatuto", label: "Estatuto do SINDMOBA", value: "estatuto" },
  { id: "atas", label: "Atas de assembleias", value: "atas" },
  { id: "convenios", label: "Convênios e acordos coletivos", value: "convenios" },
  { id: "comunicados", label: "Comunicados oficiais", value: "comunicados" },
  { id: "outros", label: "Outros documentos", value: "outros" }
];

export const recipientTypes = [
  { id: "all", label: "Todos os associados" },
  { id: "specialty", label: "Por especialidade" },
];

export const specialtyOptions = [
  { id: "pml", label: "Polícia Militar Local" },
  { id: "pol", label: "Polícia Ordinária Local" },
];

// Helper function to get category label from id
export const getCategoryLabel = (categoryId: string): string => {
  const category = fileCategories.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 bytes';
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
