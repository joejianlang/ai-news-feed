import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUniqueConstraint() {
    console.log('Checking unique constraint on user_source_follows');

    // Try to insert a duplicate record
    const testUserId = 'cf5f3c08-1b6a-44f1-a43a-dda0eaef4a09'; // Existing user from test-join output
    const testSourceId = '95fb1c6c-fdb7-45d9-815f-2525e848a0e2'; // Existing source from test-join output

    const { error } = await supabase
        .from('user_source_follows')
        .insert([{ user_id: testUserId, source_id: testSourceId }]);

    if (error) {
        console.log('Got error (as expected if unique constraint exists):', error.message, error.code);
    } else {
        console.log('✅ Duplicate insert worked! NO UNIQUE CONSTRAINT detected. This is a BUG.');
        // Clean up
        await supabase
            .from('user_source_follows')
            .delete()
            .eq('user_id', testUserId)
            .eq('source_id', testSourceId);
    }
}

checkUniqueConstraint();
