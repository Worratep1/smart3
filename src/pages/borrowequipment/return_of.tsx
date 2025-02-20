import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

import styles from '@/styles/page.module.css';

interface BorrowedItemType {
  borrow_equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // เก็บรายการที่เลือกคืน (ส่งให้ API)
  const [returnedIds, setReturnedIds] = useState<number[]>([]); // เก็บรายการ ID ที่คืนแล้ว (ใช้สำหรับกรองใน UI)
  const [alert, setAlert] = useState({ show: false, message: '' });

  // 🔹 ดึงข้อมูลอุปกรณ์ที่ถูกยืมจาก API
  // หลังจากดึงข้อมูลมา จะกรองรายการที่ถูกคืนออกโดยใช้ returnedIds
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data?.data) {
        const borrowedData = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => ({
            borrow_equipment_id: eq.borrow_equipment_id, // ใช้ ID ของรายการ
            equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล", // ชื่ออุปกรณ์
            equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล", // หมายเลขอุปกรณ์
            startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
            endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
          }))
        );
        // 🔹 กรองข้อมูลที่มี ID อยู่ใน returnedIds (รายการที่คืนแล้ว) ออกไป
        const filteredData = borrowedData.filter((item: { borrow_equipment_id: number; }) => !returnedIds.includes(item.borrow_equipment_id));
        setBorrowedItems(filteredData);
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedItems();
  }, [returnedIds]); // 🔹 เมื่อ returnedIds เปลี่ยนแปลง ให้ re-fetch เพื่ออัปเดต UI

  // 🔹 ฟังก์ชันลบอุปกรณ์ออกจาก UI เมื่อกดกากบาท (ถือว่าอุปกรณ์ถูกเลือกคืน)
  // เปลี่ยนให้ใช้ id เป็นตัวระบุ (ไม่ใช้ index)
  const removeItem = (id: number) => {
    // เพิ่ม id ที่เลือกคืนเข้าไปใน returnList (สำหรับส่งให้ API)
    setReturnList(prev => [...prev, id]);
    // เพิ่ม id เข้าไปใน returnedIds (สำหรับกรอง UI)
    setReturnedIds(prev => [...prev, id]);
    // ลบรายการออกจาก borrowedItems โดยกรองจาก borrow_equipment_id
    setBorrowedItems(prev => prev.filter(item => item.borrow_equipment_id !== id));
  };

  // 🔹 ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList, // ส่งรายการ ID ที่ถูกคืนไปให้ API อัปเดตสถานะในฐานข้อมูล
      });

      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      // หลังจากคืนสำเร็จ ให้เคลียร์ returnList แต่ให้ returnedIds คงอยู่ไว้เพื่อกรอง UI
      setReturnList([]);
      // re-fetch ข้อมูลเพื่ออัปเดต UI (รายการที่คืนแล้วจะถูกกรองออกโดยใช้ returnedIds)
      fetchBorrowedItems();
    } catch (error) {
      console.error('Error returning equipment:', error);
      setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการคืนอุปกรณ์' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate>
          <Form.Group className="py-2">
            {isLoading ? (
              <p>กำลังโหลด...</p>
            ) : borrowedItems.length > 0 ? (
              borrowedItems.map((item) => (
                // 🔹 ใช้ borrow_equipment_id เป็น key และส่งค่าให้ removeItem เมื่อกดกากบาท
                <Toast key={item.borrow_equipment_id} onClose={() => removeItem(item.borrow_equipment_id)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>หมายเลขอุปกรณ์: {item.equipment_code}</span>
                    </div>
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.startDate}</span>
                      <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีอุปกรณ์ที่ถูกยืม</p>
            )}
          </Form.Group>

          {/* 🔹 ปุ่มบันทึกการคืนอุปกรณ์ */}
          <Button variant="primary" onClick={handleReturnSubmit} disabled={returnList.length === 0}>
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืน'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
