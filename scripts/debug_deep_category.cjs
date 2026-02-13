const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: categories } = await supabase.from('categories').select('id, name');
    const deepCat = categories.find(c => c.name === '深度');

    if (!deepCat) {
        console.log("Deep category not found");
        return;
    }

    const { data: items, error } = await supabase
        .from('news_items')
        .select('title, ai_summary, ai_commentary, is_published')
        .eq('category_id', deepCat.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Summary of items in category "${deepCat.name}":`);
    console.log(`Total items in DB: ${items.length}`);
    items.forEach((it, i) => {
        console.log(`[${i + 1}] Title: ${it.title}`);
        console.log(`    Has AI Summary: ${!!it.ai_summary}`);
        console.log(`    Has AI Commentary: ${!!it.ai_commentary}`);
        if (!it.ai_summary) {
            console.log(`    Summary Content: ${JSON.stringify(it.ai_summary)}`);
        }
    });
}

main();
