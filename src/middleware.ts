import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { User } from '@/types/user';

export function middleware(request: NextRequest) {
    // อ่านข้อมูล currentUser จาก Cookies
    const currentUser = request.cookies.get('currentUser')?.value;
    if (currentUser) {
        const currentUserData: User = JSON.parse(currentUser);
        // คุณสามารถใช้ข้อมูล currentUserData ได้ที่นี่ เช่น:
        console.log("🚀 Middleware ~ currentUser:", currentUserData?.permission);
    }

    // ตรวจสอบ Method ที่รองรับ (PUT และ POST)
    const allowedMethods = ['PUT', 'POST'];
    if (!allowedMethods.includes(request.method)) {
        return new NextResponse('Method Not Allowed', { status: 405 });
    }

    // ตรวจสอบเส้นทาง (Path)
    const pathname = request.nextUrl.pathname;
    if (currentUser && !pathname.startsWith('/admin/dashboard')) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    if (!currentUser && !pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // อนุญาตให้ดำเนินการต่อไปยัง endpoint หรือหน้าอื่น ๆ
    return NextResponse.next();
}

// การกำหนด matcher สำหรับ Middleware
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'], // ใช้ regex เพื่อกำหนดเส้นทางที่ Middleware จะถูกใช้
};
