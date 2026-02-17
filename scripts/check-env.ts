import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Environment Check:');
console.log('URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('ISSUE: Both keys present. Current logic in client.ts will pick ANON_KEY because of || ordering if NEXT_PUBLIC_SUPABASE_ANON_KEY is first.');
}
