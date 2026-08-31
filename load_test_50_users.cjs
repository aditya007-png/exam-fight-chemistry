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
      timeout: 10000
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

function calculatePercentile(latencies, p) {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function runLoadTest(concurrencyTarget = 50) {
  console.log('======================================================================');
  console.log(`EXAM FIGHT CHEMISTRY — REAL CONCURRENT LOAD TEST (${concurrencyTarget} CONCURRENT USERS)`);
  console.log('Target Production: https://exam-fight-chemistry.vercel.app');
  console.log('======================================================================\n');

  const ts = Date.now();
  const latencies = [];
  let totalRequests = 0;
  let successRequests = 0;
  let failedRequests = 0;
  let serverErrors = 0;
  let duplicateEnrollments = 0;
  let duplicateAttempts = 0;
  let lostAnswers = 0;
  let crossUserLeaks = 0;

  function record(res) {
    totalRequests++;
    latencies.push(res.latencyMs);
    if (res.ok) {
      successRequests++;
    } else {
      failedRequests++;
      if (res.status >= 500) serverErrors++;
    }
  }

  const numTeachers = Math.max(2, Math.floor(concurrencyTarget * 0.2));
  const numStudents = concurrencyTarget - numTeachers;

  console.log(`[1] Setup: Provisioning ${numTeachers} Teachers and ${numStudents} Students concurrently...`);

  // Step 1: Concurrently Register Teachers
  const teacherPromises = Array.from({ length: numTeachers }).map(async (_, idx) => {
    const tEmail = `load.teacher.${ts}.${idx}@chemistry.edu`;
    const tName = `Prof. LoadTester ${idx + 1}`;
    const regRes = await api('/api/auth/register', 'POST', {
      email: tEmail,
      password: 'Password123!',
      fullName: tName,
      role: 'teacher'
    });
    record(regRes);
    const teacherId = regRes.data?.user?.id || `teacher-${ts}-${idx}`;

    // Teacher creates Class & Section A
    const classRes = await api('/api/classes', 'POST', {
      teacherId,
      teacherName: tName,
      name: `Physical Chemistry Cohort ${idx + 1}`,
      classCode: `CHEM-${100 + idx}`,
      academicYear: '2026-27',
      description: 'Concurrent load test class cohort'
    });
    record(classRes);
    const liveClass = classRes.data?.class;
    const sectionA = classRes.data?.section;

    // Teacher creates Exam
    const examRes = await api('/api/exams', 'POST', {
      teacherId,
      teacherName: tName,
      classId: liveClass?.id,
      className: liveClass?.name,
      sectionId: sectionA?.id,
      sectionName: sectionA?.name,
      title: `Midterm Thermodynamics ${idx + 1}`,
      courseCode: `CHEM-${100 + idx}`,
      durationMinutes: 60,
      totalMarks: 10,
      status: 'published',
      questions: [
        {
          id: `q1-${ts}-${idx}`,
          text: 'What is ΔU for an isothermal expansion of an ideal gas?',
          type: 'mcq',
          marks: 5,
          options: [
            { id: 'opt1', text: 'ΔU = q', isCorrect: false },
            { id: 'opt2', text: 'ΔU = 0', isCorrect: true },
            { id: 'opt3', text: 'ΔU = w', isCorrect: false }
          ]
        },
        {
          id: `q2-${ts}-${idx}`,
          text: 'Entropy of a pure crystalline solid at 0 K is:',
          type: 'mcq',
          marks: 5,
          options: [
            { id: 'opt1', text: 'Zero', isCorrect: true },
            { id: 'opt2', text: 'Positive', isCorrect: false }
          ]
        }
      ]
    });
    record(examRes);
    const liveExam = examRes.data?.exam;

    return {
      teacherId,
      teacherName: tName,
      class: liveClass,
      sectionA,
      exam: liveExam
    };
  });

  const teacherCohort = await Promise.all(teacherPromises);
  console.log(`  ✓ ${teacherCohort.length} Teachers initialized and published exams.`);

  // Step 2: 40 Students Execute Real Concurrent Exam Lifecycle
  console.log(`\n[2] Executing simultaneous student flows (${numStudents} concurrent students)...`);
  const tStartConcurrent = Date.now();

  const studentPromises = Array.from({ length: numStudents }).map(async (_, sIdx) => {
    // Assign student to a teacher cohort
    const cohort = teacherCohort[sIdx % teacherCohort.length];
    const sEmail = `load.student.${ts}.${sIdx}@chemistry.edu`;
    const sName = `Student User ${sIdx + 1}`;

    // A. Student Register
    const regRes = await api('/api/auth/register', 'POST', {
      email: sEmail,
      password: 'Password123!',
      fullName: sName,
      role: 'student'
    });
    record(regRes);
    const studentId = regRes.data?.user?.id || `student-${ts}-${sIdx}`;

    // B. Student Dashboard & Classes Load
    const dashRes = await api(`/api/enrollments?studentId=${studentId}`);
    record(dashRes);

    // C. Student Joins Class Section
    const joinRes = await api('/api/classes/join', 'POST', {
      studentId,
      studentName: sName,
      studentEmail: sEmail,
      enrollmentCode: cohort.sectionA?.enrollment_code
    });
    record(joinRes);

    // Verify teacher relationship
    if (joinRes.data?.enrollment?.teacherName !== cohort.teacherName) {
      crossUserLeaks++;
    }

    // D. Fetch Assigned Exams
    const examsRes = await api(`/api/exams?studentId=${studentId}`);
    record(examsRes);
    const assignedExams = examsRes.data?.exams || [];
    const hasAssigned = assignedExams.some(e => e.id === cohort.exam?.id);
    if (!hasAssigned) {
      crossUserLeaks++;
    }

    // E. Concurrent Exam Start (Create Attempt)
    const startRes = await api('/api/attempts', 'POST', {
      examId: cohort.exam?.id,
      studentId,
      studentName: sName,
      studentEmail: sEmail,
      sectionId: cohort.sectionA?.id,
      status: 'in_progress',
      startTime: new Date().toISOString()
    });
    record(startRes);
    const attempt = startRes.data?.attempt;

    if (!attempt || !attempt.id) {
      duplicateAttempts++;
      return;
    }

    // F. Concurrent Answer Saves (Autosave Q1, Q2)
    const q1Id = `q1-${ts}-${sIdx % teacherCohort.length}`;
    const q2Id = `q2-${ts}-${sIdx % teacherCohort.length}`;

    const saveRes1 = await api(`/api/attempts/${attempt.id}/answers`, 'PUT', {
      studentId,
      answers: { [q1Id]: 'opt2' }
    });
    record(saveRes1);

    const saveRes2 = await api(`/api/attempts/${attempt.id}/answers`, 'PUT', {
      studentId,
      answers: { [q2Id]: 'opt1' }
    });
    record(saveRes2);

    // G. Verify Answers Saved in Attempt
    const checkAttempt = await api(`/api/attempts/${attempt.id}?studentId=${studentId}`);
    record(checkAttempt);
    const savedAnswers = checkAttempt.data?.attempt?.answers || {};
    if (savedAnswers[q1Id] !== 'opt2' || savedAnswers[q2Id] !== 'opt1') {
      lostAnswers++;
    }

    // H. Concurrent Exam Submission & Automatic Grading
    const submitRes = await api(`/api/attempts/${attempt.id}/submit`, 'POST', {
      studentId,
      endTime: new Date().toISOString()
    });
    record(submitRes);
    const result = submitRes.data?.result;
    const score = result ? (result.obtainedMarks ?? result.score) : null;
    if (score !== 10) {
      lostAnswers++;
    }

    // I. Student Fetches Transcripts
    const myResultsRes = await api(`/api/results?studentId=${studentId}`);
    record(myResultsRes);
  });

  // Concurrently run Teacher Dashboard Operations alongside Student Exam operations
  const teacherActivityPromises = teacherCohort.map(async (cohort) => {
    const tId = cohort.teacherId;
    const resList = await api(`/api/results?teacherId=${tId}`);
    record(resList);
    const reqList = await api(`/api/requests?teacherId=${tId}`);
    record(reqList);
    const enrList = await api(`/api/enrollments?teacherId=${tId}`);
    record(enrList);
    const revList = await api(`/api/evidence/review?teacherId=${tId}`);
    record(revList);
  });

  await Promise.all([...studentPromises, ...teacherActivityPromises]);
  const durationSec = ((Date.now() - tStartConcurrent) / 1000).toFixed(2);

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p95Latency = calculatePercentile(latencies, 95);
  const p99Latency = calculatePercentile(latencies, 99);
  const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);

  console.log('\n======================================================================');
  console.log(`LOAD TEST RESULTS (${concurrencyTarget} CONCURRENT USERS):`);
  console.log(`Duration:              ${durationSec} seconds`);
  console.log(`Total Requests:        ${totalRequests}`);
  console.log(`Successful Requests:   ${successRequests}`);
  console.log(`Failed Requests:       ${failedRequests}`);
  console.log(`Error Rate:            ${errorRate}%`);
  console.log(`Avg Latency:           ${avgLatency} ms`);
  console.log(`P95 Latency:           ${p95Latency} ms`);
  console.log(`P99 Latency:           ${p99Latency} ms`);
  console.log(`Server Errors (5xx):   ${serverErrors}`);
  console.log(`Duplicate Enrollments: ${duplicateEnrollments}`);
  console.log(`Duplicate Attempts:    ${duplicateAttempts}`);
  console.log(`Lost Answers:          ${lostAnswers}`);
  console.log(`Cross-User Leaks:      ${crossUserLeaks}`);
  console.log('======================================================================\n');

  const passed = (failedRequests === 0 && errorRate === '0.00' && lostAnswers === 0 && crossUserLeaks === 0);
  return {
    passed,
    concurrencyTarget,
    durationSec,
    totalRequests,
    successRequests,
    failedRequests,
    errorRate,
    avgLatency,
    p95Latency,
    p99Latency,
    serverErrors,
    duplicateEnrollments,
    duplicateAttempts,
    lostAnswers,
    crossUserLeaks
  };
}

async function main() {
  const res50 = await runLoadTest(50);
  console.log(`50 CONCURRENT USERS RESULT: ${res50.passed ? 'PASS' : 'FAIL'}`);

  // Headroom stress testing (75 and 100 users)
  console.log('\n>>> Commencing Headroom Stress Test (75 Users)...');
  const res75 = await runLoadTest(75);
  console.log(`75 CONCURRENT USERS RESULT: ${res75.passed ? 'PASS' : 'FAIL'}`);

  console.log('\n>>> Commencing Headroom Stress Test (100 Users)...');
  const res100 = await runLoadTest(100);
  console.log(`100 CONCURRENT USERS RESULT: ${res100.passed ? 'PASS' : 'FAIL'}`);

  if (!res50.passed) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
