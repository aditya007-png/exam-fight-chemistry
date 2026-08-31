const https = require('https');

function api(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const tStart = Date.now();
    const options = {
      hostname: 'exam-fight-chemistry.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), latencyMs: Date.now() - tStart });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, latencyMs: Date.now() - tStart });
        }
      });
    });
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function debug() {
  const ts = Date.now();
  const tEmail = `debug.t.${ts}@chem.edu`;
  const regT = await api('/api/auth/register', 'POST', { email: tEmail, fullName: 'Prof Debug', role: 'teacher' });
  console.log('Reg Teacher:', regT);

  const tId = regT.data.user.id;
  const cls = await api('/api/classes', 'POST', { teacherId: tId, teacherName: 'Prof Debug', name: 'Chem 101', classCode: 'C101' });
  console.log('Class:', cls);

  const exm = await api('/api/exams', 'POST', {
    teacherId: tId,
    teacherName: 'Prof Debug',
    classId: cls.data.class.id,
    sectionId: cls.data.section.id,
    title: 'Exam 1',
    status: 'published',
    questions: [{ id: 'q1', text: 'Q1', type: 'mcq', marks: 10, options: [{ id: 'o1', text: 'O1', isCorrect: true }] }]
  });
  console.log('Exam:', exm);

  const sEmail = `debug.s.${ts}@chem.edu`;
  const regS = await api('/api/auth/register', 'POST', { email: sEmail, fullName: 'Student Debug', role: 'student' });
  console.log('Reg Student:', regS);
  const sId = regS.data.user.id;

  const join = await api('/api/classes/join', 'POST', {
    studentId: sId,
    studentName: 'Student Debug',
    studentEmail: sEmail,
    enrollmentCode: cls.data.section.enrollment_code
  });
  console.log('Join:', join);

  const myExams = await api(`/api/exams?studentId=${sId}`);
  console.log('My Exams:', myExams);

  const start = await api('/api/attempts', 'POST', {
    examId: exm.data.exam.id,
    studentId: sId,
    studentName: 'Student Debug',
    studentEmail: sEmail,
    sectionId: cls.data.section.id
  });
  console.log('Start Attempt:', start);
}

debug();
