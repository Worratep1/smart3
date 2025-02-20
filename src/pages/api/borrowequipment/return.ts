import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // ดึงเฉพาะข้อมูลที่มี borrow_equipment_status = 1 (กำลังถูกยืม)
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrowequipment_list: {
            some: {
              borrow_equipment_status: 1, // 1 = ยังยืมอยู่
            },
          },
        },
        include: {
          borrowequipment_list: {
            where: {
              borrow_equipment_status: 1, // เฉพาะรายการที่ยังยืมอยู่
            },
            include: {
              equipment: true, // ดึงข้อมูลอุปกรณ์
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
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
