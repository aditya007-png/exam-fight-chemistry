const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// -- Database Helpers ---------------------------------------------------------

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: [], teacherCodes: [], classes: [], sections: [], enrollments: [], exams: [], attempts: [], evidence: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('DB read error:', err);
    return { users: [], teacherCodes: [], classes: [], sections: [], enrollments: [], exams: [], attempts: [], evidence: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('DB write error:', err);
  }
}

function fuzzyNormalize(str) {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

// -- 1. Health Endpoint --------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), server: 'Exam Fight Chemistry Backend' });
});

// -- 2. Auth Endpoints ---------------------------------------------------------

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const db = readDB();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    let role = 'student';
    if (email.toLowerCase().includes('admin')) role = 'admin';
    else if (email.toLowerCase().includes('teacher') || email.toLowerCase().includes('faculty') || email.toLowerCase().includes('prof')) role = 'teacher';

    user = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      full_name: email.split('@')[0],
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.users.push(user);
    writeDB(db);
  }

  res.json({ success: true, user });
});

app.post('/api/auth/register', (req, res) => {
  const { email, fullName, role, teacherCode } = req.body;
  if (!email || !fullName) return res.status(400).json({ error: 'Email and full name are required.' });

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'A user with this email address already exists.' });

  const safeRole = role === 'teacher' ? 'teacher' : 'student';

  if (safeRole === 'teacher') {
    const codeRecord = db.teacherCodes.find(c => c.code.toUpperCase() === (teacherCode || '').trim().toUpperCase() && !c.is_used);
    if (!codeRecord) {
      return res.status(400).json({ error: 'Invalid or already claimed faculty verification code. Please request an authorization key from Administrator.' });
    }
    codeRecord.is_used = true;
    codeRecord.used_by = email;
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim(),
    role: safeRole,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);
  res.json({ success: true, user: newUser });
});

// -- 3. Users Directory Endpoints ----------------------------------------------

app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json({ success: true, users: db.users });
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { full_name } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.full_name = (full_name || user.full_name).trim();
  user.updated_at = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, user });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.users = db.users.filter(u => u.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// -- 4. Teacher Verification Codes ---------------------------------------------

app.get('/api/teacher-codes', (req, res) => {
  const db = readDB();
  res.json({ success: true, codes: db.teacherCodes });
});

app.post('/api/teacher-codes/generate', (req, res) => {
  const { facultyEmail } = req.body;
  const db = readDB();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newCode = {
    id: `code-${Date.now()}`,
    code: `CHEM-FACULTY-2026-${randomSuffix}`,
    created_for: facultyEmail || null,
    is_used: false,
    created_at: new Date().toISOString(),
    expires_at: null
  };
  db.teacherCodes.unshift(newCode);
  writeDB(db);
  res.json({ success: true, code: newCode });
});

app.delete('/api/teacher-codes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.teacherCodes = db.teacherCodes.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// -- 5. Classes & Sections Endpoints -------------------------------------------

app.get('/api/classes', (req, res) => {
  const { teacherId } = req.query;
  const db = readDB();
  let list = db.classes;
  if (teacherId) {
    list = list.filter(c => c.teacher_id === teacherId);
  }
  res.json({ success: true, classes: list });
});

app.post('/api/classes', (req, res) => {
  const { teacherId, teacherName, name, classCode, academicYear, description } = req.body;
  if (!name || !classCode) return res.status(400).json({ error: 'Class name and code are required.' });

  const db = readDB();
  const newClassId = `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cleanCode = classCode.trim().toUpperCase();

  const newClass = {
    id: newClassId,
    name: name.trim(),
    code: cleanCode,
    teacher_id: teacherId || 'teacher-001',
    teacher_name: teacherName || 'Faculty Instructor',
    academic_year: academicYear || '2026-27',
    subject: 'Chemistry',
    description: description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.classes.unshift(newClass);

  const codePrefix = cleanCode.substring(0, 4);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const enrollmentCode = `${codePrefix}-A${randomSuffix}`;

  const sectionA = {
    id: `sec-${newClassId}-a`,
    class_id: newClassId,
    className: newClass.name,
    name: 'Section A',
    enrollment_code: enrollmentCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.sections.unshift(sectionA);

  writeDB(db);
  res.json({ success: true, class: newClass, section: sectionA });
});

app.delete('/api/classes/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.classes = db.classes.filter(c => c.id !== id);
  db.sections = db.sections.filter(s => s.class_id !== id);
  db.enrollments = db.enrollments.filter(e => e.classId !== id);
  db.exams = db.exams.filter(e => e.classId !== id);
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/sections', (req, res) => {
  const { classId } = req.query;
  const db = readDB();
  let list = db.sections;
  if (classId) {
    list = list.filter(s => s.class_id === classId);
  }
  res.json({ success: true, sections: list });
});

app.post('/api/sections', (req, res) => {
  const { classId, className, name, classCode } = req.body;
  if (!classId || !name) return res.status(400).json({ error: 'Class ID and section name are required.' });

  const db = readDB();
  const cls = db.classes.find(c => c.id === classId);
  const prefix = (classCode || cls?.code || 'CHEM').substring(0, 4).toUpperCase();
  const secLetter = name.trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 1).toUpperCase() || 'B';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const enrollmentCode = `${prefix}-${secLetter}${randomSuffix}`;

  const newSection = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    class_id: classId,
    className: className || cls?.name || 'Class',
    name: name.trim(),
    enrollment_code: enrollmentCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.sections.push(newSection);
  writeDB(db);
  res.json({ success: true, section: newSection });
});

app.put('/api/sections/:id/regenerate-code', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const sec = db.sections.find(s => s.id === id);
  if (!sec) return res.status(404).json({ error: 'Section not found.' });

  const cls = db.classes.find(c => c.id === sec.class_id);
  const prefix = (cls?.code || 'CHEM').substring(0, 4).toUpperCase();
  const secLetter = sec.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 1).toUpperCase() || 'A';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  sec.enrollment_code = `${prefix}-${secLetter}${randomSuffix}`;
  sec.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, enrollment_code: sec.enrollment_code });
});

app.delete('/api/sections/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.sections = db.sections.filter(s => s.id !== id);
  db.enrollments = db.enrollments.filter(e => e.sectionId !== id);
  db.exams = db.exams.filter(e => e.sectionId !== id);
  writeDB(db);
  res.json({ success: true });
});

// -- 6. Student Join Class By Code (Enrollments) -------------------------------

app.post('/api/classes/join', (req, res) => {
  const { studentId, studentName, studentEmail, enrollmentCode } = req.body;
  if (!enrollmentCode || !enrollmentCode.trim()) {
    return res.status(400).json({ error: 'Please enter a valid section enrollment code.' });
  }

  const cleanCode = enrollmentCode.trim().toUpperCase();
  const strippedCode = cleanCode.replace(/[^A-Z0-9]/g, '');
  const fuzzyCode = fuzzyNormalize(cleanCode);

  const db = readDB();

  let section = db.sections.find(s => {
    const sClean = s.enrollment_code.toUpperCase();
    const sStripped = sClean.replace(/[^A-Z0-9]/g, '');
    const sFuzzy = fuzzyNormalize(sClean);
    return sClean === cleanCode || sStripped === strippedCode || sFuzzy === fuzzyCode;
  });

  let cls = null;
  if (section) {
    cls = db.classes.find(c => c.id === section.class_id);
  } else {
    cls = db.classes.find(c => {
      const cClean = c.code.toUpperCase();
      const cStripped = cClean.replace(/[^A-Z0-9]/g, '');
      const cFuzzy = fuzzyNormalize(cClean);
      return cClean === cleanCode || cStripped === strippedCode || cFuzzy === fuzzyCode;
    });
    if (cls) {
      section = db.sections.find(s => s.class_id === cls.id);
    }
  }

  if (!section || !cls) {
    const parts = cleanCode.split('-');
    const classPrefix = parts[0] || 'CHEM';
    const secIndicator = parts.length > 1 && parts[1].length > 0 ? parts[1][0] : 'A';
    const sectionName = `Section ${secIndicator.toUpperCase()}`;
    const className = classPrefix === 'CHE' || classPrefix === 'CHEM'
      ? 'General Chemistry'
      : `Academic Class (${classPrefix})`;

    cls = db.classes.find(c => c.code.toUpperCase() === classPrefix);
    if (!cls) {
      cls = {
        id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: className,
        code: classPrefix,
        teacher_id: 'teacher-001',
        teacher_name: 'Dr. Jatin Sharma',
        academic_year: '2026-27',
        subject: 'Chemistry',
        description: 'Academic Chemistry Course',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.classes.push(cls);
    }

    section = {
      id: `sec-${cls.id}-${cleanCode.replace(/[^A-Z0-9]/g, '')}`,
      class_id: cls.id,
      className: cls.name,
      name: sectionName,
      enrollment_code: cleanCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.sections.push(section);
  }

  const existingEnrollment = db.enrollments.find(e =>
    (e.studentId === studentId || (studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())) &&
    e.classId === cls.id
  );

  if (existingEnrollment) {
    return res.status(400).json({ error: `You are already enrolled in ${cls.name} (${section.name}).` });
  }

  const teacherUser = db.users.find(u => u.id === cls.teacher_id || u.role === 'teacher');
  const actualTeacherName = teacherUser?.full_name || cls.teacher_name || 'Dr. Jatin Sharma';

  const newEnrollment = {
    id: `enr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId: studentId || `stu-${Date.now()}`,
    studentName: studentName || 'Student Candidate',
    studentEmail: studentEmail || '',
    classId: cls.id,
    className: cls.name,
    sectionId: section.id,
    sectionName: section.name,
    teacherId: cls.teacher_id,
    teacherName: actualTeacherName,
    joinedAt: new Date().toISOString(),
    status: 'active'
  };

  db.enrollments.unshift(newEnrollment);
  writeDB(db);

  res.json({
    success: true,
    enrollment: newEnrollment,
    className: cls.name,
    sectionName: section.name,
    teacherName: actualTeacherName,
  });
});

app.get('/api/enrollments', (req, res) => {
  const { studentId, studentEmail, sectionId, classId, teacherId } = req.query;
  const db = readDB();
  let list = db.enrollments;

  if (studentId || studentEmail) {
    list = list.filter(e =>
      (studentId && e.studentId === studentId) ||
      (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())
    );
  }
  if (sectionId) {
    list = list.filter(e => e.sectionId === sectionId);
  }
  if (classId) {
    list = list.filter(e => e.classId === classId);
  }
  if (teacherId) {
    const teacherClasses = db.classes.filter(c => c.teacher_id === teacherId).map(c => c.id);
    list = list.filter(e => e.teacherId === teacherId || teacherClasses.includes(e.classId));
  }

  res.json({ success: true, enrollments: list });
});

app.delete('/api/enrollments/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.enrollments = db.enrollments.filter(e => e.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// -- 7. Exams & Assignment Pipeline (STEP 2 CORE) ------------------------------

app.get('/api/exams', (req, res) => {
  const { teacherId, studentId, studentEmail, sectionIds, status } = req.query;
  const db = readDB();
  let list = db.exams;

  // 1. Teacher Query: View own exams with real enrolled student count
  if (teacherId) {
    list = list.filter(e => e.teacherId === teacherId || !e.teacherId);
    list = list.map(e => {
      const count = e.sectionId
        ? db.enrollments.filter(enr => enr.sectionId === e.sectionId && enr.status === 'active').length
        : e.classId
        ? db.enrollments.filter(enr => enr.classId === e.classId && enr.status === 'active').length
        : 0;
      return { ...e, enrolledStudentsCount: count };
    });
    return res.json({ success: true, exams: list });
  }

  // 2. Student Query: Strictly resolve enrolled sections and return PUBLISHED exams
  if (studentId || studentEmail) {
    const studentEnrollments = db.enrollments.filter(e =>
      e.status === 'active' &&
      ((studentId && e.studentId === studentId) ||
       (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase()))
    );

    const enrolledSecIds = studentEnrollments.map(e => e.sectionId).filter(Boolean);
    const enrolledClsIds = studentEnrollments.map(e => e.classId).filter(Boolean);

    list = list.filter(e => {
      const isPublished = e.status === 'published' || e.status === 'active';
      if (!isPublished) return false;

      // Check section-level eligibility
      if (e.sectionId) {
        return enrolledSecIds.includes(e.sectionId);
      }
      if (e.classId) {
        return enrolledClsIds.includes(e.classId);
      }
      return false;
    });

    return res.json({ success: true, exams: list });
  }

  if (sectionIds) {
    const secArr = Array.isArray(sectionIds) ? sectionIds : sectionIds.split(',');
    list = list.filter(e => e.sectionId && secArr.includes(e.sectionId));
  }

  if (status) {
    list = list.filter(e => e.status === status);
  }

  res.json({ success: true, exams: list });
});

app.get('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const { studentId, studentEmail } = req.query;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  // Security check: if student attempts direct access, verify enrollment and publish status
  if (studentId || studentEmail) {
    const isPublished = exam.status === 'published' || exam.status === 'active';
    if (!isPublished) {
      return res.status(403).json({ error: 'This examination is currently unpublished or in draft status.' });
    }

    if (exam.sectionId || exam.classId) {
      const hasEnrollment = db.enrollments.some(e =>
        e.status === 'active' &&
        ((studentId && e.studentId === studentId) ||
         (studentEmail && e.studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())) &&
        (exam.sectionId ? e.sectionId === exam.sectionId : e.classId === exam.classId)
        );

      if (!hasEnrollment) {
        return res.status(403).json({
          error: 'Access Denied: You are not enrolled in the class section to which this examination is assigned.'
        });
      }
    }
  }

  res.json({ success: true, exam });
});

app.post('/api/exams', (req, res) => {
  const examData = req.body;
  const db = readDB();

  if (!examData.title || !examData.title.trim()) {
    return res.status(400).json({ error: 'Exam title is required.' });
  }

  const teacherId = examData.teacherId || 'teacher-001';

  // 1. Verify Teacher Ownership of Class & Section
  let className = examData.className || 'Class';
  let sectionName = examData.sectionName || 'Section A';
  let courseCode = examData.courseCode || 'CHEM101';

  if (examData.classId) {
    const cls = db.classes.find(c => c.id === examData.classId);
    if (!cls) {
      return res.status(404).json({ error: 'Selected class does not exist in the database.' });
    }
    if (cls.teacher_id && cls.teacher_id !== teacherId) {
      return res.status(403).json({ error: 'Forbidden: You cannot assign examinations to another faculty member\'s class.' });
    }
    className = cls.name;
    courseCode = cls.code;
  }

  if (examData.sectionId) {
    const sec = db.sections.find(s => s.id === examData.sectionId);
    if (!sec) {
      return res.status(404).json({ error: 'Selected section does not exist in the database.' });
    }
    if (examData.classId && sec.class_id !== examData.classId) {
      return res.status(400).json({ error: 'Selected section does not belong to the selected class.' });
    }
    sectionName = sec.name;
  }

  // Teacher Profile Resolution
  const teacherUser = db.users.find(u => u.id === teacherId || u.role === 'teacher');
  const actualTeacherName = teacherUser?.full_name || examData.teacherName || 'Faculty Instructor';

  // Standardize Status: 'published' | 'draft' | 'closed'
  let safeStatus = (examData.status || 'published').toLowerCase();
  if (safeStatus === 'active') safeStatus = 'published';

  const newExam = {
    id: examData.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: examData.title.trim(),
    topic: examData.topic || 'General Chemistry',
    courseCode: courseCode.trim().toUpperCase(),
    courseName: `${courseCode} � ${className}`,
    teacherId,
    teacherName: actualTeacherName,
    classId: examData.classId || null,
    className,
    sectionId: examData.sectionId || null,
    sectionName,
    durationMinutes: Number(examData.durationMinutes) || 60,
    instructions: examData.instructions || 'Standard examination rules apply. Complete all questions before the timer expires.',
    totalQuestions: examData.questions ? examData.questions.length : 10,
    totalMarks: Number(examData.totalMarks) || 100,
    passingMarks: Number(examData.passingMarks) || 40,
    status: safeStatus,
    questions: examData.questions || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIdx = db.exams.findIndex(e => e.id === newExam.id);
  if (existingIdx >= 0) {
    db.exams[existingIdx] = newExam;
  } else {
    db.exams.unshift(newExam);
  }

  writeDB(db);

  const enrolledCount = newExam.sectionId
    ? db.enrollments.filter(e => e.sectionId === newExam.sectionId && e.status === 'active').length
    : 0;

  res.json({
    success: true,
    exam: { ...newExam, enrolledStudentsCount: enrolledCount },
  });
});

app.put('/api/exams/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  exam.status = status;
  exam.updated_at = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, exam });
});

app.delete('/api/exams/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.exams = db.exams.filter(e => e.id !== id);
  db.attempts = db.attempts.filter(a => a.examId !== id);
  writeDB(db);
  res.json({ success: true });
});

// -- 8. Attempts & Proctoring Evidence Endpoints -------------------------------

app.get('/api/attempts', (req, res) => {
  const { studentId, examId } = req.query;
  const db = readDB();
  let list = db.attempts;
  if (studentId) {
    list = list.filter(a => a.studentId === studentId);
  }
  if (examId) {
    list = list.filter(a => a.examId === examId);
  }
  res.json({ success: true, attempts: list });
});

app.post('/api/attempts', (req, res) => {
  const attemptData = req.body;
  const db = readDB();

  const newAttempt = {
    id: attemptData.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    examId: attemptData.examId,
    examTitle: attemptData.examTitle || 'Chemistry Examination',
    courseCode: attemptData.courseCode || 'CHEM101',
    studentId: attemptData.studentId,
    studentName: attemptData.studentName || 'Candidate',
    sectionId: attemptData.sectionId,
    status: attemptData.status || 'in_progress',
    score: attemptData.score || 0,
    totalMarks: attemptData.totalMarks || 100,
    integrityScore: attemptData.integrityScore || 100,
    answers: attemptData.answers || {},
    proctoringEvents: attemptData.proctoringEvents || [],
    startedAt: attemptData.startedAt || new Date().toISOString(),
    submittedAt: attemptData.submittedAt || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIdx = db.attempts.findIndex(a => a.id === newAttempt.id);
  if (existingIdx >= 0) {
    db.attempts[existingIdx] = newAttempt;
  } else {
    db.attempts.unshift(newAttempt);
  }

  writeDB(db);
  res.json({ success: true, attempt: newAttempt });
});

app.post('/api/evidence', (req, res) => {
  const evidenceData = req.body;
  const db = readDB();

  const newEvidence = {
    id: `evi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    examId: evidenceData.examId,
    attemptId: evidenceData.attemptId,
    studentId: evidenceData.studentId,
    evidenceType: evidenceData.evidenceType || 'proctoring_event',
    metadata: evidenceData.metadata || {},
    recordedAt: new Date().toISOString()
  };

  db.evidence.unshift(newEvidence);
  writeDB(db);
  res.json({ success: true, evidence: newEvidence });
});

app.get('/api/evidence/:attemptId', (req, res) => {
  const { attemptId } = req.params;
  const db = readDB();
  const list = db.evidence.filter(e => e.attemptId === attemptId);
  res.json({ success: true, evidence: list });
});

// -- Start Express Server ------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Exam Fight Chemistry REST Backend running on http://localhost:${PORT}`);
});

