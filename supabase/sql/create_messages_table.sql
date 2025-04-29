
-- Create messages table for user messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_system_message BOOLEAN NOT NULL DEFAULT false
);

-- Enable row level security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see messages addressed to them
CREATE POLICY "Users can view their own messages" 
  ON public.messages 
  FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Create policy for users to delete their own messages
CREATE POLICY "Users can delete their own messages" 
  ON public.messages 
  FOR DELETE 
  USING (auth.uid() = recipient_id);

-- Create policy so administrators can manage all messages
CREATE POLICY "Admins can manage all messages" 
  ON public.messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
