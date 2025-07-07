// 📁 src/pages/api/setting/saveHeartrate.ts

import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { users_id, takecare_id, min_bpm, max_bpm } = req.body

    // MOCK ว่าบันทึกสำเร็จ แล้วส่ง id กลับ
    res.status(200).json({
      id: 8, // สมมุติว่า id ของการตั้งค่าที่บันทึกสำเร็จคือ 8
    })
  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}
