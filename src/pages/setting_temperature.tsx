'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonState from '@/components/Button/ButtonState'
import ModalAlert from '@/components/Modals/ModalAlert'
import RangeSlider from '@/components/RangeSlider/RangeSlider'
import { encrypt } from '@/utils/helpers'

interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

const TemperatureSetting = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(false)
  const [dataUser, setDataUser] = useState<DataUserState>({
    isLogin: false,
    userData: null,
    takecareData: null,
  })
  const [idSetting, setIdSetting] = useState<number | null>(null)
  const [maxTemperature, setMaxTemperature] = useState<number>(37)

  // โหลดข้อมูลเมื่อ query พร้อม
  useEffect(() => {
    const auToken = router.query.auToken
    const idSettingParam = router.query.idsetting

    if (auToken) {
      fetchUserData(auToken as string)

      if (idSettingParam && Number(idSettingParam) > 0) {
        fetchTemperatureSetting(Number(idSettingParam))
      }
    }
  }, [router.query.auToken, router.query.idsetting])

  const fetchUserData = async (auToken: string) => {
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      if (responseUser.data?.data) {
        const encodedUsersId = encrypt(responseUser.data.data.users_id.toString())
        const responseTakecare = await axios.get(
          `${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${encodedUsersId}`
        )
        const takecareData = responseTakecare.data?.data
        if (takecareData) {
          setDataUser({ isLogin: true, userData: responseUser.data.data, takecareData })
        } else {
          showAlert('ไม่พบข้อมูลผู้ดูแล')
        }
      } else {
        showAlert('ไม่พบข้อมูลผู้ใช้')
      }
    } catch (error) {
      console.error('fetchUserData error:', error)
      showAlert('ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  const fetchTemperatureSetting = async (settingId: number) => {
    try {
      const res = await axios.get(`${process.env.WEB_DOMAIN}/api/setting_temperature/getTemperature?setting_id=${settingId}`)
      if (res.data?.data) {
        const data = res.data.data
        setMaxTemperature(Number(data.max_temperature))
        setIdSetting(settingId)
        console.log('โหลดอุณหภูมิ:', data.max_temperature)
      }
    } catch (error) {
      console.error('fetchTemperatureSetting error:', error)
      showAlert('ไม่สามารถดึงข้อมูลการตั้งค่าได้')
    }
  }

  const showAlert = (message: string) => {
    setAlert({ show: true, message })
  }

  const handleSave = async () => {
    if (!dataUser.takecareData || !dataUser.userData) {
      showAlert('ไม่พบข้อมูลผู้ใช้งาน')
      return
    }

    if (isNaN(maxTemperature)) {
      showAlert('อุณหภูมิไม่ถูกต้อง')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        takecare_id: dataUser.takecareData.takecare_id,
        users_id: dataUser.userData.users_id,
        max_temperature: maxTemperature,
      }
      if (idSetting) {
        payload.setting_id = idSetting
      }

      console.log('📤 กำลังส่งข้อมูล:', payload)

      const res = await axios.post(`${process.env.WEB_DOMAIN}/api/setting_temperature/saveTemperature`, payload)

      console.log('✅ ตอบกลับจาก API:', res.data)

      if (res.data?.id) {
        setIdSetting(res.data.id)
        showAlert('บันทึกข้อมูลสำเร็จ')

        // ดึงข้อมูลใหม่เพื่อโชว์ค่าอัปเดต
        await fetchTemperatureSetting(res.data.id)
      } else {
        showAlert('ไม่สามารถบันทึกข้อมูลได้')
      }
    } catch (error) {
      console.error('❌ handleSave error:', error)
      showAlert('ไม่สามารถบันทึกข้อมูลได้')
    }

    setLoading(false)
  }

  return (
    <>
      {!dataUser.isLogin ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Container className="py-3">
          <Row>
            <Col>
              <h3>ตั้งค่าการแจ้งเตือนอุณหภูมิสูงสุด</h3>
              <p>ค่าปกติ: 37°C (คุณสามารถปรับค่าได้ตามต้องการ)</p>
            </Col>
          </Row>
          <Row className="py-3">
            <Col>
              <p>
                อุณหภูมิสูงสุดที่อนุญาต: <strong>{maxTemperature}°C</strong>
              </p>
              <RangeSlider
                min={30}
                max={45}
                step={0.1}
                value={maxTemperature}
                onChange={(value) => setMaxTemperature(Number(value))}
              />
            </Col>
          </Row>
          <Row className="py-3">
            <Col>
              <ButtonState
                text="บันทึก"
                isLoading={isLoading}
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!dataUser.isLogin}
              />
            </Col>
          </Row>
          <ModalAlert
            show={alert.show}
            message={alert.message}
            handleClose={() => setAlert({ show: false, message: '' })}
          />
        </Container>
      )}
    </>
  )
}

export default TemperatureSetting
