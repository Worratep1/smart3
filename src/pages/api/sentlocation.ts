import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma'; // Prisma ORM สำหรับจัดการฐานข้อมูล
import { replyNotification } from '@/utils/apiLineReply'; // ฟังก์ชันสำหรับส่งข้อความแจ้งเตือนผ่าน LINE

// ฟังก์ชันหลักที่จัดการคำขอ API
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    // ตรวจสอบว่าคำขอเป็นวิธี POST เท่านั้น
    if (req.method === 'POST') {
        try {
            // ดึงข้อมูลจาก body
            const { uId, takecare_id, distance, latitude, longitude, battery, status } = req.body;

            // ตรวจสอบว่า input ครบถ้วน
            if (!uId || !takecare_id || !distance || !latitude || !longitude || !battery || status === undefined) {
                return res.status(400).json({ message: 'error', data: 'กรุณาใส่ข้อมูลให้ครบถ้วน' });
            }

            // ค้นหาผู้ใช้ในฐานข้อมูลที่มี `users_id` ตรงกับ `uId`
            const user = await prisma.users.findFirst({
                where: { users_id: Number(uId) }
            });

            // ค้นหาผู้ดูแลที่เชื่อมโยงกับผู้ใช้ และมีสถานะ `takecare_status` = 1 (ใช้งานอยู่)
            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    users_id: user?.users_id, // ใช้ `users_id` จากข้อมูลผู้ใช้ที่ค้นเจอ
                    takecare_status: 1 // เฉพาะผู้ดูแลที่มีสถานะใช้งานอยู่
                }
            });

            // ตรวจสอบว่าพบทั้งผู้ใช้และผู้ดูแล
            if (user && takecareperson) {
                // สร้างข้อความแจ้งเตือนสำหรับผู้ดูแลที่ออกนอก Safezone
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname} 
                \nออกนอก Safezone 
                \nระยะทาง: ${distance} เมตร 
                \nพิกัด: (${latitude}, ${longitude}) 
                \nแบตเตอรี่: ${battery}% 
                \nสถานะ: ${status}`;

                // ดึง `users_line_id` ของผู้ใช้ (ตรวจสอบไม่ให้เป็น null)
                const replyToken = user.users_line_id || '';

                // เรียกใช้ฟังก์ชันเพื่อส่งข้อความแจ้งเตือนผ่าน LINE
                await replyNotification({ replyToken, message });

                // ตอบกลับคำขอด้วยสถานะ 200 พร้อมข้อมูลผู้ใช้และข้อมูลที่ส่งมา
                return res.status(200).json({
                    message: 'success',
                    data: {
                        user,
                        takecareperson,
                        details: { distance, latitude, longitude, battery, status }
                    }
                });
            } else {
                // หากไม่พบข้อมูลผู้ใช้หรือผู้ดูแล ตอบกลับด้วยสถานะ 400
                return res.status(400).json({ message: 'error', data: 'ไม่พบข้อมูลผู้ใช้หรือผู้ดูแล' });
            }
        } catch (error) {
            // จัดการข้อผิดพลาดในกรณีที่เกิดข้อผิดพลาดระหว่างการประมวลผล
            console.error("Error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการประมวลผล' });
        }
    } else {
        // หากคำขอไม่ใช่วิธี POST ตอบกลับด้วยสถานะ 405 Method Not Allowed
        res.setHeader('Allow', ['POST']); // กำหนดให้รองรับเฉพาะ POST
        res.status(405).json({ message: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
