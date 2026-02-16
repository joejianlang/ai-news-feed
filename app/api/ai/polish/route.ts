import { NextRequest, NextResponse } from 'next/server';
import { polishForumContent } from '@/lib/ai/forum';
import { verifyAdmin } from '@/lib/auth/adminAuth';

export async function POST(request: NextRequest) {
    try {
        const { content, title } = await request.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const polishedContent = await polishForumContent(content, title);

        return NextResponse.json({ polishedContent });
    } catch (error) {
        console.error('AI Polish API error:', error);
        return NextResponse.json({ error: 'Failed to polish content' }, { status: 500 });
    }
}
