import { NextApiRequest,NextApiResponse } from "next"; 
import prisma from "@/lib/prisma";
import _ from "lodash";
import moment from "moment";
import { replyNoti } from "@/utils/apiLineGroup";
import { replyNotificationPostback, replyNotificationPostbackfall } from "@/utils/apiLineReply";
import { error } from "console";

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method ==='POST'){
        try{
            const body = req.body;
            console.log("✅ uId =", body.uId);
            console.log("✅ takecare_id =", body.takecare_id);
            console.log("📦 Body received:", body); // ✅ DEBUG

            if(!body.uId || !body.takecare_id || !body.x_axis || !body.y_axis || !body.z_axis){
                console.log("❌ Missing required parameters");
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uId, takecare_id, x_axis, y_axis, z_axis' });
            }

            if ([body.uId, body.takecare_id, body.x_axis, body.y_axis, body.z_axis].some(val => _.isNaN(Number(val)))) {
                console.log("❌ Invalid parameter types");
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ uId, takecare_id, x_axis, y_axis, z_axis ไม่ใช่ตัวเลข' });
            }

            const user = await prisma.users.findFirst({
                where: { users_id: Number(body.uId) },
                include: {
                    users_status_id: {
                        select: { status_name: true }
                    }
                }
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    takecare_id: Number(body.takecare_id),
                    takecare_status: 1
                }
            });

            if (!user || !takecareperson) {
                console.log("❌ User or Takecareperson not found");
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

            const x = parseFloat(body.x_axis);
            const y = parseFloat(body.y_axis);
            const z = parseFloat(body.z_axis);
            const acceleration = Math.sqrt(x * x + y * y + z * z);
            const threshold = 21.33;
            console.log(`📊 Acceleration calculated: ${acceleration}`);

            let fall_status = acceleration > threshold ? 1 : 0;
            let noti_time: Date | null = null;
            let noti_status: number | null = null;

            const latestFall = await prisma.fall_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                },
                orderBy: {
                   fall_timestamp: 'desc'
                }
            });

            if (fall_status === 1 && (!latestFall|| latestFall.noti_status !== 1 || moment().diff(moment(latestFall.noti_time), 'minutes') >= 5)) {
                const message = `ตรวจพบการล้ม\nโดย ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}`;
                const replyToken = user.users_line_id || '';

                if (replyToken) {
                    console.log("📤 Sending fall LINE alert");
                    await replyNotificationPostbackfall({
                        userId: user.users_id,
                        takecarepersonId: takecareperson.takecare_id,
                        type: 'fall',
                        message,
                        replyToken
                    });
                    noti_status = 1;
                    noti_time = new Date();
                }
            } else if (fall_status === 0) {
                noti_status = 0;
                noti_time = null;
            }

            const fallData = {
                users_id: user.users_id,
                takecare_id: takecareperson.takecare_id,
                fall_latitude: body.latitude || '0',
                fall_longitude: body.longitude || '0',
                x_axis: x,
                y_axis: y,
                z_axis: z,
                fall_status,
                noti_time,
                noti_status
            };
            console.log("📝 Saving fall record:", fallData);

            await prisma.fall_records.create({ data: fallData });

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลสำเร็จ' });

        } catch (error) {
            console.error("/api/sentFall error:", error);
            return res.status(500).json({ message: 'error', data: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }
    } else {
        res.setHeader('Allow', 'PUT, POST');
        return res.status(405).json({ message: 'error', data: `Method ${req.method} not allowed` });
    }
}
