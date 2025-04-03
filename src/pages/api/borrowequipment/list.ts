// File: /pages/api/borrowequipment/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // รับ userId จาก query parameter
      const { userId } = req.query;
      // ถ้า userId ไม่ถูกส่งมา ให้ส่งกลับ error
      if (!userId) {
        return res.status(400).json({ message: 'Missing userId query parameter' });
      }

      // ดึงเฉพาะ borrowequipment ที่มีรายการใน borrowequipment_list
      // ที่มี borrow_equipment_status = 2 (อนุมัติแล้ว)
      // และ borrow_user_id ตรงกับ userId ที่ส่งมา
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrow_user_id: Number(userId),
          borrowequipment_list: {
            some: {
              borrow_equipment_status: 2,
              equipment: {
                equipment_status: 0, // สมมุติว่า equipment_status = 0 หมายถึงถูกยืม
              },
            },
          },
        },
        include: {
          borrowequipment_list: {
            where: {
              borrow_equipment_status: 2,
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
//git add .
//git commit -m "Update list API to filter by userId and approved status"
