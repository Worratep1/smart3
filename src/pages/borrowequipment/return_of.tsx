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
  const [returnList, setReturnList] = useState<number[]>([]);
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลจาก API /api/borrowequipment/list
  // ซึ่งควรดึงเฉพาะรายการที่ borrow_equipment_status=1 (ยังยืมอยู่) เท่านั้น
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      console.log("API Response:", response.data);

      if (response.data?.data) {
        const borrowedData = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => ({
            borrow_equipment_id: eq.borrow_equipment_id,
            equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล",
            equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล",
            startDate: item.borrow_date
              ? new Date(item.borrow_date).toISOString().split('T')[0]
              : "",
            endDate: item.borrow_return
              ? new Date(item.borrow_return).toISOString().split('T')[0]
              : "",
          }))
        );
        setBorrowedItems(borrowedData);
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

  // เมื่อกดปิด Toast (กากบาท) ให้ถือว่าอุปกรณ์นั้นถูกเลือกสำหรับคืน
  const removeItem = (index: number, id: number) => {
    setReturnList(prev => [...prev, id]);
    setBorrowedItems(prev => prev.filter((_, i) => i !== index));
  };

  // เมื่อกดปุ่ม "บันทึกการคืน"
  // เรียก API /api/borrowequipment/return เพื่ออัปเดตสถานะใน DB
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList,
      });
      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]);

      // หากต้องการดึงข้อมูลใหม่จากฐานข้อมูล เพื่อให้มั่นใจว่า
      // ไม่มีรายการเก่าๆ โผล่มาอีก (ถ้า DB อัปเดตแล้ว)
      await fetchBorrowedItems();

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
                <Toast
                  key={index}
                  onClose={() => removeItem(index, item.borrow_equipment_id)}
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

          <Button
            variant="primary"
            onClick={handleReturnSubmit}
            disabled={returnList.length === 0}
          >
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกการคืน'}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
//git add .
//git commit -m "Add return equipment API"