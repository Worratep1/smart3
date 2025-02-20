import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // กรองเฉพาะ borrowequipment ที่มีบางรายการ (some) ใน borrowequipment_list
      // ซึ่ง borrow_equipment_status = 1 และ equipment.equipment_status = 0
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrowequipment_list: {
            some: {
              borrow_equipment_status: 1,   // 1 = ยืมอยู่
              equipment: {
                equipment_status: 0,       // 0 = อุปกรณ์ถูกยืม
              },
            },
          },
        },
        include: {
          // จากนั้นดึงข้อมูลทั้งหมดใน borrowequipment_list + equipment
          // (ถ้าอยากได้เฉพาะสถานะ 1 ก็อาจกรองในฝั่ง Frontend หรือทำ nested where ก็ได้
          // แต่ถ้าเจอ error แนะนำให้ใช้วิธีนี้เพื่อเลี่ยงปัญหาเวอร์ชัน Prisma)
          borrowequipment_list: {
            include: {
              equipment: true,
            },
          },
        },
        orderBy: {
          borrow_create_date: 'desc',
        },
      });

      return res.status(200).json({ message: 'success', data: borrowedItems });
    } catch (error) {
      console.error('GET /api/borrowequipment/list ~ error:', error);
      return res.status(500).json({
        message: 'Error fetching borrowed items',
        error,
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }
}
