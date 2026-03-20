// 1. เช็คก่อนว่ามีสิทธิ์เข้าหน้านี้ไหม ล็อกอินมารึยัง? (Authentication & Data Check)
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

// ตรวจสอบว่ามีทั้ง Token และข้อมูล User ไหม
if (!token || !userStr) {
    alert('กรุณาเข้าสู่ระบบก่อนครับ!');
    window.location.href = 'index.html'; 
} else {
    // 2. แสดงชื่อผู้ใช้บน Navbar แบบปลอดภัย
    const user = JSON.parse(userStr);
    const displayElement = document.getElementById('userNameDisplay');

    // เช็คก่อนว่าใน HTML หน้านั้นมี ID นี้จริงไหม เพื่อป้องกัน Error
    if (displayElement) {
        displayElement.innerText = `ยินดีต้อนรับ, คุณ ${user.firstname}`;
    }
}

// 3. ฟังก์ชันดึงข้อมูลห้องประชุมจาก Backend
async function fetchRooms() {
    try {
        const response = await fetch('http://localhost:8000/api/rooms');
        const rooms = await response.json();
        
        const container = document.getElementById('roomsContainer');
        container.innerHTML = '';

        rooms.forEach(room => {
            // 🌟 ตั้งค่าปุ่มและสีตามสถานะ (ว่าง / ไม่ว่าง / ปรับปรุง)
            let btnText = 'จองห้องนี้';
            let btnDisabled = '';
            let btnStyle = 'background: linear-gradient(135deg, #85431E, #D39858); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s;';
            let statusLabel = 'ว่าง';
            let statusColor = '#D39858';

            if (room.status === 'occupied') {
                btnText = 'ไม่ว่าง/เต็ม';
                btnDisabled = 'disabled';
                btnStyle = 'background-color: rgba(52, 21, 15, 0.6); color: rgba(234, 206, 170, 0.5); border: 1px solid rgba(234, 206, 170, 0.1); padding: 10px 20px; border-radius: 8px; cursor: not-allowed;';
                statusLabel = 'ไม่ว่าง';
                statusColor = '#85431E';
            } else if (room.status === 'maintenance') {
                btnText = 'ปิดปรับปรุง';
                btnDisabled = 'disabled';
                btnStyle = 'background-color: #150C0C; color: #85431E; border: 1px solid #85431E; padding: 10px 20px; border-radius: 8px; cursor: not-allowed;';
                statusLabel = 'ปิดปรับปรุง';
                statusColor = '#85431E';
            }

            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-image" style="background-color: #150C0C; height: 200px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    ${room.image_url 
                        ? `<img src="http://localhost:8000${room.image_url}" style="width:100%; height:100%; object-fit:cover;">` 
                        : `<span style="color: #EACEAA; opacity: 0.3;">ไม่มีรูปภาพ</span>`}
                </div>
                <div class="room-info" style="padding: 20px;">
                    <h3 style="color: #EACEAA; margin-bottom: 10px;">${room.name}</h3>

                    <p style="color: #EACEAA; opacity: 0.7; font-size: 0.9rem; margin-bottom: 15px;">
                    ${room.description || 'ไม่มีคำอธิบาย'}</p>
                    
                    <div class="room-meta" style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 0.85rem;">
                        <span>👥 ความจุ: ${room.capacity} คน</span>
                        <span style="color: ${statusColor}; font-weight: 600;">● ${statusLabel}</span>
                    </div>
                    <button class="btn-book" 
                            onclick="bookRoom(${room.id})" 
                            ${btnDisabled} 
                            style="${btnStyle}">
                        ${btnText}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
    }
}

// 4. ฟังก์ชันออกจากระบบ
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// 5. โหลดข้อมูลทันทีที่เปิดหน้านี้
fetchRooms();

// ================= ฟังก์ชันจัดการป๊อปอัปจองห้อง =================

// 1. เปิด Modal ป๊อปอัป
function bookRoom(roomId) {
    document.getElementById('bookRoomId').value = roomId; // แอบยัด ID ห้องเตรียมไว้
    document.getElementById('bookingModal').style.display = 'flex'; // โชว์ป๊อปอัป
}

// 2. ปิด Modal ป๊อปอัป
function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('bookingForm').reset(); // เคลียร์ฟอร์ม
}

// 3. จัดการตอนกดยืนยันการจอง
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 🌟 1. ดึงค่าต่างๆ ออกมาจากฟอร์มบนหน้าจอให้ครบก่อน
    const room_id = document.getElementById('bookRoomId').value; 
    const start_time = document.getElementById('startTime').value; // <-- เช็คด้วยว่า id ใน HTML ของคุณชื่อนี้ไหม
    const end_time = document.getElementById('endTime').value;     // <-- เช็คด้วยว่า id ใน HTML ของคุณชื่อนี้ไหม
    const token = localStorage.getItem('token');

    // ตรวจสอบว่ามีข้อมูลครบไหม
    if (!room_id || !start_time || !end_time) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ room_id, start_time, end_time }) // 🌟 ตอนนี้ room_id มีค่าแล้ว!
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ ' + data.message + '\nรอรับอีเมลยืนยันได้เลยครับ!');
            closeModal();
            fetchRooms(); // รีเฟรชหน้าจอทันที
        } else {
            alert('❌ จองไม่สำเร็จ: ' + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});