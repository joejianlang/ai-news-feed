import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth/server';
import bcrypt from 'bcryptjs';

async function checkAdmin(authUser: any) {
    const supabase = authUser.source === 'legacy'
        ? await createSupabaseAdminClient()
        : await createSupabaseServerClient();

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

    return userProfile?.role === 'admin';
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    try {
        const { password } = await request.json();
        if (!password || password.length < 6) {
            return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
        }

        const supabase = await createSupabaseAdminClient();
        const passwordHash = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: '密码重置成功' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
