export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      category_params: {
        Row: {
          category_type: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          contact_email: string | null
          created_at: string | null
          id: string
          legal_email: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          legal_email?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          legal_email?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      document_recipients: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          recipient_id: string | null
          recipient_type: string
          specialty: Database["public"]["Enums"]["specialty_type"] | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          recipient_id?: string | null
          recipient_type: string
          specialty?: Database["public"]["Enums"]["specialty_type"] | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          recipient_id?: string | null
          recipient_type?: string
          specialty?: Database["public"]["Enums"]["specialty_type"] | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_recipients_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          file_size: number
          file_type: string
          file_url: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size: number
          file_type: string
          file_url: string
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          event_type: string
          id: string
          location: string | null
          notify_target: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          event_type: string
          id?: string
          location?: string | null
          notify_target?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          location?: string | null
          notify_target?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      legislation_items: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      member_submissions: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          observations: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          observations?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          observations?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system_message: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system_message?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string | null
          subject?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          notify_target: string | null
          published_at: string | null
          summary: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          notify_target?: string | null
          published_at?: string | null
          summary: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          notify_target?: string | null
          published_at?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pending_registrations: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          current_job: string | null
          document_id: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          registration_code: string | null
          registration_number: string | null
          specialty: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          current_job?: string | null
          document_id?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          registration_code?: string | null
          registration_number?: string | null
          specialty?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          current_job?: string | null
          document_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          registration_code?: string | null
          registration_number?: string | null
          specialty?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          cpf: string | null
          created_at: string | null
          current_job: string | null
          document_id: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          registration_number: string | null
          role: string | null
          specialty: Database["public"]["Enums"]["specialty_type"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          current_job?: string | null
          document_id?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          registration_number?: string | null
          role?: string | null
          specialty?: Database["public"]["Enums"]["specialty_type"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cpf?: string | null
          created_at?: string | null
          current_job?: string | null
          document_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          registration_number?: string | null
          role?: string | null
          specialty?: Database["public"]["Enums"]["specialty_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      specialty_type: "pml" | "pol"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      specialty_type: ["pml", "pol"],
    },
  },
} as const
