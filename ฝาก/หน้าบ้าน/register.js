document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstname = document.getElementById('firstname').value.trim();
    const lastname = document.getElementById('lastname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // 1. เช็คความยาวรหัสผ่านซ้ำอีกครั้งที่นี่
    if (password.length < 6) {
        alert('⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
    submitBtn.textContent = 'กำลังสร้างบัญชีของคุณ...';

    try {
        const response = await fetch('http://localhost:8000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstname, lastname, email, password })
        });

        // 2. เช็คว่า Response มีข้อมูลไหม
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            alert('✅ ' + (data.message || 'สมัครสมาชิกสำเร็จ!'));
            window.location.href = 'index.html'; 
        } else {
            alert('❌ พบปัญหา: ' + (data.message || 'ไม่สามารถสมัครสมาชิกได้ในขณะนี้'));
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = 'ยืนยันการสมัคร';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเปิด Backend อยู่หรือไม่');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.textContent = 'ยืนยันการสมัคร';
    }
});