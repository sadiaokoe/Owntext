-- 1. Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- 2. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, phone_number)
);

-- 3. Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Group Contacts (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.group_contacts (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, contact_id)
);

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;
CREATE POLICY "Users can manage own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own groups" ON public.groups;
CREATE POLICY "Users can manage own groups" ON public.groups FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own group_contacts" ON public.group_contacts;
CREATE POLICY "Users can manage own group_contacts" ON public.group_contacts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.user_id = auth.uid())
);

-- Fix messages policies (to be 100% sure it's correct)
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Service role can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;

CREATE POLICY "Users can manage their own messages"
    ON public.messages FOR ALL USING (auth.uid() = user_id);

-- Update triggers
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update the first user to be an admin (Assuming you are the only user right now)
UPDATE public.profiles SET role = 'admin';
