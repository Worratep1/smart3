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
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]); // รายการอุปกรณ์ที่ยืม
  const [returnList, setReturnList] = useState<number[]>([]); // เก็บ ID ของรายการที่ต้องการคืน
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลอุปกรณ์ที่ถูกยืม
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data?.data) {
        // กรองเฉพาะอุปกรณ์ที่ยืมไป โดยใช้ filter ค่าของ is_borrowed เพื่อให้แสดงเฉพาะอุปกรณ์ที่ถูกยืม
        const borrowedData = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list
            .filter((eq: any) => eq.is_borrowed) // กรองเฉพาะอุปกรณ์ที่ยืมไป
            .map((eq: any) => ({
              borrow_equipment_id: eq.borrow_equipment_id,
              equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล",
              equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล",
              startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
              endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
            }))
        );
        setBorrowedItems(borrowedData); // อัปเดตรายการอุปกรณ์ที่ยืม
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถโหลดรายการอุปกรณ์ที่ถูกยืมได้' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedItems(); // ดึงข้อมูลเมื่อเริ่มโหลด
  }, []); // ฟังก์ชันนี้จะเรียกเพียงครั้งเดียวเมื่อโหลดครั้งแรก

  // ฟังก์ชันลบอุปกรณ์ออกจาก UI (ถือว่าอุปกรณ์ถูกคืน)
  const removeItem = (index: number, id: number) => {
    setReturnList([...returnList, id]); // เก็บ ID ของอุปกรณ์ที่ถูกคืน
    setBorrowedItems(borrowedItems.filter((_, i) => i !== index)); // ลบอุปกรณ์ออกจาก UI
  };

  // ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      // ส่งรายการที่ถูกคืนไปยัง API
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList, // ส่ง ID ของอุปกรณ์ที่ถูกคืน
      });

      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]); // รีเซ็ตรายการที่เลือกคืน
      fetchBorrowedItems(); // โหลดข้อมูลใหม่หลังจากการคืน
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
              borrowedItems.map((item, index) => (
                <Toast key={index} onClose={() => removeItem(index, item.borrow_equipment_id)} className="mb-2">
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

          {/* ปุ่มบันทึกการคืนอุปกรณ์ */}
          <Button variant="primary" onClick={handleReturnSubmit} disabled={returnList.length === 0}>
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืน'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
