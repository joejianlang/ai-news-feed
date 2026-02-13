import { NextResponse } from 'next/server';
import { getNewsItemById } from '@/lib/supabase/queries';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing article ID' }, { status: 400 });
        }

        const item = await getNewsItemById(id);

        if (!item) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to fetch article',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
