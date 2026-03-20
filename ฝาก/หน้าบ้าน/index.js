// จับเหตุการณ์ตอนกดปุ่ม Submit ฟอร์มล็อกอิน
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรช

    // ดึงค่าจากช่องอีเมลและรหัสผ่าน
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // ยิงข้อมูลไปที่ API เส้น Login ของ Backend เรา
        const response = await fetch('http://localhost:8000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }) // แปลงข้อมูลเป็น JSON
        });

        const data = await response.json();

        // เช็คว่า Status กลับมาเป็น 200 OK ไหม
        if (response.ok) {
            // โชว์ Alert แค่อันเดียว สรุปข้อมูลครบๆ
            alert(data.message + '\nยินดีต้อนรับคุณ: ' + data.user.firstname);
            
            // เก็บข้อมูลที่จำเป็นลง localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.user.role); 
            localStorage.setItem('user', JSON.stringify(data.user));
            
            console.log('ข้อมูลล็อกอิน:', data);


            // 🌟 เครื่องแยกคน: ถ้าเป็นแอดมิน ไปหน้า admin ถ้าเป็นคนทั่วไป ไปหน้า rooms
            if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'rooms.html';
            }
            
        } else {
            // ถ้าอีเมลหรือรหัสผ่านผิด (Status 401)
            alert('❌ ' + data.message);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (ลืมเปิด Backend รึเปล่า?)');
    }
});