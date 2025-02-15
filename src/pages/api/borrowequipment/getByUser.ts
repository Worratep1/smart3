import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
        }

        // ดึงข้อมูลอุปกรณ์ที่ถูกยืมไป
        const borrowedItems = await prisma.borrowequipment.findMany({
            where: { borrow_user_id: Number(userId), borrow_status: 1 },
            include: {
                borrowequipment_list: true
            }
        });

        const formattedItems = borrowedItems.flatMap(item => 
            item.borrowequipment_list.map(equipment => ({
                listName: equipment.borrow_equipment,
                numberCard: equipment.borrow_equipment_number,
                startDate: item.borrow_date.toISOString().split('T')[0],
                endDate: item.borrow_return ? item.borrow_return.toISOString().split('T')[0] : 'ไม่ระบุ'
            }))
        );

        return res.status(200).json({ borrowedItems: formattedItems });
    } catch (error) {
        console.error('Error fetching borrowed items:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
