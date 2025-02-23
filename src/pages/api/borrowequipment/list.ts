// File: /pages/api/borrowequipment/list.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // รับ query parameter "status" ถ้ามี ส่งมาในรูปแบบตัวเลข
      const { status } = req.query;
      // ถ้าไม่มีค่า default ให้ใช้สถานะ 1 (สำหรับแอดมินดูคำขอรออนุมัติ)
      const statusValue = status ? parseInt(status as string) : 1;

      // ดึงข้อมูลจากฐานข้อมูลโดยกรองเฉพาะรายการที่ตรงกับสถานะที่ส่งเข้ามา
      const borrowedItems = await prisma.borrowequipment.findMany({
        where: {
          borrowequipment_list: {
            some: {
              borrow_equipment_status: statusValue,
              equipment: {
                // สำหรับกรณีทั้งสองสถานะ (รออนุมัติหรืออนุมัติ) อุปกรณ์จะถูกยืมอยู่ (equipment_status = 0)
                equipment_status: 0,
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
