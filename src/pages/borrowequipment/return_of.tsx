import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';
import Button from 'react-bootstrap/Button';

import styles from '@/styles/page.module.css';

// กำหนด Interface ของรายการที่ถูกยืมโดยเพิ่ม borrow_equipment_status เพื่อใช้กรอง
interface BorrowedItemType {
  borrow_equipment_id: number;
  equipment_name: string;
  equipment_code: string;
  startDate: string;
  endDate: string;
  borrow_equipment_status: number; // 1 = ยืมอยู่, 2 = คืนแล้ว (หรือค่าที่คุณกำหนด)
}

const ReturnOf = () => {
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // เก็บ ID ของรายการที่ต้องการคืน
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลอุปกรณ์ที่ถูกยืมจาก API และกรองเฉพาะรายการที่ยังถูกยืม (borrow_equipment_status = 1)
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data?.data) {
        const borrowedData: BorrowedItemType[] = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => ({
            borrow_equipment_id: eq.borrow_equipment_id, // ใช้ ID ของรายการ
            equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล", // ชื่ออุปกรณ์
            equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล", // หมายเลขอุปกรณ์
            startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
            endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
            borrow_equipment_status: eq.borrow_equipment_status, // รับสถานะของรายการ
          }))
        );
        // กรองเฉพาะรายการที่ยังยืมอยู่ (borrow_equipment_status === 1)
        const filteredData = borrowedData.filter(item => item.borrow_equipment_status === 1);
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
  }, []);

  // ฟังก์ชันลบอุปกรณ์ออกจาก UI เมื่อผู้ใช้กดกากบาท
  // เมื่อกดกากบาท จะเก็บ ID ของรายการนั้นไว้ใน returnList และลบออกจาก borrowedItems
  const removeItem = (id: number) => {
    setReturnList(prev => [...prev, id]);
    setBorrowedItems(prev => prev.filter(item => item.borrow_equipment_id !== id));
  };

  // ฟังก์ชันบันทึกการคืนอุปกรณ์
  // เมื่อกดบันทึก ระบบจะส่ง returnList ไปให้ API เพื่ออัปเดตสถานะในฐานข้อมูล
  // หลังจากนั้น re-fetch รายการที่ยังถูกยืมอยู่ (ที่มี borrow_equipment_status = 1)
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList, // ส่งรายการ ID ที่ถูกคืนไปอัปเดตสถานะในฐานข้อมูล
      });
      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]);
      // re-fetch รายการที่ยังยืมอยู่ ซึ่งจะไม่รวมรายการที่ถูกคืน (borrow_equipment_status ≠ 1)
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
                <Toast
                  key={item.borrow_equipment_id}
                  onClose={() => removeItem(item.borrow_equipment_id)}
                  className="mb-2"
                >
                  <Toast.Header>
                    <strong className="me-auto">{item.equipment_name}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>
                        หมายเลขอุปกรณ์: {item.equipment_code}
                      </span>
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
