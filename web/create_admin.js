const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://himqmeocewfhsmtzivzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbXFtZW9jZXdmaHNtdHppdnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDc3OTEsImV4cCI6MjA5ODMyMzc5MX0.AWQTSVzbz02XLtwFMuv_XCSPzoVjCm4U-cHVxyNixb4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('Signing up user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'nurulhudasadi353@gmail.com',
    password: 'NHSw353@',
    options: {
      data: {
        full_name: 'Nurul Huda Sadi',
      }
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already registered. Attempting login to approve...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'nurulhudasadi353@gmail.com',
            password: 'NHSw353@',
        });
        if (loginError) {
            console.error('Login Error:', loginError.message);
            return;
        }
        
        console.log('Approving user...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_approved: true })
          .eq('id', loginData.user?.id);

        if (updateError) {
          console.error('Update Error:', updateError.message);
        } else {
          console.log('Success! User approved as Super Admin.');
        }
        return;
    }
    console.error('Auth Error:', authError.message);
    return;
  }

  console.log('User created:', authData.user?.id);
  
  // Wait a second for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('Approving user...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', authData.user?.id);

  if (updateError) {
    console.error('Update Error:', updateError.message);
  } else {
    console.log('Success! User approved as Super Admin.');
  }
}

createAdmin();
