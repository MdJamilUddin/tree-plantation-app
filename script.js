// script.js
const STORAGE_KEY = 'treePlantationData_v1';

document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('schoolSelect');
  const form = document.getElementById('dataForm');
  const statusMsg = document.getElementById('statusMsg');

  // ড্রপডাউনে বিদ্যালয় লোড
  SCHOOLS.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = name;
    select.appendChild(opt);
  });

  // লোড বাটন
  document.getElementById('loadBtn').addEventListener('click', () => {
    const idx = parseInt(select.value, 10);
    const schoolName = SCHOOLS[idx];
    document.getElementById('schoolName').value = schoolName;
    form.style.display = 'block';

    const all = loadAll();
    const existing = all.find(r => r.schoolIndex === idx);

    if (existing) {
      fillForm(existing);
      statusMsg.textContent = '✔ এই বিদ্যালয়ের তথ্য আগে থেকেই সংরক্ষিত আছে (সম্পাদনা করুন)';
      statusMsg.style.color = '#ff8f00';
    } else {
      clearForm(schoolName);
      statusMsg.textContent = '';
    }

    document.getElementById('previewContainer').innerHTML = '';
    if (existing && existing.photo) {
      document.getElementById('previewContainer').innerHTML =
        `<img src="${existing.photo}" alt="ছবি">`;
    }
    updateProgress();
  });

  // ছবি প্রিভিউ
  document.getElementById('photo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('শুধুমাত্র ছবি আপলোড করুন');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      container.innerHTML = `<img src="${ev.target.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
  });

  // ফর্ম সাবমিট
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = parseInt(select.value, 10);
    const photoInput = document.getElementById('photo');
    const file = photoInput.files[0];

    const saveRecord = (photoData) => {
      const record = {
        schoolIndex: idx,
        schoolName: SCHOOLS[idx],
        district: document.getElementById('district').value.trim(),
        upazila: document.getElementById('upazila').value.trim(),
        union: document.getElementById('union').value.trim(),
        village: document.getElementById('village').value.trim(),
        fruitSpecies: document.getElementById('fruitSpecies').value.trim(),
        fruitCount: +document.getElementById('fruitCount').value || 0,
        timberSpecies: document.getElementById('timberSpecies').value.trim(),
        timberCount: +document.getElementById('timberCount').value || 0,
        medicinalSpecies: document.getElementById('medicinalSpecies').value.trim(),
        medicinalCount: +document.getElementById('medicinalCount').value || 0,
        plantingDate: document.getElementById('plantingDate').value,
        location: document.getElementById('location').value.trim(),
        studentName: document.getElementById('studentName').value.trim(),
        fatherName: document.getElementById('fatherName').value.trim(),
        motherName: document.getElementById('motherName').value.trim(),
        className: document.getElementById('className').value.trim(),
        studentAddress: document.getElementById('studentAddress').value.trim(),
        studentMobile: document.getElementById('studentMobile').value.trim(),
        headName: document.getElementById('headName').value.trim(),
        headMobile: document.getElementById('headMobile').value.trim(),
        remarks: document.getElementById('remarks').value.trim(),
        photo: photoData,
        updatedAt: new Date().toISOString()
      };

      const all = loadAll().filter(r => r.schoolIndex !== idx);
      all.push(record);
      all.sort((a, b) => a.schoolIndex - b.schoolIndex);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch (err) {
        alert('ছবির আকার বেশি বড়। অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।');
        console.error(err);
        return;
      }

      statusMsg.textContent = `✔ ${SCHOOLS[idx]} এর তথ্য সফলভাবে সংরক্ষিত হয়েছে`;
      statusMsg.style.color = '#2e7d32';
      updateProgress();
      renderSummary();

      // সার্ভারে পাঠাতে চাইলে (ব্যাকএন্ড চালু থাকলে):
      sendToServer(record);
    };

    if (file) {
      // ছবিকে resize করে base64 এ রূপান্তর (localStorage সীমাবদ্ধতার জন্য)
      resizeImage(file, 800, (dataUrl) => saveRecord(dataUrl));
    } else {
      const existing = loadAll().find(r => r.schoolIndex === idx);
      saveRecord(existing ? existing.photo : '');
    }
  });

  // ফর্ম পরিষ্কার
  document.getElementById('clearBtn').addEventListener('click', () => {
    clearForm(SCHOOLS[parseInt(select.value, 10)]);
    document.getElementById('previewContainer').innerHTML = '';
    statusMsg.textContent = '';
  });

  // CSV এক্সপোর্ট
  document.getElementById('exportBtn').addEventListener('click', exportCSV);

  // প্রথমবার সারসংক্ষেপ রেন্ডার
  updateProgress();
  renderSummary();
});

// --- হেল্পার ফাংশন ---

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function clearForm(schoolName) {
  const ids = [
    'district','upazila','union','village','fruitSpecies','timberSpecies',
    'medicinalSpecies','plantingDate','location','studentName','fatherName',
    'motherName','className','studentAddress','studentMobile','headName',
    'headMobile','remarks'
  ];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['fruitCount','timberCount','medicinalCount'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '0';
  });
  document.getElementById('schoolName').value = schoolName || '';
  document.getElementById('photo').value = '';
}

function fillForm(r) {
  const map = {
    district:'district', upazila:'upazila', union:'union', village:'village',
    fruitSpecies:'fruitSpecies', fruitCount:'fruitCount',
    timberSpecies:'timberSpecies', timberCount:'timberCount',
    medicinalSpecies:'medicinalSpecies', medicinalCount:'medicinalCount',
    plantingDate:'plantingDate', location:'location',
    studentName:'studentName', fatherName:'fatherName', motherName:'motherName',
    className:'className', studentAddress:'studentAddress',
    studentMobile:'studentMobile', headName:'headName',
    headMobile:'headMobile', remarks:'remarks'
  };
  Object.entries(map).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el) el.value = r[k] ?? '';
  });
}

function resizeImage(file, maxWidth, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateProgress() {
  const all = loadAll();
  const filled = all.length;
  document.getElementById('progressFill').style.width = (filled / 100 * 100) + '%';
  document.getElementById('progressText').textContent = `${filled} / 100 পূর্ণ`;
}

function renderSummary() {
  const all = loadAll();
  const section = document.getElementById('summarySection');
  const content = document.getElementById('summaryContent');
  if (all.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  const totalFruit = all.reduce((s, r) => s + r.fruitCount, 0);
  const totalTimber = all.reduce((s, r) => s + r.timberCount, 0);
  const totalMedicinal = all.reduce((s, r) => s + r.medicinalCount, 0);

  let html = `
    <p><strong>মোট বিদ্যালয়:</strong> ${all.length} টি</p>
    <p><strong>ফলদ চারা:</strong> ${totalFruit} টি |
       <strong>বনজ চারা:</strong> ${totalTimber} টি |
       <strong>ঔষধি চারা:</strong> ${totalMedicinal} টি</p>
    <table>
      <thead>
        <tr>
          <th>ক্রম</th><th>বিদ্যালয়</th><th>ফলদ</th>
          <th>বনজ</th><th>ঔষধি</th><th>শিক্ষার্থী</th>
        </tr>
      </thead>
      <tbody>
  `;
  all.forEach(r => {
    html += `<tr>
      <td>${String(r.schoolIndex + 1).padStart(2, '0')}</td>
      <td>${r.schoolName}</td>
      <td>${r.fruitCount}</td>
      <td>${r.timberCount}</td>
      <td>${r.medicinalCount}</td>
      <td>${r.studentName}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  content.innerHTML = html;
}

function exportCSV() {
  const all = loadAll();
  if (all.length === 0) { alert('কোনো তথ্য নেই'); return; }
  const headers = [
    'ক্রম','বিদ্যালয়ের নাম','জেলা','উপজেলা','ইউনিয়ন','গ্রাম',
    'ফলদ প্রজাতি','ফলদ সংখ্যা','বনজ প্রজাতি','বনজ সংখ্যা',
    'ঔষধি প্রজাতি','ঔষধি সংখ্যা','তারিখ','এলাকা',
    'শিক্ষার্থী','পিতা','মাতা','শ্রেণি','ঠিকানা','শিক্ষার্থী মোবাইল',
    'প্রধান','প্রধান মোবাইল','মন্তব্য'
  ];
  const rows = [headers];
  all.forEach(r => {
    rows.push([
      r.schoolIndex + 1, r.schoolName, r.district, r.upazila, r.union, r.village,
      r.fruitSpecies, r.fruitCount, r.timberSpecies, r.timberCount,
      r.medicinalSpecies, r.medicinalCount, r.plantingDate, r.location,
      r.studentName, r.fatherName, r.motherName, r.className, r.studentAddress,
      r.studentMobile, r.headName, r.headMobile, r.remarks
    ]);
  });
  const csv = '\uFEFF' + rows.map(r =>
    r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `বৃক্ষরোপণ_তথ্য_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ব্যাকএন্ডে পাঠানো (ঐচ্ছিক)
function sendToServer(record) {
  fetch('http://localhost:3000/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  }).catch(() => {
    console.warn('সার্ভার চালু নেই — শুধুমাত্র লোকাল স্টোরেজে সংরক্ষিত হয়েছে');
  });
}