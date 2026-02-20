
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function debugLogin() {
    console.log('🔍 Debugging Login (Bcrypt + Database)...');

    const testEmail = 'joelyan00@gmail.com'; // Adjust if needed
    const testPassword = 'chocolate'; // Adjust if needed

    try {
        // 1. Check Bcrypt
        console.log('\n--- 1. Testing Bcrypt Module ---');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(testPassword, salt);
        const isValid = await bcrypt.compare(testPassword, hash);
        console.log(`✅ Bcrypt is working. Hash generated: ${hash.substring(0, 10)}... Valid: ${isValid}`);

        // 2. Check Database User
        console.log(`\n--- 2. Fetching User: ${testEmail} ---`);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', testEmail)
            .single();

        if (error) {
            console.error('❌ Database fetch failed:', error.message);
            return;
        }

        if (!user) {
            console.error('❌ User not found in database.');
            return;
        }

        console.log('✅ User found:', user.email, 'Role:', user.role);
        // console.log('   Password Hash in DB:', user.password_hash); // Caution with logs

        // 3. Verify Password
        console.log('\n--- 3. Verifying Password ---');
        if (!user.password_hash) {
            console.error('❌ User has no password_hash set.');
            return;
        }

        // Note: This matches the logic in app/api/auth/login/route.ts
        const isMatch = await bcrypt.compare(testPassword, user.password_hash);
        if (isMatch) {
            console.log('✅ Password Match! Login should work.');
        } else {
            console.error('❌ Password Mismatch!');
            console.log('   Input:', testPassword);
            console.log('   Stored Hash:', user.password_hash);
        }

    } catch (err: any) {
        console.error('❌ Unexpected Error:', err);
        console.error(err.stack);
    }
}

debugLogin();
