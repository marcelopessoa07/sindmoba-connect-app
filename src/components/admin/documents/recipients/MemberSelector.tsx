
import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { SpecialtyType, specialties } from './SpecialtySelector';

export interface Member {
  id: string;
  full_name: string;
  email: string;
  specialty?: SpecialtyType;
  registration_number?: string;
}

interface MemberSelectorProps {
  selectedMembers: Member[];
  availableMembers: Member[];
  onMemberSelection: (member: Member) => void;
  isLoadingMembers: boolean;
  disabled: boolean;
}

export const MemberSelector = ({
  selectedMembers,
  availableMembers,
  onMemberSelection,
  isLoadingMembers,
  disabled
}: MemberSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(availableMembers);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(availableMembers);
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      setFilteredMembers(
        availableMembers.filter(
          (member) =>
            member.full_name?.toLowerCase().includes(lowercasedSearchTerm) ||
            member.email?.toLowerCase().includes(lowercasedSearchTerm) ||
            member.registration_number?.toLowerCase().includes(lowercasedSearchTerm)
        )
      );
    }
  }, [searchTerm, availableMembers]);

  return (
    <>
      <div className="flex items-center space-x-2 mb-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar associados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled || isLoadingMembers}
          className="h-8"
        />
      </div>
      
      {selectedMembers.length > 0 && (
        <div className="mb-2">
          <p className="text-sm text-muted-foreground mb-1">Selecionados ({selectedMembers.length}):</p>
          <div className="flex flex-wrap gap-1">
            {selectedMembers.map(member => (
              <div 
                key={member.id}
                className="bg-muted text-xs flex items-center gap-1 px-2 py-1 rounded-full"
              >
                <span className="truncate max-w-[100px]">{member.full_name || member.email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onMemberSelection(member)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="border rounded-md h-48 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoadingMembers ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="p-1">
              {filteredMembers.map(member => (
                <div 
                  key={member.id} 
                  className={`flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                    selectedMembers.some(m => m.id === member.id) 
                      ? 'bg-accent/50' 
                      : ''
                  }`}
                  onClick={() => onMemberSelection(member)}
                >
                  <Checkbox 
                    checked={selectedMembers.some(m => m.id === member.id)}
                    onCheckedChange={() => {}}
                    disabled={disabled}
                  />
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <Avatar className="h-6 w-6 text-xs">
                      <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                        {(member.full_name?.charAt(0) || member.email?.charAt(0) || '').toUpperCase()}
                      </div>
                    </Avatar>
                    <div className="space-y-0.5 overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {member.full_name || member.email}
                      </p>
                      {member.specialty && (
                        <p className="text-xs text-muted-foreground truncate">
                          {specialties.find(s => s.value === member.specialty)?.label || member.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
              Nenhum associado encontrado
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
};
