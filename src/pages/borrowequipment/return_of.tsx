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

  // สถานะสำหรับ validation, alert, loading และข้อมูลรายการอุปกรณ์ที่ยืม
  const [validated, setValidated] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [isLoading, setLoading] = useState(true); // กำหนดให้เริ่มต้นเป็น true เพราะต้องโหลดข้อมูลก่อน
  const [listItem, setListItem] = useState<ListItemType[]>([]);

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchBorrowedItems = async () => {
    try {
      setLoading(true); // ตั้งค่าสถานะเป็น "กำลังโหลด"
      const response = await axios.get(`${process.env.WEB_DOMAIN}/api/borrowequipment/list`);
      if (response.data && response.data.data) {
        // ทำการแมปข้อมูลที่ได้รับจาก API
        // การเปลี่ยนแปลงหลัก: ใช้ข้อมูลจาก borrowequipment_list เพื่อดึงชื่ออุปกรณ์และหมายเลขอุปกรณ์
        const borrowedData = response.data.data.map((item: any) => ({
          // listName จะเก็บชื่ออุปกรณ์จาก borrowequipment_list แทนที่จะเป็นชื่อของผู้สูงอายุ
          listName: item.borrowequipment_list
            .map((eq: any) => eq.equipment_name) // ดึง field equipment_name ของแต่ละอุปกรณ์
            .join(", "),
          // numberCard จะเก็บหมายเลขอุปกรณ์จาก borrowequipment_list
          numberCard: item.borrowequipment_list
            .map((eq: any) => eq.borrow_equipment_number) // ดึง field borrow_equipment_number ของแต่ละอุปกรณ์
            .join(", "),
          // แปลงวันที่ให้เป็นรูปแบบ YYYY-MM-DD
          startDate: item.borrow_date ? new Date(item.borrow_date).toISOString().split('T')[0] : "",
          endDate: item.borrow_return ? new Date(item.borrow_return).toISOString().split('T')[0] : "",
        }));
        setListItem(borrowedData); // อัปเดต state ด้วยข้อมูลที่แมปแล้ว
      }
    } catch (error) {
      console.error('Error fetching borrowed equipment:', error);
      setAlert({ show: true, message: 'ไม่สามารถดึงข้อมูลได้' });
    } finally {
      setLoading(false); // เมื่อโหลดข้อมูลเสร็จแล้วให้เปลี่ยนสถานะ loading เป็น false
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
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    setValidated(true);
  };

  // ฟังก์ชันลบรายการ (เฉพาะใน UI)
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
            {/* แสดงสถานะกำลังโหลด */}
            {isLoading ? (
              <p></p>
            ) : listItem.length > 0 ? (
              // แสดงรายการอุปกรณ์ที่ถูกยืม
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
