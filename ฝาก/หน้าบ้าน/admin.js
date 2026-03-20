// 1. ตรวจสอบสิทธิ์ (ต้องเป็น Admin เท่านั้นถึงเข้าหน้านี้ได้)
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') {
    alert('🛑 คุณไม่มีสิทธิ์เข้าถึงหน้านี้ครับ!');
    window.location.href = 'index.html';
}

// 2. โหลดข้อมูลห้องมาแสดงในตาราง
async function loadAdminRooms() {
    try {
        const response = await fetch('http://localhost:8000/api/rooms');
        const rooms = await response.json();
        const tbody = document.getElementById('adminRoomsTable');
        tbody.innerHTML = '';

        rooms.forEach(room => {
            const defaultImg = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
            const imageUrl = room.image_url ? `http://localhost:8000${room.image_url}` : defaultImg;

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(234, 206, 170, 0.1)';

            // ✅ แก้ไขโครงสร้าง HTML ให้สะอาดและไม่มีคอมเมนต์แทรก
            tr.innerHTML = `
                <td style="padding: 15px;"><img src="${imageUrl}" alt="room" style="width: 80px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                <td style="padding: 15px; font-weight: 500;">${room.name}</td>
                <td style="padding: 15px;">👥 ${room.capacity} คน</td>
                <td style="padding: 15px;">
                    <button onclick="openEditRoomModal(${room.id}, '${room.name}', '${room.description || ''}', ${room.capacity})" class="btn-primary-small">แก้ไข</button>
                    <select onchange="updateRoomStatus(${room.id}, this.value)">
                        <option value="available" ${room.status === 'available' ? 'selected' : ''}>🟢 ว่าง</option>
                        <option value="occupied" ${room.status === 'occupied' ? 'selected' : ''}>⚪ ไม่ว่าง</option>
                        <option value="maintenance" ${room.status === 'maintenance' ? 'selected' : ''}>🔴 ปิดปรับปรุง</option>
                    </select>
                    <button onclick="deleteRoom(${room.id})" class="btn-danger-small">ลบ</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// 🌟 ฟังก์ชันใหม่: ส่งค่าไป Update สถานะที่ Backend
async function updateRoomStatus(id, newStatus) {
    try {
        const response = await fetch(`http://localhost:8000/api/rooms/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            // ไม่ต้องแจ้ง alert ก็ได้ครับ ให้มันเปลี่ยนสีไปเลยจะดูหรูกว่า
            loadAdminRooms(); // โหลดตารางใหม่เพื่ออัปเดตสี
        } else {
            alert('❌ ไม่สามารถเปลี่ยนสถานะได้');
        }
    } catch (error) {
        console.error('Update status error:', error);
    }
}

// 3. ฟังก์ชันเปิด/ปิด ป๊อปอัปเพิ่มห้อง
function openAddRoomModal() { document.getElementById('addRoomModal').style.display = 'flex'; }
function closeAddRoomModal() {
    document.getElementById('addRoomModal').style.display = 'none';
    document.getElementById('addRoomForm').reset();
}

// 4. จัดการฟอร์มเพิ่มห้อง
document.getElementById('addRoomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('roomName').value);
    formData.append('description', document.getElementById('roomDesc').value);
    formData.append('capacity', document.getElementById('roomCapacity').value);

    const imageFile = document.getElementById('roomImage').files[0];
    if (imageFile) formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:8000/api/rooms', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            alert('✅ เพิ่มห้องประชุมสำเร็จ!');
            closeAddRoomModal();
            loadAdminRooms();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// 5. ฟังก์ชันลบห้อง
async function deleteRoom(id) {
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบห้องนี้?')) return;
    try {
        const response = await fetch(`http://localhost:8000/api/rooms/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            loadAdminRooms();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// 6. ออกจากระบบ
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// =========================================================
// 🌟 7. [เพิ่มใหม่] โหลดข้อมูลการจองทั้งหมดมาแสดงให้ Admin ดู
// =========================================================
async function loadAdminBookings() {
    try {
        const response = await fetch('http://localhost:8000/api/admin/bookings', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` } // แอดมินต้องยื่นบัตร
        });

        if (!response.ok) return;

        const bookings = await response.json();
        const tbody = document.getElementById('adminBookingsTable');
        tbody.innerHTML = '';

        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #EACEAA; opacity: 0.5;">ยังไม่มีประวัติการจองในระบบ</td></tr>';
            return;
        }

        bookings.forEach(booking => {
            // แปลงเวลาให้อ่านง่าย
            const start = new Date(booking.start_time).toLocaleString('th-TH');
            const end = new Date(booking.end_time).toLocaleString('th-TH');

            // เช็คสีสถานะ
            let statusText = booking.status === 'cancelled' 
            ? '<span style="color: #85431E; font-weight:bold;">🔴 ยกเลิกแล้ว</span>' 
            : '<span style="color: #D39858; font-weight:bold;">✅ สำเร็จ</span>';

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(234, 206, 170, 0.1)';
            tr.innerHTML = `
                <td style="padding: 15px; font-weight: bold; color: #D39858;">#${booking.id}</td>
                <td style="padding: 15px;">
                    <div style="font-weight: 600; color: #FFF;">คุณ ${booking.firstname} ${booking.lastname}</div>
                    <div style="font-size: 0.85rem; color: #EACEAA; opacity: 0.8;">📧 ${booking.email}</div>
                </td>
                <td style="padding: 15px; font-weight: bold; color: #EACEAA;">${booking.room_name}</td>
                <td style="padding: 15px; font-size: 0.9rem; color: #FFF;">
                    <div><strong>เริ่ม:</strong> ${start}</div>
                    <div><strong>จบ:</strong> ${end}</div>
                </td>
                <td style="padding: 15px;">${statusText}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
    }
}

// =========================================================
// 🌟 8. [ฟังก์ชันสำหรับแก้ไขห้องประชุม] เพิ่มต่อท้ายไฟล์
// =========================================================

// ฟังก์ชันเปิด Modal แก้ไข (ดึงข้อมูลจากตารางมาใส่ช่องกรอก)
function openEditRoomModal(id, name, desc, capacity) {
    document.getElementById('editRoomId').value = id;
    document.getElementById('editRoomName').value = name;
    document.getElementById('editRoomDesc').value = desc === 'null' ? '' : desc; // จัดการถ้าค่าเป็น null
    document.getElementById('editRoomCapacity').value = capacity;
    document.getElementById('editRoomModal').style.display = 'flex';
}

// ฟังก์ชันปิด Modal แก้ไข
function closeEditRoomModal() {
    document.getElementById('editRoomModal').style.display = 'none';
}

// ฟังก์ชันบันทึกการแก้ไข (ส่งไปที่ API)
const editRoomForm = document.getElementById('editRoomForm');
if (editRoomForm) {
    editRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editRoomId').value;
        
        // 1. เปลี่ยนมาใช้ FormData แทน JSON เพื่อให้แนบไฟล์รูปได้
        const formData = new FormData();
        formData.append('name', document.getElementById('editRoomName').value);
        formData.append('description', document.getElementById('editRoomDesc').value);
        formData.append('capacity', document.getElementById('editRoomCapacity').value);

        // 2. เช็คว่าแอดมินได้เลือกรูปใหม่มาด้วยหรือไม่ ถ้ามีก็แนบไปด้วย
        const imageFile = document.getElementById('editRoomImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const response = await fetch(`http://localhost:8000/api/rooms/${id}`, {
                method: 'PUT', 
                headers: {
                    // 3. ⚠️ เอา 'Content-Type': 'application/json' ออกไปเลยครับ Browser จะจัดการให้เอง
                    'Authorization': `Bearer ${token}`
                },
                body: formData // 4. ส่ง formData ไปตรงๆ
            });

            if (response.ok) {
                alert('✅ แก้ไขข้อมูลห้องสำเร็จ!');
                closeEditRoomModal();
                document.getElementById('editRoomForm').reset(); // เคลียร์ฟอร์มเผื่อการเปิดครั้งต่อไป
                loadAdminRooms(); // โหลดรายการห้องใหม่ให้แสดงผลปัจจุบัน
            } else {
                alert('❌ ไม่สามารถแก้ไขข้อมูลได้');
            }
        } catch (error) {
            console.error('Update Error:', error);
        }
    });
}

// 🌟 สั่งให้โหลดข้อมูลทั้ง 2 ตารางทันทีที่เปิดหน้าเว็บขึ้นมา
loadAdminRooms();
loadAdminBookings(); // <-- เพิ่มเรียกฟังก์ชันนี้