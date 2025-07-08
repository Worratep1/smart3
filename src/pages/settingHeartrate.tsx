'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'

// Components
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ButtonState from '@/components/Button/ButtonState'
import ModalAlert from '@/components/Modals/ModalAlert'
import RangeSlider from '@/components/RangeSlider/RangeSlider'

interface DataUserState {
  isLogin: boolean
  userData: any | null
  takecareData: any | null
}

const HeartRateSettings = () => {
  const router = useRouter()

  const [alert, setAlert] = useState({ show: false, message: '' })
  const [isLoading, setLoading] = useState(false)
  const [dataUser, setDataUser] = useState<DataUserState>({
    isLogin: false,
    userData: null,
    takecareData: null
  })
  const [idSetting, setIdSetting] = useState<number | null>(null)
  const [minBpm, setMinBpm] = useState<number | null>(50)
  const [maxBpm, setMaxBpm] = useState<number | null>(100)

  // เมื่อ query `auToken` เปลี่ยน จะดึงข้อมูลใหม่
  useEffect(() => {
    const auToken = router.query.auToken
    if (auToken) {
      fetchUserData(auToken as string)
    }
  }, [router.query.auToken])

  // ดึงข้อมูลผู้ใช้
  const fetchUserData = async (auToken: string) => {
    console.log('📥 เริ่ม fetchUserData ด้วย auToken:', auToken)
    try {
      const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`)
      console.log('✅ responseUser:', responseUser.data)

      if (responseUser.data?.data) {
        const usersId = responseUser.data.data.users_id

        // ดึงข้อมูลผู้ที่ดูแล (จาก users_id)
        const responseTakecare = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUserTakecareperson/${usersId}`)
        const takecareData = responseTakecare.data?.data

        if (takecareData) {
          setDataUser({
            isLogin: true,
            userData: responseUser.data.data,
            takecareData: takecareData
          })

          const settingIdParam = router.query.idsetting
          if (settingIdParam && Number(settingIdParam) > 0) {
            fetchHeartRateSetting(Number(settingIdParam))
          }
        } else {
          showAlert('ไม่พบข้อมูลผู้ดูแล')
        }
      } else {
        showAlert('ไม่พบข้อมูลผู้ใช้')
      }
    } catch (error) {
      console.error('❌ error fetching user:', error)
      showAlert('ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง')
    }
  }

  // ดึงข้อมูล setting heart rate
  const fetchHeartRateSetting = async (settingId: number) => {
    try {
      const res = await axios.get(`${process.env.WEB_DOMAIN}/api/setting/getHeartrate?setting_id=${settingId}`)
      if (res.data?.data) {
        const data = res.data.data
        setMinBpm(Number(data.min_bpm))
        setMaxBpm(Number(data.max_bpm))
        setIdSetting(settingId)
      }
    } catch (error) {
      showAlert('ไม่พบข้อมูลการตั้งค่า')
    }
  }

  const showAlert = (message: string) => {
    setAlert({ show: true, message })
  }

  const handleSave = async () => {
    if (!dataUser.takecareData || !dataUser.userData) {
      showAlert('ไม่พบข้อมูลผู้ดูแลหรือผู้สูงอายุ')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        takecare_id: dataUser.takecareData.takecare_id,
        users_id: dataUser.userData.users_id,
        min_bpm: minBpm,
        max_bpm: maxBpm,
      }

      if (idSetting) {
        payload.setting_id = idSetting
      }

      const res = await axios.post(`${process.env.WEB_DOMAIN}/api/setting/saveHeartrate`, payload)

      if (res.data?.data?.id || res.data?.id) {
        const newId = res.data.data?.id || res.data.id
        setIdSetting(newId)
        router.push(`/settingHeartrate?auToken=${router.query.auToken}&idsetting=${newId}`)
      }

      showAlert('บันทึกข้อมูลสำเร็จ')
    } catch (error) {
      showAlert('ไม่สามารถบันทึกข้อมูลได้')
    }
    setLoading(false)
  }

  // UI
  return (
    <>
      {!dataUser.isLogin ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Spinner animation="border" />
        </div>
      ) : (
        <Container className="py-3">
          <Row>
            <Col>
              <h3>ตั้งค่าการแจ้งเตือนอัตราการเต้นของหัวใจ</h3>
              <p>ค่าปกติ: 60-100 BPM (คุณสามารถปรับค่าได้ตามต้องการ)</p>
            </Col>
          </Row>

          <Row className="py-2">
            <Col>
              <p>ค่าต่ำสุด: <strong>{minBpm} BPM</strong></p>
              <RangeSlider
                min={30}
                max={90}
                step={1}
                value={minBpm}
                onChange={(value) => setMinBpm(value)}
              />
            </Col>
          </Row>

          <Row className="py-2">
            <Col>
              <p>ค่าสูงสุด: <strong>{maxBpm} BPM</strong></p>
              <RangeSlider
                min={30}
                max={90}
                step={1}
                value={maxBpm}
                onChange={(value) => setMaxBpm(value)}
              />
            </Col>
          </Row>

          <Row className="py-3">
            <Col>
              <ButtonState
                text="บันทึก"
                isLoading={isLoading}
                onClick={handleSave}
                className="btn-primary"
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

export default HeartRateSettings
