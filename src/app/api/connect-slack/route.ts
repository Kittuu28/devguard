import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL('/auth/login', process.env.APP_BASE_URL!);
  url.searchParams.set('connection', 'sign-in-with-slack');
  return NextResponse.redirect(url);
}