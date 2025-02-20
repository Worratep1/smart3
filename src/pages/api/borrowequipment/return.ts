// File: /pages/api/borrowequipment/return.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { returnList } = req.body; // [borrow_equipment_id, ...]
      if (!returnList || returnList.length === 0) {
        return res.status(400).json({ message: 'No items to return' });
      }

      // อัปเดตสถานะจาก 1 (ยืมอยู่) เป็น 2 (คืนแล้ว)
      await prisma.borrowequipment_list.updateMany({
        where: {
          borrow_equipment_id: {
            in: returnList,
          },
        },
        data: {
          borrow_equipment_status: 2, // 2 = คืนแล้ว (สมมุติ)
        },
      });

      return res.status(200).json({ message: 'คืนอุปกรณ์สำเร็จแล้ว' });
    } catch (error) {
      console.error('Error returning items:', error);
      return res.status(500).json({ message: 'Error returning items', error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
