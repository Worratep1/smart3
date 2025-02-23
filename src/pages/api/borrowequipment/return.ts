// File: /pages/api/borrowequipment/return.ts

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // รับค่า returnList ซึ่งเป็นอาเรย์ของ borrow_equipment_id ที่ต้องการคืน
      const { returnList } = req.body;
      if (!returnList || !Array.isArray(returnList)) {
        return res.status(400).json({ message: "Invalid request: returnList must be an array" });
      }

      // อัปเดตสถานะในตาราง borrowequipment_list ให้เป็นคืนแล้ว (borrow_equipment_status = 0)
      const updatedBorrowList = await prisma.borrowequipment_list.updateMany({
        where: {
          borrow_equipment_id: { in: returnList },
        },
        data: {
          borrow_equipment_status: 0, // 0 = คืนแล้ว
          // หากต้องการบันทึกเวลาที่คืน สามารถเพิ่ม field เช่น returned_date: new Date()
        },
      });

      // ดึง equipment_id ที่เกี่ยวข้องกับ borrow_equipment_id ที่ถูกคืน
      const equipmentRecords = await prisma.borrowequipment_list.findMany({
        where: {
          borrow_equipment_id: { in: returnList },
        },
        select: {
          equipment_id: true,
        },
      });

      // สร้างอาเรย์ของ equipment_id โดยกำจัดค่าซ้ำ
      const equipmentIds = Array.from(new Set(equipmentRecords.map(record => record.equipment_id)));

      // อัปเดตสถานะในตาราง equipment ให้เป็นว่าง (equipment_status = 1)
      const updatedEquipment = await prisma.equipment.updateMany({
        where: {
          equipment_id: { in: equipmentIds },
        },
        data: {
          equipment_status: 1, // 1 = ว่างสำหรับยืม
        },
      });

      return res.status(200).json({
        message: 'คืนอุปกรณ์สำเร็จแล้ว',
        data: {
          updatedBorrowList,
          updatedEquipment,
        },
      });
    } catch (error) {
      console.error('Error returning equipment:', error);
      return res.status(500).json({
        message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์',
        error,
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
