import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Toast from 'react-bootstrap/Toast';

import styles from '@/styles/page.module.css';

interface ListItemType {
  listName: string;
  numberCard: string;
  startDate: string;
  endDate: string;
}

const ReturnOf = () => {
  const inputRef = useRef<HTMLFormElement>(null);

  // สร้าง state สำหรับ validation, alert, loading และข้อมูลรายการอุปกรณ์ที่ยืม
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(true); // เริ่มต้นเป็น true เพราะต้องโหลดข้อมูลก่อน
  const [listItem, setListItem] = useState<ListItemType[]>([]);

  // ฟังก์ชันดึงข้อมูลจาก API พร้อมการ debug ด้วย console.log
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true); // ตั้งค่าสถานะเป็น "กำลังโหลด"
      // เรียก API เพื่อดึงข้อมูลรายการยืม
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);

      // Debug: log entire API response
      console.log("API Response:", response.data);

      if (response.data && response.data.data) {
        // Debug: log the data array
        console.log("Response Data Array:", response.data.data);

        // แมปข้อมูลจาก API ให้ได้ชื่อรายการและหมายเลขอุปกรณ์จาก borrowequipment_list
        const borrowedData = response.data.data.map((item: any) => {
          // Debug: log each item เพื่อดูโครงสร้างของข้อมูล
          console.log("Item from API:", item);

          return {
            // เปลี่ยนจากใช้ borrow_name เป็นชื่อของอุปกรณ์ใน borrowequipment_list
            listName: item.borrowequipment_list
              ? item.borrowequipment_list.map((eq: any) => eq.equipment_name).join(", ")
              : "",
            // เปลี่ยนจากใช้ข้อมูลอื่น ให้ใช้หมายเลขอุปกรณ์จาก borrowequipment_list
            numberCard: item.borrowequipment_list
              ? item.borrowequipment_list.map((eq: any) => eq.borrow_equipment_number).join(", ")
              : "",
            // แปลงวันที่ให้เป็นรูปแบบ YYYY-MM-DD
            startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
            endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
          };
        });
        setListItem(borrowedData); // อัปเดต state ด้วยข้อมูลที่แมปแล้ว
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูลได้' });
    } finally {
      setLoading(false); // เมื่อโหลดข้อมูลเสร็จแล้ว ให้เปลี่ยนสถานะ loading เป็น false
    }
  };

  // ใช้ useEffect เพื่อดึงข้อมูลเมื่อ component โหลด
  useEffect(() => {
    fetchBorrowedItems();
  }, []);

  // ฟังก์ชันจัดการการส่งฟอร์ม (ยังอยู่ในช่วงพัฒนา)
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    setLoading(true);
    if (form.checkValidity() === false) {
      setAlert({ show: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      event.preventDefault();
      event.stopPropagation();
    } else {
      setAlert({ show: true, message: 'ระบบยังอยู่ในช่วงพัฒนา' });
      event.preventDefault();
      event.stopPropagation();
    }
    // เปลี่ยนสถานะ loading กลับเป็น false หลังจาก 2 วินาที
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    setValidated(true);
  };

  // ฟังก์ชันลบรายการออกจาก UI (เฉพาะการแสดงผล)
  const removeListener = (index: number) => {
    const newList = listItem.filter((_, i) => i !== index);
    setListItem(newList);
  };

  return (
    <Container>
      <div className={styles.main}>
        <h1 className="py-2">คืนอุปกรณ์ครุภัณฑ์</h1>
      </div>
      <div className="px-5">
        <Form noValidate validated={validated} onSubmit={(e) => handleSubmit(e)}>
          <Form.Group className="py-2">
            {/* แสดงข้อความกำลังโหลดหรือรายการข้อมูล */}
            {isLoading ? (
              <p>กำลังโหลดข้อมูล...</p>
            ) : listItem.length > 0 ? (
              // แสดงรายการอุปกรณ์ที่ถูกยืม โดยแต่ละรายการจะเป็น Toast
              listItem.map((item, index) => (
                <Toast key={index} onClose={() => removeListener(index)} className="mb-2">
                  <Toast.Header>
                    <strong className="me-auto">{item.listName}</strong>
                  </Toast.Header>
                  <Toast.Body>
                    <span style={{ color: 'red', fontWeight: 'bold' }}>{item.numberCard}</span>
                    <div className={styles.toastDate}>
                      <span>เริ่ม {item.startDate}</span>
                      <span>สิ้นสุด {item.endDate}</span>
                    </div>
                  </Toast.Body>
                </Toast>
              ))
            ) : (
              <p>ไม่มีข้อมูลอุปกรณ์ที่ถูกยืม</p>
            )}
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
};

export default ReturnOf;
