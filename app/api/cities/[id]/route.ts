import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getAuthUser, checkAdmin } from '@/lib/auth/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = await createSupabaseAdminClient();
        const { data, error } = await supabase
            .from('cities')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating city:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getAuthUser(request);
    if (!authUser || !(await checkAdmin(authUser.id))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const supabase = await createSupabaseAdminClient();
        const { error } = await supabase
            .from('cities')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ message: 'City deleted' });
    } catch (error: any) {
        console.error('Error deleting city:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
