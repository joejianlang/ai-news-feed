import { NextResponse } from 'next/server';
import { getAllUsers, updateUserRole, deleteUser, updateUserStatus } from '@/lib/supabase/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const users = await getAllUsers();
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Failed to get users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId, role, is_muted, is_suspended } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        let updatedUser;
        if (role !== undefined) {
            updatedUser = await updateUserRole(userId, role);
        } else if (is_muted !== undefined || is_suspended !== undefined) {
            updatedUser = await updateUserStatus(userId, { is_muted, is_suspended });
        } else {
            return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
        }

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Failed to update user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await deleteUser(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
