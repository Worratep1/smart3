import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    try {
        const body = req.body;

        // ตรวจสอบว่าข้อมูลครบถ้วน
        if (!body.borrow_date || !body.borrow_return || !body.borrow_user_id ||
            !body.borrow_address || !body.borrow_tel || !body.borrow_objective ||
            !body.borrow_name || !body.borrow_list || body.borrow_list.length === 0) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ✅ ใช้ Prisma Transaction เพื่อให้แน่ใจว่าทุกคำสั่งจะสำเร็จหรือถูกยกเลิก
        const transaction = await prisma.$transaction(async (prisma) => {
            // สร้างข้อมูลการยืมอุปกรณ์
            const borrowequipment = await prisma.borrowequipment.create({
                data: {
                    borrow_date: new Date(body.borrow_date),
                    borrow_return: new Date(body.borrow_return),
                    borrow_user_id: body.borrow_user_id,
                    borrow_address: body.borrow_address,
                    borrow_tel: body.borrow_tel,
                    borrow_objective: body.borrow_objective,
                    borrow_name: body.borrow_name,
                    borrow_create_date: new Date(),
                    borrow_update_date: new Date(),
                    borrow_update_user_id: body.borrow_user_id,
                },
            });

            // เพิ่มอุปกรณ์ที่ถูกยืม
            for (const item of body.borrow_list) {
                // ตรวจสอบว่าอุปกรณ์มีอยู่จริงหรือไม่
                const equipment = await prisma.equipment.findUnique({
                    where: { equipment_id: item.equipment_id }
                });

                if (!equipment) {
                    throw new Error(`อุปกรณ์ ID ${item.equipment_id} ไม่พบในระบบ`);
                }

                // บันทึกอุปกรณ์ที่ถูกยืม
                await prisma.borrowequipment_list.create({
                    data: {
                        borrow_id: borrowequipment.borrow_id,
                        equipment_id: item.equipment_id,
                    }
                });

                // อัปเดตสถานะอุปกรณ์ให้เป็น "ถูกยืมแล้ว" (0 = Borrowed)
                await prisma.equipment.update({
                    where: { equipment_id: item.equipment_id },
                    data: { equipment_status: 0 }
                });
            }

            return borrowequipment;
        });

        return res.status(200).json({ message: 'บันทึกข้อมูลสำเร็จ', data: transaction });

    } catch (error) {
        console.error("🚀 ~ handle ~ error:", error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error instanceof Error ? error.message : 'Unknown error' });
    }
}
