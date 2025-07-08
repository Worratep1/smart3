// 📁 src/pages/api/setting/saveHeartrate.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import prisma  from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { users_id, takecare_id, min_bpm, max_bpm, setting_id } = req.body

  if (!users_id || !takecare_id || min_bpm == null || max_bpm == null) {
    return res.status(400).json({ message: 'กรุณาระบุข้อมูลให้ครบถ้วน' })
  }

  try {
    let savedSetting

    if (setting_id) {
      // ✅ อัปเดตการตั้งค่าที่มีอยู่
      savedSetting = await prisma.heartrate_settings.update({
        where: { id: Number(setting_id) },
        data: { users_id, takecare_id, min_bpm, max_bpm },
      })
    } else {
      // ✅ เพิ่มใหม่
      savedSetting = await prisma.heartrate_settings.create({
        data: { users_id, takecare_id, min_bpm, max_bpm },
      })
    }

    return res.status(200).json({ id: savedSetting.id })
  } catch (error) {
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error })
  }
}

     
 
