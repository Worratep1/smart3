import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // ดึงข้อมูลการยืมทั้งหมดที่มีรายการใน borrowequipment_list ซึ่ง borrow_equipment_status = 1
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrowequipment_list: {
            some: {
              borrow_equipment_status: 1,  // <-- ใช้ฟิลด์ borrow_equipment_status
            },
          },
        },
        include: {
          // ในแต่ละ borrowequipment ให้ส่งกลับเฉพาะ borrowequipment_list ที่ยังไม่คืน
          borrowequipment_list: {
            where: {
              borrow_equipment_status: 1, // <-- กรองเฉพาะที่ยังไม่คืน
            },
            include: {
              equipment: true, // ดึงข้อมูลอุปกรณ์ที่เกี่ยวข้อง
            },
          },
        },
        orderBy: {
          borrow_create_date: 'desc', // เรียงจากล่าสุด
        },
      });

      return res.status(200).json({ message: 'success', data: borrowedItems });
    } catch (error) {
      console.error("GET /api/borrowequipment/list ~ error:", error);
      return res.status(500).json({
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        data: error,
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }
}
