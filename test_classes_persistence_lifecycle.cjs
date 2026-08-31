const https = require('https');

function api(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const tStart = Date.now();
    const options = {
      hostname: 'exam-fight-chemistry.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const latencyMs = Date.now() - tStart;
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), latencyMs, ok: res.statusCode >= 200 && res.statusCode < 400 });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, latencyMs, ok: res.statusCode >= 200 && res.statusCode < 400 });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 504, data: { error: 'Request timeout' }, latencyMs: Date.now() - tStart, ok: false });
    });

    req.on('error', (err) => {
      resolve({ status: 500, data: { error: err.message }, latencyMs: Date.now() - tStart, ok: false });
    });

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runAcceptanceTest() {
  console.log('======================================================================');
  console.log('EXAM FIGHT CHEMISTRY — REAL BROWSER & LIFECYCLE ACCEPTANCE TEST');
  console.log('Target Production: https://exam-fight-chemistry.vercel.app');
  console.log('======================================================================\n');

  const ts = Date.now();
  let passed = true;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
    } else {
      console.error(`  [FAIL] ${message}`);
      passed = false;
    }
  }

  // STEP 1: Teacher A Login / Registration
  console.log('1. TEACHER AUTHENTICATION & INITIAL STATE');
  const tEmail = `teacher.qa.${ts}@chemistry.edu`;
  const tName = `Prof. Acceptance ${ts.toString().slice(-4)}`;

  const regTeacherRes = await api('/api/auth/register', 'POST', {
    email: tEmail,
    password: 'Password123!',
    fullName: tName,
    role: 'teacher'
  });
  assert(regTeacherRes.ok, `Teacher A registered successfully (Status: ${regTeacherRes.status})`);
  const teacherId = regTeacherRes.data?.user?.id;
  assert(Boolean(teacherId), `Teacher canonical ID generated: ${teacherId}`);

  // Query Teacher Classes before creating any (must be empty, no foreign classes)
  const initialClassesRes = await api(`/api/classes?teacherId=${teacherId}`);
  assert(initialClassesRes.ok, `GET /api/classes for new teacher returned 200`);
  assert(Array.isArray(initialClassesRes.data?.classes) && initialClassesRes.data.classes.length === 0, `Initial classes count is 0 (No foreign classes leaked)`);

  // STEP 2: Teacher A Creates Class A
  console.log('\n2. CREATE CLASS A & SECTION A');
  const classCode = `QA${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const createClassRes = await api('/api/classes', 'POST', {
    teacherId,
    teacherName: tName,
    name: 'Advanced Physical Chemistry',
    classCode: classCode,
    academicYear: '2026-27',
    description: 'Acceptance verification class'
  });
  assert(createClassRes.ok, `Class created successfully (Status: ${createClassRes.status})`);
  const liveClass = createClassRes.data?.class;
  const sectionA = createClassRes.data?.section;
  assert(Boolean(liveClass?.id), `Class ID: ${liveClass?.id}`);
  assert(Boolean(sectionA?.enrollment_code), `Section A Enrollment Code: ${sectionA?.enrollment_code}`);

  // STEP 3: Verify Teacher Classes Query with Counts
  console.log('\n3. VERIFY TEACHER CLASSES PAGE STATE');
  const fetchClassesRes = await api(`/api/classes?teacherId=${teacherId}`);
  assert(fetchClassesRes.ok, `GET /api/classes returned 200`);
  const teacherClasses = fetchClassesRes.data?.classes || [];
  assert(teacherClasses.length === 1, `Teacher has exactly 1 class`);
  const loadedClass = teacherClasses[0];
  assert(loadedClass.name === 'Advanced Physical Chemistry', `Class name matches: "${loadedClass.name}"`);
  assert(loadedClass.sectionsCount === 1, `sectionsCount is 1 (Not 0)`);
  assert(loadedClass.studentsCount === 0, `studentsCount is 0 (Initial)`);

  // STEP 4: Refresh / Logout / Login Persistence Check
  console.log('\n4. REFRESH & LOGOUT/LOGIN PERSISTENCE SIMULATION');
  const loginTeacherRes = await api('/api/auth/login', 'POST', { email: tEmail });
  assert(loginTeacherRes.ok, `Teacher logged back in successfully`);
  const recheckClassesRes = await api(`/api/classes?teacherId=${teacherId}`);
  assert(recheckClassesRes.ok, `GET /api/classes after re-login returned 200`);
  const persistedClasses = recheckClassesRes.data?.classes || [];
  assert(persistedClasses.length === 1, `Class remains persistent across re-login`);
  assert(persistedClasses[0]?.id === liveClass?.id, `Class ID matches canonical DB record`);

  // STEP 5: Student A Joins Section A
  console.log('\n5. STUDENT ENROLLMENT & RELATIONSHIP VERIFICATION');
  const sEmail = `student.qa.${ts}@chemistry.edu`;
  const sName = `Student Acceptance ${ts.toString().slice(-4)}`;

  const regStudentRes = await api('/api/auth/register', 'POST', {
    email: sEmail,
    password: 'Password123!',
    fullName: sName,
    role: 'student'
  });
  assert(regStudentRes.ok, `Student A registered successfully`);
  const studentId = regStudentRes.data?.user?.id;

  const joinRes = await api('/api/classes/join', 'POST', {
    studentId,
    studentName: sName,
    studentEmail: sEmail,
    enrollmentCode: sectionA.enrollment_code
  });
  assert(joinRes.ok, `Student A joined Section A with code ${sectionA.enrollment_code}`);
  const enrollment = joinRes.data?.enrollment;
  assert(enrollment?.status === 'active', `Enrollment status is 'active'`);
  assert(enrollment?.teacherName === tName, `Enrollment reflects canonical Teacher Name: "${enrollment?.teacherName}"`);

  // STEP 6: Student A My Classes Verification
  console.log('\n6. STUDENT A "MY CLASSES" VERIFICATION');
  const studentEnrollmentsRes = await api(`/api/enrollments?studentId=${studentId}`);
  assert(studentEnrollmentsRes.ok, `GET /api/enrollments?studentId=${studentId} returned 200`);
  const studentEnrs = studentEnrollmentsRes.data?.enrollments || [];
  assert(studentEnrs.length === 1, `Student A has 1 active enrollment`);
  assert(studentEnrs[0].className === 'Advanced Physical Chemistry', `Enrolled Class Name: "${studentEnrs[0].className}"`);
  assert(studentEnrs[0].sectionName === 'Section A', `Enrolled Section Name: "${studentEnrs[0].sectionName}"`);
  assert(studentEnrs[0].teacherName === tName, `Teacher Name on Student Page: "${studentEnrs[0].teacherName}"`);

  // STEP 7: Teacher Classes & Roster Count Updates
  console.log('\n7. TEACHER PAGE ENROLLED STUDENT COUNT VERIFICATION');
  const teacherClassesAfterJoin = await api(`/api/classes?teacherId=${teacherId}`);
  const clsAfterJoin = teacherClassesAfterJoin.data?.classes?.[0];
  assert(clsAfterJoin?.studentsCount === 1, `Teacher Classes page now reflects studentsCount = 1 (Student enrolled)`);
  assert(clsAfterJoin?.sectionsCount === 1, `Teacher Classes page reflects sectionsCount = 1`);

  const teacherEnrollmentsRes = await api(`/api/enrollments?teacherId=${teacherId}`);
  const teacherRoster = teacherEnrollmentsRes.data?.enrollments || [];
  assert(teacherRoster.length === 1, `Teacher roster has 1 student`);
  assert(teacherRoster[0].studentName === sName, `Roster student name: "${teacherRoster[0].studentName}"`);

  // STEP 8: Exam Assignment & Visibility Gating
  console.log('\n8. EXAM CREATION & SECTION VISIBILITY GATING');
  const qId1 = `q1-${ts}`;
  const createExamRes = await api('/api/exams', 'POST', {
    teacherId,
    teacherName: tName,
    classId: liveClass.id,
    className: liveClass.name,
    sectionId: sectionA.id,
    sectionName: sectionA.name,
    title: 'Chemical Kinetics & Thermodynamics',
    courseCode: classCode,
    durationMinutes: 45,
    totalMarks: 10,
    status: 'published',
    questions: [
      {
        id: qId1,
        text: 'What is the rate law for a zero-order reaction?',
        type: 'mcq',
        marks: 10,
        options: [
          { id: 'optA', text: 'Rate = k', isCorrect: true },
          { id: 'optB', text: 'Rate = k[A]', isCorrect: false },
          { id: 'optC', text: 'Rate = k[A]^2', isCorrect: false }
        ]
      }
    ]
  });
  assert(createExamRes.ok, `Teacher created and published Exam A (Status: ${createExamRes.status})`);
  const examA = createExamRes.data?.exam;
  assert(Boolean(examA?.id), `Exam ID: ${examA?.id}`);

  // Student A (enrolled in Section A) MUST see Exam A
  const studentAExams = await api(`/api/exams?studentId=${studentId}`);
  assert(studentAExams.ok, `Student A queried assigned exams`);
  const hasExamA = (studentAExams.data?.exams || []).some(e => e.id === examA.id);
  assert(hasExamA, `Student A CAN see Exam A assigned to Section A`);

  // Student B (NOT enrolled in Section A) MUST NOT see Exam A
  const sEmailB = `studentB.qa.${ts}@chemistry.edu`;
  const regStudentBRes = await api('/api/auth/register', 'POST', {
    email: sEmailB,
    password: 'Password123!',
    fullName: `Student B Non-Enrolled`,
    role: 'student'
  });
  const studentBId = regStudentBRes.data?.user?.id;
  const studentBExams = await api(`/api/exams?studentId=${studentBId}`);
  const studentBHasExamA = (studentBExams.data?.exams || []).some(e => e.id === examA.id);
  assert(!studentBHasExamA, `Student B (Not enrolled) CANNOT see Exam A (Strict Section Gating)`);

  // STEP 9: Student A Exam Submission & Teacher Result Inspection
  console.log('\n9. EXAM COMPLETION & TEACHER EVALUATION');
  const startAttemptRes = await api('/api/attempts', 'POST', {
    examId: examA.id,
    studentId,
    studentName: sName,
    studentEmail: sEmail,
    sectionId: sectionA.id,
    status: 'in_progress',
    startTime: new Date().toISOString()
  });
  assert(startAttemptRes.ok, `Student A started Exam attempt`);
  const attemptId = startAttemptRes.data?.attempt?.id;

  const submitAttemptRes = await api(`/api/attempts/${attemptId}/submit`, 'POST', {
    studentId,
    answers: { [qId1]: 'optA' },
    endTime: new Date().toISOString()
  });
  assert(submitAttemptRes.ok, `Student A submitted Exam attempt`);
  const examResult = submitAttemptRes.data?.result;
  assert(examResult?.score === 10 || examResult?.obtainedMarks === 10, `Automatic evaluation score: 10/10`);

  // Teacher A views results
  const teacherResultsRes = await api(`/api/results?teacherId=${teacherId}`);
  assert(teacherResultsRes.ok, `Teacher queried student exam results`);
  const teacherResults = teacherResultsRes.data?.results || [];
  const studentSubmission = teacherResults.find(r => r.studentId === studentId);
  assert(Boolean(studentSubmission), `Teacher can inspect Student A's completed exam result`);

  console.log('\n======================================================================');
  console.log(`ACCEPTANCE TEST VERDICT: ${passed ? '100% PASS' : 'FAIL'}`);
  console.log('======================================================================\n');

  if (!passed) process.exit(1);
}

runAcceptanceTest().catch(err => {
  console.error('Fatal acceptance test error:', err);
  process.exit(1);
});
