// 📁 src/pages/api/setting/getHeartrate.ts

import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { setting_id } = req.query

  // MOCK ข้อมูลกลับไปให้แสดงได้
  if (setting_id) {
    res.status(200).json({
      data: {
        min_bpm: 55,
        max_bpm: 110,
      },
    })
  } else {
    res.status(400).json({ message: 'Missing setting_id' })
  }
}
// ถ้าไม่มี setting_id จะส่งกลับ 400 Bad Request