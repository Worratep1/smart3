import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostbackHeartRate } from '@/utils/apiLineReply'; // สมมุติว่าใช้แจ้งเตือน LINE
import moment from 'moment';

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const body = req.body;

            if (!body.uId || !body.takecare_id || !body.bpm) {
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uId, takecare_id, bpm' });
            }

            if (_.isNaN(Number(body.uId)) || _.isNaN(Number(body.takecare_id)) || _.isNaN(Number(body.status))) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ uId, takecare_id, status ไม่ใช่ตัวเลข' });
            }

            const user = await prisma.users.findFirst({
                where: { users_id: Number(body.uId) },
                include: {
                    users_status_id: { select: { status_name: true } }
                }
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    takecare_id: Number(body.takecare_id),
                    takecare_status: 1
                }
            });

            if (!user || !takecareperson) {
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

            // อ่านค่าการตั้งค่า HR
            const settingHR = await prisma.heartrate_settings.findFirst({
                where: {
                    takecare_id: takecareperson.takecare_id,
                    users_id: user.users_id
                }
            });

            // เปรียบเทียบค่า HR กับที่ตั้งไว้ (เช็คแค่ max_bpm)
            const bpmValue = Number(body.bpm);
            let calculatedStatus = Number(body.status);

            // เช็คเฉพาะค่าที่เกิน max_bpm เท่านั้น
            if (settingHR && bpmValue > settingHR.max_bpm) {
                calculatedStatus = 1; // เกิน max_bpm ถือว่าผิดปกติ
            } else {
                calculatedStatus = 0; // ปกติ
            }

            const status = calculatedStatus;

            const lastHR = await prisma.heartrate_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id
                },
                orderBy: {
                    noti_time: 'desc'
                }
            });

            // [REMOVE] ไม่ต้องคั่น episode ด้วยการหากลับสู่ปกติล่าสุดแล้ว
            // const lastNormal = await prisma.heartrate_records.findFirst({
            //   where: {
            //     users_id: user.users_id,
            //     takecare_id: takecareperson.takecare_id,
            //     status: 0
            //   },
            //   orderBy: { timestamp: 'desc' } // ใช้ timestamp ที่ละเอียดกว่า
            // });

            // [REMOVE] ไม่ต้องใช้คูลดาวน์ 5 นาทีจากการแจ้งจริงล่าสุดแล้ว
            // const lastNoti = await prisma.heartrate_records.findFirst({
            //   where: {
            //     users_id: user.users_id,
            //     takecare_id: takecareperson.takecare_id,
            //     noti_status: 1
            //   },
            //   orderBy: { noti_time: 'desc' }
            // });

            // [ADD] สร้างหน้าต่างเวลา 20 วินาทีล่าสุด (ปรับตัวเลขได้)
            const windowStart = new Date(Date.now() - 20 * 1000);

            // [CHANGE] นับจำนวนแจ้งจริงเฉพาะ "ภายใน 20 วินาทีล่าสุด"
            const notiCount = await prisma.heartrate_records.count({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                    noti_status: 1,
                    noti_time: { gte: windowStart }   // 👈 นับเฉพาะเหตุการณ์แจ้งใน 20 วินาทีหลังสุด
                }
            });

            // [REMOVE] คูลดาวน์ 5 นาที
            // const cooldownOk = !lastNoti?.noti_time ||
            //   moment().diff(moment(lastNoti.noti_time), 'minutes') >= 5;

            // ====== เงื่อนไขแจ้งเตือนแบบ rolling window ======
            if (status === 1 && notiCount < 5) {  // [CHANGE] ตัด cooldownOk ออก
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}\nชีพจรเกินค่าที่กำหนด: ${bpmValue} bpm`;

                const replyToken = user.users_line_id || '';
                if (replyToken) {
                    await replyNotificationPostbackHeartRate({
                        replyToken,
                        userId: user.users_id,
                        takecarepersonId: takecareperson.takecare_id,
                        type: 'heartrate',
                        message
                    });
                }

                await prisma.heartrate_records.create({
                    data: {
                        users_id: user.users_id,
                        takecare_id: takecareperson.takecare_id,
                        bpm: bpmValue,
                        record_date: new Date(),
                        timestamp: new Date(),   // [ADD] ถ้ามีฟิลด์นี้ แนะนำใส่ให้สม่ำเสมอ
                        status: 1,
                        noti_time: new Date(),
                        noti_status: 1
                    }
                });
            } else {
                await prisma.heartrate_records.create({
                    data: {
                        users_id: user.users_id,
                        takecare_id: takecareperson.takecare_id,
                        bpm: bpmValue,
                        record_date: new Date(),
                        timestamp: new Date(),   // [ADD] เช่นเดียวกัน
                        status: status,
                        noti_time: null,
                        noti_status: status === 0 ? 0 : null
                    }
                });
            }

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลเรียบร้อย' });

        } catch (error) {
            console.error("🚀 ~ API /sentHeartRate error:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'POST']);
        return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
    }
}
