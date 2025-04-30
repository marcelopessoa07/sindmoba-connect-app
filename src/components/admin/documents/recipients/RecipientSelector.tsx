
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SpecialtySelector, SpecialtyType } from './SpecialtySelector';
import { MemberSelector, Member } from './MemberSelector';

// Recipient types
const recipientTypes = [
  { value: 'all', label: 'Todos os associados' },
  { value: 'specialty', label: 'Por especialidade' },
  { value: 'specific', label: 'Associados específicos' }
];

interface RecipientSelectorProps {
  recipientType: string;
  onRecipientTypeChange: (value: string) => void;
  selectedSpecialties: SpecialtyType[];
  onSpecialtyChange: (specialty: SpecialtyType) => void;
  selectedMembers: Member[];
  onMemberSelection: (member: Member) => void;
  disabled: boolean;
}

export const RecipientSelector = ({
  recipientType,
  onRecipientTypeChange,
  selectedSpecialties,
  onSpecialtyChange,
  selectedMembers,
  onMemberSelection,
  disabled
}: RecipientSelectorProps) => {
  const [availableMembers, setAvailableMembers] = React.useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);
  const { toast } = useToast();

  // Fetch all available members
  React.useEffect(() => {
    if (recipientType === 'specific') {
      fetchMembers();
    }
  }, [recipientType]);

  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialty, registration_number')
        .eq('role', 'member');

      if (error) {
        console.error('Error fetching members:', error);
        toast({
          title: 'Erro ao carregar associados',
          description: 'Não foi possível carregar a lista de associados.',
          variant: 'destructive',
        });
        return;
      }

      setAvailableMembers(data || []);
    } catch (error) {
      console.error('Exception fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  return (
    <RadioGroup
      onValueChange={onRecipientTypeChange}
      value={recipientType}
      className="space-y-3 border rounded-md p-3"
      disabled={disabled}
    >
      {recipientTypes.map((type) => (
        <div key={type.value} className="flex items-center space-x-2">
          <RadioGroupItem value={type.value} id={`recipient-${type.value}`} />
          <Label htmlFor={`recipient-${type.value}`} className="font-normal">
            {type.label}
          </Label>
        </div>
      ))}
      
      {recipientType === 'specialty' && (
        <div className="mt-2 space-y-2 pl-6 border-t pt-2">
          <p className="text-sm text-muted-foreground mb-2">Selecione as especialidades:</p>
          <SpecialtySelector 
            selectedSpecialties={selectedSpecialties}
            onSpecialtyChange={onSpecialtyChange}
            disabled={disabled}
          />
        </div>
      )}
      
      {recipientType === 'specific' && (
        <div className="mt-2 space-y-2 pl-6 border-t pt-2">
          <MemberSelector
            selectedMembers={selectedMembers}
            availableMembers={availableMembers}
            onMemberSelection={onMemberSelection}
            isLoadingMembers={isLoadingMembers}
            disabled={disabled}
          />
        </div>
      )}
    </RadioGroup>
  );
};

export { recipientTypes };
export type { Member };
