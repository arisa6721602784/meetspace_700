// 1. เช็คสิทธิ์การเข้าถึง (Authentication & Data Check)
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

// 2. ฟังก์ชันดึงประวัติการจอง
async function fetchMyBookings() {
    try {
        const response = await fetch('http://localhost:8000/api/my-bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const bookings = await response.json();
        const container = document.getElementById('bookingsContainer');
        container.innerHTML = '';

        if (bookings.length === 0) {
            container.innerHTML = '<p style="color: #EACEAA; text-align: center; grid-column: 1 / -1; opacity: 0.7;">คุณยังไม่มีประวัติการจองห้องประชุม</p>';
            return;
        }

        // วนลูปแสดงการ์ดประวัติการจอง
        bookings.forEach(booking => {
            const start = new Date(booking.start_time).toLocaleString('th-TH');
            const end = new Date(booking.end_time).toLocaleString('th-TH');

            // 🌟 [เพิ่มใหม่] เช็คสถานะเพื่อเปลี่ยนข้อความ, สี และซ่อน/โชว์ปุ่มยกเลิก
            let statusText = '✅ สำเร็จ';
            let statusColor = '#D39858';
            let cancelBtnHtml = ''; // ค่าเริ่มต้นไม่มีปุ่มยกเลิก

            if (booking.status === 'cancelled') {
                statusText = '🔴 ยกเลิกแล้ว';
                statusColor = '#85431E';
            } else {
                // ถ้ายังไม่โดนยกเลิก ถึงจะโชว์ปุ่มยกเลิก
                cancelBtnHtml = `
                    <button onclick="cancelBooking(${booking.id})" class="btn-outline" 
                            style="margin-top: 15px; width: 100%; border-color: #85431E; color: #85431E;">
                        ยกเลิกการจอง
                    </button>
                `;
            }

            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-info" style="padding-top: 30px;">
                    <h3>ห้อง: ${booking.room_name || 'ห้อง ID ' + booking.room_id}</h3>
                    
                    <p style="color: ${statusColor}; margin-top: 15px; font-weight: bold; font-size: 0.95rem;">สถานะ: ${statusText}</p>
                    
                    <div style="background: rgba(21, 12, 12, 0.5); padding: 15px; border-radius: 12px; margin-top: 15px; border: 1px solid rgba(211, 152, 88, 0.1);">
                        <p style="margin-bottom: 5px; color: #FFF; font-size: 0.9rem;">🟢 <strong>เริ่ม:</strong> ${start}</p>
                        <p style="margin-bottom: 0; color: #FFF; font-size: 0.9rem;">🔴 <strong>สิ้นสุด:</strong> ${end}</p>
                    </div>

                    ${cancelBtnHtml}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('bookingsContainer').innerHTML = '<p style="color: #85431E; text-align: center; grid-column: 1 / -1;">โหลดข้อมูลล้มเหลว กรุณาตรวจสอบ Backend</p>';
    }
}

// 🌟 3. [เพิ่มฟังก์ชันใหม่] จัดการการยกเลิกการจอง
async function cancelBooking(bookingId) {
    // ถามเพื่อความชัวร์ก่อนลบ
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?')) return;

    try {
        const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // ยื่นบัตรยืนยันตัวตน
            }
        });

        if (response.ok) {
            alert('✅ ยกเลิกการจองเรียบร้อยแล้ว');
            fetchMyBookings(); // โหลดหน้าจอใหม่ เพื่อให้การ์ดเปลี่ยนสถานะเป็น "ยกเลิกแล้ว" ทันที
        } else {
            const data = await response.json();
            alert('❌ ไม่สามารถยกเลิกได้: ' + (data.message || 'เกิดข้อผิดพลาด'));
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
}

// 4. ฟังก์ชันออกจากระบบ
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// โหลดข้อมูลทันทีที่เปิดหน้านี้
fetchMyBookings();