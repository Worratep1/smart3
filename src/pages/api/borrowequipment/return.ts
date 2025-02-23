// File: /pages/api/borrowequipment/return.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { returnList } = req.body; // Array ของ borrow_equipment_id ที่ต้องการคืน
      if (!returnList || returnList.length === 0) {
        return res.status(400).json({ message: 'ไม่มีรายการที่ต้องการคืน' });
      }

      // 1) ดึงข้อมูล equipment_id จากตาราง borrowequipment_list
      //    เพื่อทราบว่า borrow_equipment_id เหล่านี้เกี่ยวข้องกับอุปกรณ์ชิ้นไหน
      const returnedEquipments = await prisma.borrowequipment_list.findMany({
        where: { borrow_equipment_id: { in: returnList } },
        select: { equipment_id: true },
      });

      // 2) สร้าง array ของ equipment_id ที่เกี่ยวข้องกับรายการที่ถูกคืน
      const equipmentIds = returnedEquipments.map((item) => item.equipment_id);

      // 3) อัปเดตสถานะในตาราง equipment ให้เป็น 1 (ยังไม่ได้ถูกยืม / คืนแล้ว)
      await prisma.equipment.updateMany({
        where: { equipment_id: { in: equipmentIds } },
        data: { equipment_status: 1 }, // 1 = ไม่ได้ถูกยืม
      });

      // (อาจจะอัปเดตสถานะใน borrowequipment_list ด้วยถ้าต้องการเก็บประวัติการยืม-คืน)
      // เช่น:
      // await prisma.borrowequipment_list.updateMany({
      //   where: { borrow_equipment_id: { in: returnList } },
      //   data: { borrow_equipment_status: 2 }, // สมมุติให้ 2 = คืนแล้ว
      // });

      return res.status(200).json({ message: 'คืนอุปกรณ์สำเร็จแล้ว' });
    } catch (error) {
      console.error('Error updating return status:', error);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
