-- 사용자 프로필 (auth.users는 Supabase가 자동 관리)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 저널 엔트리
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  prompt TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뉴스레터 구독
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 콘텐츠 테마
CREATE TABLE IF NOT EXISTS content_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  content JSONB,
  month INTEGER,
  year INTEGER,
  pillar_type TEXT CHECK (pillar_type IN ('self-existence', 'nature-cosmos', 'society-future')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 철학적 질문
CREATE TABLE IF NOT EXISTS philosophical_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  category TEXT,
  pillar_type TEXT,
  context TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 체크 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' = ANY(
    SELECT unnest(string_to_array(current_setting('app.admin_emails', TRUE), ','))
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) 정책

-- 프로필 보안
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 저널 보안
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

-- 공개 콘텐츠 (읽기 전용)
ALTER TABLE content_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published themes" ON content_themes FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins can manage themes" ON content_themes FOR ALL USING (is_admin());

ALTER TABLE philosophical_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active questions" ON philosophical_questions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage questions" ON philosophical_questions FOR ALL USING (is_admin());

-- 뉴스레터 구독 보안
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can view subscriptions" ON newsletter_subscriptions FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage subscriptions" ON newsletter_subscriptions FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete subscriptions" ON newsletter_subscriptions FOR DELETE USING (is_admin());

-- 트리거: 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER create_profile_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_user();

-- 트리거: 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_journal_entries_modtime
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_content_themes_modtime
BEFORE UPDATE ON content_themes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 