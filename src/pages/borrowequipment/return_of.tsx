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
  // เพิ่ม field นี้เพื่อเก็บค่าดิบจาก API สำหรับ borrow_return
  // ใช้ ? เพื่อป้องกัน error กรณีข้อมูลบางชิ้นไม่มีฟิลด์นี้
  rawBorrowReturn?: string | null;
}

const ReturnOf = () => {
  const [isLoading, setLoading] = useState(true);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemType[]>([]);
  const [returnList, setReturnList] = useState<number[]>([]); // เก็บรายการที่ต้องการคืน
  const [alert, setAlert] = useState({ show: false, message: '' });

  // ดึงข้อมูลอุปกรณ์ที่ถูกยืม และกรองเฉพาะรายการที่ยังไม่คืน
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      
      // ตรวจสอบข้อมูลดิบที่ได้จาก API ใน console
      console.log("API Response:", response.data);

      if (response.data?.data) {
        const borrowedData = response.data.data.flatMap((item: any) =>
          item.borrowequipment_list.map((eq: any) => {
            return {
              borrow_equipment_id: eq.borrow_equipment_id,
              equipment_name: eq.equipment?.equipment_name || "ไม่พบข้อมูล",
              equipment_code: eq.equipment?.equipment_code || "ไม่พบข้อมูล",
              startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
              endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
              // เก็บค่าวันที่คืนจริง หรือค่าที่บอกว่าคืนแล้วหรือยัง
              rawBorrowReturn: item.borrow_return,
            };
          })
        );

        // กรองเฉพาะรายการที่ยังไม่คืน (ถ้า borrow_return เป็น null หรือไม่มี แสดงว่ายังไม่คืน)
        // ถ้า API ของคุณใช้ฟิลด์อื่น เช่น is_returned = false, ให้ปรับเงื่อนไข filter ตามจริง
        const filteredData = borrowedData.filter((item: { rawBorrowReturn: any; }) => !item.rawBorrowReturn);

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

  // ฟังก์ชันลบอุปกรณ์ออกจาก UI (ถือว่าอุปกรณ์ถูกคืน)
  const removeItem = (index: number, id: number) => {
    setReturnList([...returnList, id]); // เก็บ ID ไว้สำหรับคืน
    setBorrowedItems(borrowedItems.filter((_, i) => i !== index));
  };

  // ฟังก์ชันบันทึกการคืนอุปกรณ์
  const handleReturnSubmit = async () => {
    if (returnList.length === 0) {
      setAlert({ show: true, message: 'กรุณาเลือกรายการที่ต้องการคืน' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${process.env.WEB_DOMAIN}/api/borrowequipment/return`, {
        returnList, // ส่งอุปกรณ์ที่ถูกคืนไปอัปเดตสถานะในฐานข้อมูล
      });

      setAlert({ show: true, message: 'คืนอุปกรณ์สำเร็จแล้ว' });
      setReturnList([]);
      fetchBorrowedItems(); // โหลดข้อมูลใหม่
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

          {/* ปุ่มบันทึกการคืนอุปกรณ์ */}
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
