/**
 * PHẦN 1: CẤU HÌNH GIẢI THƯỞNG & BIẾN KHỞI TẠO
 */
const prizes = [
    { name: "Giải Khuyến Khích", count: 5 },
    { name: "Giải Ba", count: 1 },
    { name: "Giải Nhì", count: 1 },
    { name: "Giải Nhất", count: 1 },
    { name: "Giải Đặc Biệt", count: 1 }
];

let pIdx = 0;        // Chỉ số giải thưởng hiện tại (đang quay giải nào)
let cCount = 0;      // Đếm số lượt đã quay của giải thưởng hiện tại
let winners = [];    // Mảng lưu trữ danh sách những số trúng thưởng
let used = new Set(); // Bộ dữ liệu lưu các số đã ra để không bị trùng lặp

// Lấy các element từ HTML
const spinBtn = document.getElementById('spin-btn');
const sndSpin = document.getElementById('snd-spin'); // Nhạc quay xổ số
const sndStop = document.getElementById('snd-stop'); // Tiếng dừng số
const sndFire = document.getElementById('snd-fire'); // Tiếng pháo hoa

/**
 * PHẦN 2: KHỞI TẠO DẢI SỐ (INIT STRIPS)
 * Tạo ra một dải số dài (50 số) cho mỗi ô để khi quay có cảm giác chạy liên tục.
 */
function initStrips() {
    for(let i=1; i<=4; i++) {
        const s = document.getElementById(`s${i}`);
        s.innerHTML = "";
        for(let j=0; j<50; j++) {
            const span = document.createElement('span');
            span.innerText = j % 10; // Các số từ 0-9 lặp lại
            s.appendChild(span);
        }
    }
}
initStrips();

/**
 * PHẦN 3: LOGIC PHÁO HOA (FIREWORKS)
 * Sử dụng Canvas API để vẽ và tạo hoạt ảnh pháo nổ.
 */
const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
let parts = []; // Chứa các hạt (particles) của pháo hoa

// Hàm tạo một bông pháo mới
function createFirework() {
    sndFire.currentTime = 0; 
    sndFire.play();
    const x = Math.random() * window.innerWidth; // Tọa độ ngang ngẫu nhiên
    const y = window.innerHeight / 3;            // Độ cao nổ pháo
    for(let i=0; i<80; i++) {
        parts.push({
            x, y, 
            vx:(Math.random()-0.5)*15, // Tốc độ bay ngang
            vy:(Math.random()-0.5)*15, // Tốc độ bay dọc
            a:1,                        // Độ trong suốt (alpha)
            c:`hsl(${Math.random()*360},100%,50%)` // Màu sắc ngẫu nhiên
        });
    }
}

// Hàm vẽ pháo hoa liên tục (vòng lặp hoạt họa)
function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    parts.forEach((p,i) => {
        p.x += p.vx; p.y += p.vy; p.a -= 0.015; // Hạt bay ra và mờ dần
        ctx.globalAlpha = p.a; 
        ctx.fillStyle = p.c;
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 4, 0, 7); 
        ctx.fill();
        if(p.a <= 0) parts.splice(i,1); // Xóa hạt khi đã mờ hẳn
    });
    requestAnimationFrame(draw); // Gọi lại hàm vẽ ở khung hình tiếp theo
}
draw();

/**
 * PHẦN 4: LOGIC QUAY TỪNG CHỮ SỐ (ROLL DIGIT)
 * @param {string} id - ID của ô số (s1, s2...)
 * @param {string} val - Giá trị số đích cần dừng lại (0-9)
 */
async function rollDigit(id, val) {
    const s = document.getElementById(id);
    const sWindow = s.parentElement; // Lấy thẻ digit-window bao quanh
    
    s.classList.add('motion-blur');
    const targetPos = -((40 + parseInt(val)) * 180); 
    s.style.transform = `translateY(${targetPos}px)`;
    
    return new Promise(resolve => {
        setTimeout(() => {
            s.classList.remove('motion-blur');
            sWindow.classList.add('active'); // BẬT ĐÈN VIỀN KHI DỪNG
            sndStop.currentTime = 0; 
            sndStop.play();
            resolve();
        }, 2000);
    });
}

/**
 * PHẦN 5: XỬ LÝ SỰ KIỆN CLICK QUAY SỐ
 */
spinBtn.onclick = async () => {
    spinBtn.disabled = true;
    for(let i=1; i<=4; i++) {
        const sWindow = document.getElementById(`s${i}`).parentElement; 
        sWindow.classList.remove('active'); // Tắt đèn khi bắt đầu quay mới
        
        const s = document.getElementById(`s${i}`);
        s.style.transition = "none";
        s.style.transform = "translateY(0)";
    }
    // ... các code còn lại giữ nguyên ...
    
    // Đợi một chút để trình duyệt cập nhật vị trí reset
    await new Promise(r => setTimeout(r, 50));
    
    // Bước 2: Thiết lập lại hiệu ứng mượt và bắt đầu quay
    for(let i=1; i<=4; i++) {
        document.getElementById(`s${i}`).style.transition = "transform 2s cubic-bezier(0.1, 0, 0.1, 1)";
    }

    sndSpin.play(); // Bật nhạc xổ số kiến thiết
    
    // Bước 3: Tạo số ngẫu nhiên 4 chữ số (0001 - 9999) và kiểm tra trùng
    let randomNum;
    do { 
        randomNum = Math.floor(Math.random() * 1999) + 1; 
    } while(used.has(randomNum));
    
    used.add(randomNum);
    let finalStr = randomNum.toString().padStart(4, '0'); // Chuyển số thành chuỗi "000x"

    // Bước 4: Chạy hiệu ứng quay cho từng ô số (tuần tự từng ô một)
    for(let i=0; i<4; i++) {
        await rollDigit(`s${i+1}`, finalStr[i]);
    }

    // Bước 5: Kết thúc lượt quay
    sndSpin.pause(); // Dừng nhạc quay
    sndSpin.currentTime = 0;
    createFirework(); // Bắn pháo hoa chúc mừng

    // Lưu kết quả vào danh sách
    winners.push({ prize: prizes[pIdx].name, num: finalStr });
    cCount++;

    // Kiểm tra xem đã quay đủ số lượng của giải hiện tại chưa
    if(cCount >= prizes[pIdx].count) { 
        cCount = 0; 
        pIdx++; // Chuyển sang giải tiếp theo (Khuyến khích -> Ba -> Nhì...)
    }

    // Cập nhật giao diện hiển thị tên giải và tiến độ
    if(pIdx < prizes.length) {
        document.getElementById('prize-name').innerText = prizes[pIdx].name;
        document.getElementById('count-info').innerText = `Lượt quay: ${cCount}/${prizes[pIdx].count}`;
    } else {
        document.getElementById('prize-name').innerText = "HẾT LƯỢT QUAY";
    }
    
    // Chỉ mở lại nút bấm nếu vẫn còn giải thưởng để quay
    spinBtn.disabled = (pIdx >= prizes.length);
};

/**
 * PHẦN 6: QUẢN LÝ BẢNG KẾT QUẢ (MODAL)
 */
// Mở bảng danh sách trúng thưởng
document.getElementById('res-btn').onclick = () => {
    const list = document.getElementById('result-list');
    list.innerHTML = ""; // Xóa danh sách cũ trước khi nạp mới
    
    prizes.forEach(p => {
        // Lọc ra các số trúng theo từng loại giải
        const items = winners.filter(w => w.prize === p.name);
        if(items.length > 0) {
            list.innerHTML += `<div style="color:var(--gold); font-size:1.5rem; margin-top:20px; font-family:'Quicksand'">${p.name}</div>`;
            items.forEach(i => {
                list.innerHTML += `<div class="res-item">${i.num}</div>`;
            });
        }
    });
    document.getElementById('result-page').style.display = 'flex';
};

// Đóng bảng danh sách
document.getElementById('close-res-btn').onclick = () => {
    document.getElementById('result-page').style.display = 'none';
};