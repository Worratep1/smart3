import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, userId } = req.query;
      // กำหนดสถานะเริ่มต้นเป็น 1 (ยืมอยู่) ถ้าไม่มีส่งมา
      const statusValue = status ? parseInt(status as string) : 1;
      const userIdNum = userId ? parseInt(userId as string) : undefined;

      const whereClause: any = {
        borrowequipment_list: {
          some: {
            borrow_equipment_status: statusValue,
            equipment: {
              equipment_status: 0,
            },
          },
        },
      };

      // กรองเฉพาะรายการที่สังกัดผู้ใช้ที่ร้องขอ
      if (userIdNum) {
        // สมมติว่าความสัมพันธ์กับผู้ใช้ถูกจัดเก็บใน field "users_id_ref"
        whereClause.users_id_ref = { id: userIdNum };
      }

      const borrowedItems = await prisma.borrowequipment.findMany({
        where: whereClause,
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
