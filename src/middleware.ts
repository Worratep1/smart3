import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { User } from '@/types/user';

export function middleware(request: NextRequest) {
    // อ่านข้อมูล currentUser จาก Cookies
    const currentUser = request.cookies.get('currentUser')?.value;

    if (currentUser) {
        const currentUserData: User = JSON.parse(currentUser);
        console.log("🚀 ~ middleware ~ currentUser:", currentUserData?.permission);
    } else {
        console.log("🔒 ~ middleware ~ No currentUser found");
    }

    // ตรวจสอบ Method ที่รองรับ (PUT, POST, GET)
    const allowedMethods = ['PUT', 'POST', 'GET'];
    if (!allowedMethods.includes(request.method)) {
        return new NextResponse(
            JSON.stringify({ message: `Method ${request.method} ไม่อนุญาต` }),
            {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // ตรวจสอบเส้นทาง (Path) และ Redirect หากจำเป็น
    const pathname = request.nextUrl.pathname;
    if (currentUser && !pathname.startsWith('/admin/dashboard')) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    if (!currentUser && !pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // อนุญาตให้คำขอผ่านไปยังหน้า หรือ API ต่อไป
    return NextResponse.next();
}

export const config = {
    // กำหนด matcher เพื่อกำหนดเส้นทางที่ Middleware จะทำงาน
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'], // ใช้ regex เพื่อยกเว้นบางไฟล์หรือเส้นทาง
};
