
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole() {
    const email = 'fongbeead@gmail.com';
    console.log(`Checking role for user: ${email}`);

    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, role, password_hash')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('User details:');
    console.log(`ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password Hash exists: ${!!user.password_hash}`);

    if (user.role !== 'admin') {
        console.log('WARNING: User is NOT an admin!');
    } else {
        console.log('SUCCESS: User is an admin.');
    }
}

checkUserRole();
