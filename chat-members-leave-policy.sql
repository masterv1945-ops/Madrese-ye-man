-- اجازه می‌دهد کاربر فقط عضویت خودش را در گروه یا کانال ترک کند.
-- این سیاست جایگزین سیاست‌های دیگر جدول chat_members نیست.

ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can leave own chat rooms" ON public.chat_members;
CREATE POLICY "Users can leave own chat rooms"
ON public.chat_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
