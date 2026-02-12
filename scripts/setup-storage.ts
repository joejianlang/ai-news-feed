
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupStorage() {
    console.log('Ensuring ad-images bucket exists...');

    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
        console.error('Error listing buckets:', listError.message);
        return;
    }

    const exists = buckets.find(b => b.id === 'ad-images');

    if (!exists) {
        console.log('Bucket "ad-images" does not exist. Creating...');
        const { error: createError } = await supabaseAdmin.storage.createBucket('ad-images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) {
            console.error('Error creating bucket:', createError.message);
        } else {
            console.log('Successfully created ad-images bucket.');
        }
    } else {
        console.log('Bucket "ad-images" already exists.');
        // Ensure it is public
        if (!exists.public) {
            console.log('Updating bucket to be public...');
            await supabaseAdmin.storage.updateBucket('ad-images', { public: true });
        }
    }

    console.log('\n--- IMPORTANT SQL ACTION REQUIRED ---');
    console.log('If you still get RLS errors, please run this SQL in your Supabase Dashboard SQL Editor:');
    console.log(`
-- 允许所有人读取图片
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');

-- 允许所有人上传图片 (因为使用自定义 Auth 系统)
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-images');
    `);
}

setupStorage().catch(console.error);
