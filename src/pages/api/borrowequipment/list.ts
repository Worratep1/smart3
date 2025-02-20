// File: /pages/api/borrowequipment/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // ดึงเฉพาะข้อมูลการยืมที่ยังมีรายการใน borrowequipment_list
      // ซึ่ง borrow_equipment_status = 1 (หมายถึงยังยืมอยู่)
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrowequipment_list: {
            some: {
              borrow_equipment_status: 1,  // 1 = ยืมอยู่
            },
          },
        },
        include: {
          borrowequipment_list: {
            where: {
              borrow_equipment_status: 1, // ดึงเฉพาะรายการย่อยที่ยังยืม
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
