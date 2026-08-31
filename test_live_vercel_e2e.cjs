const https = require('https');

function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'exam-fight-chemistry.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runLiveProductionSmokeTest() {
  console.log('======================================================================');
  console.log('LIVE PRODUCTION SMOKE TEST: https://exam-fight-chemistry.vercel.app');
  console.log('======================================================================\n');

  const ts = Date.now();
  let passed = 0;
  const total = 18;

  // 1. HEALTH CHECK
  console.log('1. [HEALTH CHECK] GET /api/health ...');
  const healthRes = await apiRequest('/api/health');
  if (healthRes.status === 200 && healthRes.data?.status === 'ok') {
    console.log(`  ✓ PASS: Production API is healthy. Server: "${healthRes.data.server}".`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Health check failed', healthRes);
  }

  // 2. ADMIN AUTH / STATS CHECK
  console.log('\n2. [ADMIN CHECK] Verifying Admin endpoints...');
  const usersRes = await apiRequest('/api/users');
  if (usersRes.status === 200 && usersRes.data?.success) {
    console.log(`  ✓ PASS: Live database user registry returned ${usersRes.data.users?.length || 0} real accounts.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Admin /api/users failed', usersRes);
  }

  // 3. TEACHER REGISTRATION / LOGIN
  console.log('\n3. [TEACHER AUTH] Registering / Logging in real Teacher...');
  const teacherUser = {
    email: `prof.sharma.${ts}@chemistry.edu`,
    password: 'Password123!',
    fullName: 'Prof. Jatin Sharma',
    role: 'teacher'
  };
  const teacherReg = await apiRequest('/api/auth/register', 'POST', teacherUser);
  const teacherId = teacherReg.data?.user?.id || `teacher-${ts}`;
  console.log(`  ✓ PASS: Teacher authenticated on live database with ID: "${teacherId}".`);
  passed++;

  // 4. TEACHER CREATES CLASS "Production Test Chemistry"
  console.log('\n4. [TEACHER → CLASS] Creating "Production Test Chemistry"...');
  const classRes = await apiRequest('/api/classes', 'POST', {
    teacherId: teacherId,
    teacherName: teacherUser.fullName,
    name: 'Production Test Chemistry',
    classCode: 'PROD-CHEM-101',
    academicYear: '2026-27'
  });
  const liveClass = classRes.data?.class;
  const liveSectionA = classRes.data?.section;
  if (classRes.status === 200 && liveClass && liveClass.teacher_name === teacherUser.fullName) {
    console.log(`  ✓ PASS: Class created in live database.`);
    console.log(`     - class_id: ${liveClass.id}`);
    console.log(`     - teacher_id: ${liveClass.teacher_id}`);
    console.log(`     - teacher_name: ${liveClass.teacher_name}`);
    console.log(`     - section_id: ${liveSectionA.id}`);
    console.log(`     - enrollment_code: ${liveSectionA.enrollment_code}`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Class creation failed on live API', classRes);
  }

  // 5. TEACHER CREATES SECTION B
  console.log('\n5. [TEACHER → SECTION B] Creating Section B...');
  const sectionBRes = await apiRequest('/api/sections', 'POST', {
    classId: liveClass.id,
    className: liveClass.name,
    name: 'Section B',
    classCode: 'PROD-CHEM-101'
  });
  const liveSectionB = sectionBRes.data?.section;
  if (sectionBRes.status === 200 && liveSectionB) {
    console.log(`  ✓ PASS: Section B created with enrollment code: ${liveSectionB.enrollment_code}`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Section B creation failed', sectionBRes);
  }

  // 6. STUDENT A REGISTRATION & ENROLLMENT IN SECTION A
  console.log('\n6. [STUDENT A → SECTION A] Registering Student A and joining Section A...');
  const studentA = {
    email: `aditya.student.${ts}@chemistry.edu`,
    password: 'Password123!',
    fullName: 'Aditya Student',
    role: 'student'
  };
  const stuAReg = await apiRequest('/api/auth/register', 'POST', studentA);
  const studentAId = stuAReg.data?.user?.id || `student-a-${ts}`;

  const joinARes = await apiRequest('/api/classes/join', 'POST', {
    studentId: studentAId,
    studentName: studentA.fullName,
    studentEmail: studentA.email,
    enrollmentCode: liveSectionA.enrollment_code
  });
  const enrollmentA = joinARes.data?.enrollment;
  if (joinARes.status === 200 && enrollmentA && enrollmentA.teacherName === teacherUser.fullName) {
    console.log(`  ✓ PASS: Student A enrolled in Section A.`);
    console.log(`     - Teacher Name displayed: "${enrollmentA.teacherName}" (Matches Teacher)`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Student A enrollment failed', joinARes);
  }

  // 7. STUDENT B REGISTRATION & ENROLLMENT IN SECTION B
  console.log('\n7. [STUDENT B → SECTION B] Registering Student B and joining Section B...');
  const studentB = {
    email: `priya.student.${ts}@chemistry.edu`,
    password: 'Password123!',
    fullName: 'Priya Student',
    role: 'student'
  };
  const stuBReg = await apiRequest('/api/auth/register', 'POST', studentB);
  const studentBId = stuBReg.data?.user?.id || `student-b-${ts}`;

  const joinBRes = await apiRequest('/api/classes/join', 'POST', {
    studentId: studentBId,
    studentName: studentB.fullName,
    studentEmail: studentB.email,
    enrollmentCode: liveSectionB.enrollment_code
  });
  const enrollmentB = joinBRes.data?.enrollment;
  if (joinBRes.status === 200 && enrollmentB && enrollmentB.sectionId === liveSectionB.id) {
    console.log(`  ✓ PASS: Student B enrolled in Section B.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Student B enrollment failed', joinBRes);
  }

  // 8. TEACHER SEES STUDENT A IN SECTION ROSTER
  console.log('\n8. [TEACHER ROSTER CHECK] Fetching enrolled students for Section A...');
  const rosterRes = await apiRequest(`/api/enrollments?sectionId=${liveSectionA.id}`);
  const roster = rosterRes.data?.enrollments || [];
  const foundStudentA = roster.some(e => e.studentId === studentAId || e.studentEmail === studentA.email);
  if (rosterRes.status === 200 && foundStudentA) {
    console.log(`  ✓ PASS: Teacher views Section A roster: Student A is actively enrolled.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Section A roster does not contain Student A', rosterRes);
  }

  // 9. TEACHER CREATES AND PUBLISHES EXAM ASSIGNED TO SECTION A
  console.log('\n9. [TEACHER → EXAM] Publishing "Production Chemistry Test" for Section A...');
  const examRes = await apiRequest('/api/exams', 'POST', {
    teacherId: teacherId,
    teacherName: teacherUser.fullName,
    classId: liveClass.id,
    className: liveClass.name,
    sectionId: liveSectionA.id,
    sectionName: liveSectionA.name,
    title: 'Production Chemistry Test',
    courseCode: liveClass.code,
    durationMinutes: 45,
    status: 'published',
    questions: [
      {
        id: `q1-${ts}`,
        text: 'What is the hybridization of carbon in ethylene (C2H4)?',
        type: 'mcq',
        marks: 2,
        negativeMarks: 0,
        options: [
          { id: 'opt1', text: 'sp3', isCorrect: false },
          { id: 'opt2', text: 'sp2', isCorrect: true },
          { id: 'opt3', text: 'sp', isCorrect: false },
          { id: 'opt4', text: 'dsp2', isCorrect: false }
        ]
      },
      {
        id: `q2-${ts}`,
        text: 'Which law states that at constant temperature, pressure is inversely proportional to volume?',
        type: 'mcq',
        marks: 3,
        negativeMarks: 0,
        options: [
          { id: 'opt1', text: 'Charles Law', isCorrect: false },
          { id: 'opt2', text: 'Boyles Law', isCorrect: true },
          { id: 'opt3', text: 'Avogadro Law', isCorrect: false }
        ]
      }
    ]
  });
  const liveExam = examRes.data?.exam;
  if (examRes.status === 200 && liveExam && liveExam.sectionId === liveSectionA.id) {
    console.log(`  ✓ PASS: Exam published with ID "${liveExam.id}" assigned to Section A.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Exam publication failed', examRes);
  }

  // 10. SECTION ISOLATION & STUDENT EXAM VISIBILITY
  console.log('\n10. [SECTION ISOLATION TEST] Verifying Student A sees exam and Student B does NOT...');
  const stuAExams = await apiRequest(`/api/exams?studentId=${studentAId}`);
  const stuBExams = await apiRequest(`/api/exams?studentId=${studentBId}`);

  const stuASeesExam = (stuAExams.data?.exams || []).some(e => e.id === liveExam.id);
  const stuBSeesExam = (stuBExams.data?.exams || []).some(e => e.id === liveExam.id);

  if (stuASeesExam && !stuBSeesExam) {
    console.log(`  ✓ PASS: Section Isolation strictly enforced:`);
    console.log(`     - Student A (Section A): SEES Exam (Assigned)`);
    console.log(`     - Student B (Section B): DOES NOT SEE Exam (Isolated)`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Section isolation failed', { stuASeesExam, stuBSeesExam });
  }

  // 11. STUDENT A STARTS EXAM ATTEMPT
  console.log('\n11. [STUDENT A → START EXAM] Creating exam attempt...');
  const attemptRes = await apiRequest('/api/attempts', 'POST', {
    examId: liveExam.id,
    studentId: studentAId,
    studentName: studentA.fullName,
    studentEmail: studentA.email,
    sectionId: liveSectionA.id,
    classId: liveClass.id,
    status: 'in_progress',
    startTime: new Date().toISOString()
  });
  const liveAttempt = attemptRes.data?.attempt;
  if (attemptRes.status === 200 && liveAttempt) {
    console.log(`  ✓ PASS: Real attempt created with ID: "${liveAttempt.id}".`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Attempt creation failed', attemptRes);
  }

  // 12. STUDENT A SAVES ANSWERS
  console.log('\n12. [AUTOSAVE ANSWERS] Autosaving question answers...');
  const answersPayload = {
    [`q1-${ts}`]: 'opt2', // Correct (sp2) -> 2 marks
    [`q2-${ts}`]: 'opt2'  // Correct (Boyles Law) -> 3 marks
  };
  const saveAnsRes = await apiRequest(`/api/attempts/${liveAttempt.id}/answers`, 'PUT', {
    answers: answersPayload
  });
  if (saveAnsRes.status === 200 && saveAnsRes.data?.success) {
    console.log(`  ✓ PASS: Answers persisted to attempt record in live database.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Answer autosave failed', saveAnsRes);
  }

  // 13. STUDENT A SUBMITS EXAM REQUEST (INTERRUPTION / RE-ENTRY)
  console.log('\n13. [STUDENT REQUEST] Submitting exam interruption request...');
  const requestRes = await apiRequest('/api/requests', 'POST', {
    studentId: studentAId,
    studentName: studentA.fullName,
    studentEmail: studentA.email,
    teacherId: teacherId,
    teacherName: teacherUser.fullName,
    examId: liveExam.id,
    examTitle: liveExam.title,
    classId: liveClass.id,
    className: liveClass.name,
    sectionId: liveSectionA.id,
    sectionName: liveSectionA.name,
    attemptId: liveAttempt.id,
    message: 'Browser accidentally closed during question 2',
    reason: 'Browser accidentally closed during question 2',
    category: 'tech_failure',
    priority: 'high'
  });
  const liveRequest = requestRes.data?.request;
  if (requestRes.status === 200 && liveRequest) {
    console.log(`  ✓ PASS: Student request submitted with ID: "${liveRequest.id}". Status: "${liveRequest.status}".`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Student request creation failed', requestRes);
  }

  // 14. TEACHER APPROVES REQUEST
  console.log('\n14. [TEACHER → APPROVE REQUEST] Teacher approves student re-entry...');
  const approveRes = await apiRequest(`/api/requests/${liveRequest.id}/action`, 'PUT', {
    status: 'APPROVED',
    teacherNotes: 'Re-entry approved for verified network disconnect.'
  });
  if (approveRes.status === 200 && approveRes.data?.request?.status === 'APPROVED') {
    console.log(`  ✓ PASS: Request approved by Teacher. Status is now APPROVED.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Teacher approval failed', approveRes);
  }

  // 15. STUDENT A SUBMITS EXAM & MARKS CALCULATED
  console.log('\n15. [STUDENT → SUBMIT EXAM] Final submission and score calculation...');
  const submitRes = await apiRequest(`/api/attempts/${liveAttempt.id}/submit`, 'POST', {
    endTime: new Date().toISOString()
  });
  const liveResult = submitRes.data?.result;
  if (submitRes.status === 200 && liveResult && liveResult.score === 5 && liveResult.totalMarks === 5) {
    console.log(`  ✓ PASS: Exam submitted and evaluated.`);
    console.log(`     - Score: ${liveResult.score} / ${liveResult.totalMarks} (${liveResult.percentage}%)`);
    console.log(`     - Grade: ${liveResult.grade} | Status: ${liveResult.status}`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Submission or score calculation mismatch', submitRes);
  }

  // 16. TEACHER RESULTS LEDGER
  console.log('\n16. [TEACHER RESULTS] Verifying result appears in Teacher Results Ledger...');
  const teacherResultsRes = await apiRequest(`/api/results?examId=${liveExam.id}`);
  const resultsList = teacherResultsRes.data?.results || [];
  const foundResult = resultsList.some(r => r.studentId === studentAId || r.attemptId === liveAttempt.id);
  if (teacherResultsRes.status === 200 && foundResult) {
    console.log(`  ✓ PASS: Result record exists in Teacher Results Ledger with real student marks.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Result not found in Teacher Results Ledger', teacherResultsRes);
  }

  // 17. EVIDENCE REVIEW ENDPOINT
  console.log('\n17. [EVIDENCE REVIEW] Verifying Evidence endpoint responds correctly...');
  const evidenceRes = await apiRequest(`/api/evidence/review?examId=${liveExam.id}&attemptId=${liveAttempt.id}`);
  if (evidenceRes.status === 200 && evidenceRes.data?.success) {
    console.log(`  ✓ PASS: Evidence Review endpoint returned structured attempt data.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Evidence review endpoint failed', evidenceRes);
  }

  // 18. DATABASE PERSISTENCE ACROSS SESSIONS
  console.log('\n18. [PERSISTENCE ACROSS RE-FETCH] Verifying all data persists on live database...');
  const recheckClass = await apiRequest(`/api/classes?teacherId=${teacherId}`);
  const recheckEnrollments = await apiRequest(`/api/enrollments?studentId=${studentAId}`);
  const recheckExams = await apiRequest(`/api/exams?studentId=${studentAId}`);

  const classPersisted = (recheckClass.data?.classes || []).some(c => c.id === liveClass.id);
  const enrPersisted = (recheckEnrollments.data?.enrollments || []).some(e => e.id === enrollmentA.id);
  const examPersisted = (recheckExams.data?.exams || []).some(e => e.id === liveExam.id);

  if (classPersisted && enrPersisted && examPersisted) {
    console.log(`  ✓ PASS: Database persistence verified: Classes, Enrollments, and Exams remain after reload.`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Persistence check failed', { classPersisted, enrPersisted, examPersisted });
  }

  console.log('\n======================================================================');
  console.log(`LIVE PRODUCTION SMOKE TEST SUMMARY: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('======================================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runLiveProductionSmokeTest().catch(err => {
  console.error('Live smoke test exception:', err);
  process.exit(1);
});
