import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' });
      }

      const statusValue = status ? parseInt(status as string) : 1;
      const userIdNum = parseInt(userId as string);

      // ✅ **กรองเฉพาะอุปกรณ์ที่ผู้ใช้ที่ล็อกอินอยู่ยืมไป**
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_user_id: userIdNum, // **กรองเฉพาะของผู้ใช้ที่ยืมอุปกรณ์**
          borrowequipment_list: {
            some: {
              borrow_equipment_status: statusValue,
              equipment: {
                equipment_status: 0, // **แสดงเฉพาะอุปกรณ์ที่ถูกยืม**
              },
            },
          },
        },
        include: {
          borrowequipment_list: {
            where: {
              borrow_equipment_status: statusValue,
            },
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
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
