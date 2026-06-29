const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://himqmeocewfhsmtzivzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbXFtZW9jZXdmaHNtdHppdnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDc3OTEsImV4cCI6MjA5ODMyMzc5MX0.AWQTSVzbz02XLtwFMuv_XCSPzoVjCm4U-cHVxyNixb4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: loginData } = await supabase.auth.signInWithPassword({
      email: 'nurulhudasadi353@gmail.com',
      password: 'NHSw353@',
  });
  
  const { data } = await supabase.from('profiles').select('*').eq('id', loginData.user.id);
  console.log('Profile:', data);
  
  if (data && data[0] && !data[0].is_approved) {
      console.log('Updating...');
      const { data: updateData, error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', loginData.user.id)
        .select();
      console.log('Update result:', updateData, error);
  }
}

check();
