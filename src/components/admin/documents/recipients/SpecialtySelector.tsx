import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Define the specialty type to match the database type
type SpecialtyType = Database['public']['Enums']['specialty_type'];

// Specialties - make sure these match the values in the database enum
const specialties: { value: SpecialtyType; label: string }[] = [
  { value: 'pml', label: 'Perícia Médica Legal' },
  { value: 'pol', label: 'Polícia Ostensiva Local' }
];

// Other specialty options for UI display only (not used in database)
const additionalSpecialties = [
  { value: 'onc', label: 'Oncologia' },
  { value: 'cir', label: 'Cirurgia' },
  { value: 'psq', label: 'Psiquiatria' },
  { value: 'ort', label: 'Ortopedia' }
];

// Combined specialties for UI display
const displaySpecialties = [...specialties, ...additionalSpecialties];

interface SpecialtySelectorProps {
  selectedSpecialties: SpecialtyType[];
  onSpecialtyChange: (specialty: SpecialtyType) => void;
  disabled: boolean;
}

export const SpecialtySelector = ({ 
  selectedSpecialties, 
  onSpecialtyChange, 
  disabled 
}: SpecialtySelectorProps) => {
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-2 gap-2">
      {displaySpecialties.map((specialty) => {
        // Determine if this specialty is valid for the database
        const isValidDatabaseSpecialty = specialties.some(s => s.value === specialty.value);
        
        return (
          <div key={specialty.value} className="flex items-center space-x-2">
            <Checkbox 
              id={`spec-${specialty.value}`}
              checked={selectedSpecialties.includes(specialty.value as SpecialtyType)}
              onCheckedChange={() => {
                if (isValidDatabaseSpecialty) {
                  onSpecialtyChange(specialty.value as SpecialtyType);
                } else {
                  toast({
                    title: "Especialidade não disponível",
                    description: "Esta especialidade ainda não está cadastrada no sistema.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={disabled || !isValidDatabaseSpecialty}
            />
            <Label 
              htmlFor={`spec-${specialty.value}`} 
              className={`font-normal ${!isValidDatabaseSpecialty ? "text-muted-foreground" : ""}`}
            >
              {specialty.label}
              {!isValidDatabaseSpecialty && <span className="text-xs ml-1">(em breve)</span>}
            </Label>
          </div>
        );
      })}
    </div>
  );
};

// Export specialties for reuse
export { specialties, displaySpecialties };
export type { SpecialtyType };
