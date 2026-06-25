-- NotifyMe tables for n8n workflow support
-- Run this migration against your Supabase project

-- Telegram Groups (registered via /start)
CREATE TABLE public.telegram_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  invite_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_telegram_groups_chat_id ON public.telegram_groups(telegram_chat_id);

-- Group Members (students linked to telegram groups)
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_student_id ON public.group_members(student_id);

-- Events (deadlines extracted by AI from teacher messages)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  priority TEXT CHECK (priority IN ('High','Medium','Low')) DEFAULT 'Medium',
  category TEXT CHECK (category IN ('Exam','Assignment','Attendance','Fee','Placement','Other')) DEFAULT 'Other',
  raw_message TEXT,
  source TEXT DEFAULT 'telegram',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_events_group_id ON public.events(group_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);

-- Reminders (auto-generated from events at 7, 3, 1 day offsets)
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  category TEXT,
  priority TEXT,
  days_left INTEGER NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reminders_sent ON public.reminders(sent);
CREATE INDEX idx_reminders_event_date ON public.reminders(event_date);

-- Function to auto-create reminders when an event is inserted
CREATE OR REPLACE FUNCTION create_event_reminders()
RETURNS TRIGGER AS $$
DECLARE
  chat_id BIGINT;
  offset_days INTEGER;
BEGIN
  -- Get the telegram_chat_id for this group
  SELECT telegram_chat_id INTO chat_id
  FROM public.telegram_groups
  WHERE id = NEW.group_id;

  IF chat_id IS NOT NULL THEN
    FOREACH offset_days IN ARRAY ARRAY[7, 3, 1]
    LOOP
      -- Only create reminder if the event is far enough in the future
      IF (NEW.event_date - CURRENT_DATE) >= offset_days THEN
        INSERT INTO public.reminders (event_id, group_id, telegram_chat_id, title, event_date, category, priority, days_left)
        VALUES (NEW.id, NEW.group_id, chat_id, NEW.title, NEW.event_date, NEW.category, NEW.priority, offset_days);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_event_reminders
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION create_event_reminders();
