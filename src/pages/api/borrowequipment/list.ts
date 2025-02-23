import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { status, userId } = req.query;
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

      if (userIdNum) {
        // ปรับให้ตรงกับ Schema ของคุณ:
        whereClause.user_id = userIdNum;
        // หรือใช้:
        // whereClause.users_id_ref = { id: userIdNum };
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
