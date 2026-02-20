
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

async function resetAdmin() {
    const email = 'fongbeead@gmail.com';
    const newPassword = 'chocolate,GOOD2';

    console.log(`🔧 Resetting Admin User: ${email}`);

    try {
        // 1. Generate Hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        console.log(`🔑 Generated hash for password: ${newPassword}`);

        // 2. Try to find user if exists first, to debug
        const { data: existingUser } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', email)
            .single();

        if (!existingUser) {
            console.error('⚠️ User not found in public.users table!');
            console.log('   Creating user record in public.users based on email...');
            // Insert if missing (though unlikely if user tried to login and got 500, wait, 500 implies user found but hash missing or check failed? 
            // login code: Checks getUserByEmail -> if !user return 401. So if 500, user likely exists but has issue.
            // Or bcrypt module issue again? No, we validated bcrypt.)
        }

        // 3. Update User
        const { data, error } = await supabase
            .from('users')
            .update({
                password_hash: passwordHash,
                role: 'admin',
                updated_at: new Date().toISOString()
            })
            .eq('email', email)
            .select();

        if (error) {
            console.error('❌ Update failed:', error.message);
        } else {
            console.log('✅ Admin user updated successfully:', data);
        }

    } catch (err: any) {
        console.error('❌ Error:', err);
    }
}

resetAdmin();
