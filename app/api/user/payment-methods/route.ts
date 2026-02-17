import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // This is a placeholder for payment methods
    return NextResponse.json({ methods: [] });
}

export async function POST(request: NextRequest) {
    return NextResponse.json({ message: 'Payment method added' });
}

export async function DELETE(request: NextRequest) {
    return NextResponse.json({ message: 'Payment method removed' });
}
