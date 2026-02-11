import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
    console.log('🚀 Setting up storage bucket for ads...');

    // 1. Create bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('ad-images', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 5, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });

    if (bucketError) {
        if (bucketError.message.includes('already exists')) {
            console.log('✅ Bucket "ad-images" already exists.');
        } else {
            console.error('❌ Error creating bucket:', bucketError);
            return;
        }
    } else {
        console.log('✅ Created bucket "ad-images".');
    }

    // 2. Set RLS policies for storage (since it's public, we still need to allow uploads)
    // Note: This usually needs to be done via SQL as the Storage API doesn't support RLS policy management well.
    console.log('💡 Note: Please ensure RLS policies for the "ad-images" bucket allow anonymous/authenticated uploads if needed.');
}

setupStorage();
