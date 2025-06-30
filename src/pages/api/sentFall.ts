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

            if(!body.uId || !body.takecare_id || !body.x_axis || !body.y_axis || !body.z_axis){
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uId, takecare_id, x_axis, y_axis, z_axis' });
            }
            if (_.isNaN(Number(body.uId)) || _.isNaN(Number(body.takecare_id)) || _.isNaN(Number(body.x_axis)) || _.isNaN(Number(body.y_axis)) || _.isNaN(Number(body.z_axis))) {
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
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

             const x = parseFloat(body.x_axis); //เเปลงค่า x_axis เป็นตัวเลข
             const y = parseFloat(body.y_axis); //เเปลงค่า y_axis เป็นตัวเลข
             const z = parseFloat(body.z_axis); //เเปลงค่า z_axis เป็นตัวเลข
             const acceleration = Math.sqrt(x * x + y * y + z * z); //คำนวณค่าความเร่ง
             const threshold = 21.33; //เกณฑ์การล้ม

             let fall_status = acceleration > threshold ? 1 : 0; //ตรวจสอบว่าล้มไหม
             let noti_time: Date | null = null; //ตัวแปรเก็บเวลาแจ้งเตือน
             let noti_status: number | null = null; //ตัวแปรเก็บสถานะการแจ้งเตือน

             const latestFall = await prisma.fall_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                },
                orderBy: {
                   fall_timestamp: 'desc'  //เรียงจากมากไปน้อย (เช่น วันใหม่ล่าสุด → วันเก่า):
                }
            });

            if (fall_status === 1 && (!latestFall|| latestFall.noti_status !== 1 || moment().diff(moment(latestFall.noti_time), 'minutes') >= 5)) {
                const message = `ตรวจพบการล้ม\nโดย ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}`;
                const replyToken = user.users_line_id || '';

                if (replyToken) {
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
            await prisma.fall_records.create({
                data: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id,
                    fall_latitude: body.latitude || '0',
                    fall_longitude: body.longitude || '0',
                    x_axis: x,
                    y_axis: y,
                    z_axis: z,
                    fall_status: fall_status,
                    noti_time,
                    noti_status
                }
            });
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
    
    
