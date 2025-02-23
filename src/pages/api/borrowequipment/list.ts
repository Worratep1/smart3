import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // รับ query parameter "userId" ถ้ามี
      const { userId } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : undefined;

      // สร้างเงื่อนไข where
      const whereClause: any = {
        borrowequipment_list: {
          some: {
            borrow_equipment_status: 1, // กำลังยืมอยู่
            equipment: {
              equipment_status: 0, // ถูกยืมอยู่
            },
          },
        },
      };

      // หากมี userId ให้กรองเฉพาะรายการที่สังกัดผู้ใช้นั้นด้วย
      if (userIdNum) {
        // สมมติว่ามี relation ชื่อ users_id_ref และใน Users model มีฟิลด์ id
        whereClause.users_id_ref = { id: userIdNum };
      }

      const borrowedItems = await prisma.borrowequipment.findMany({
        where: whereClause,
        include: {
          borrowequipment_list: {
            where: {
              borrow_equipment_status: 1,
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
