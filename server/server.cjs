const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const SEED_DB_FILE = path.join(__dirname, 'database.json');
const DB_FILE = isVercel ? path.join('/tmp', 'database.json') : SEED_DB_FILE;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── High-Performance In-Memory DB Engine with Non-blocking Atomic Persistence ──

let memDB = null;
let isFlushing = false;
let pendingFlush = false;
let flushTimer = null;

function initMemDB() {
  if (memDB) return memDB;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      memDB = JSON.parse(raw);
    } else if (isVercel && fs.existsSync(SEED_DB_FILE)) {
      const raw = fs.readFileSync(SEED_DB_FILE, 'utf8');
      memDB = JSON.parse(raw);
      try {
        fs.writeFileSync(DB_FILE, raw, 'utf8');
      } catch (e) {}
    } else {
      memDB = {
        users: [],
        teacherCodes: [],
        classes: [],
        sections: [],
        enrollments: [],
        exams: [],
        attempts: [],
        evidence: [],
        requests: [],
        results: [],
        complaints: []
      };
    }
  } catch (err) {
    console.error('Failed to init memory DB from disk:', err);
    memDB = {
      users: [],
      teacherCodes: [],
      classes: [],
      sections: [],
      enrollments: [],
      exams: [],
      attempts: [],
      evidence: [],
      requests: [],
      results: [],
      complaints: []
    };
  }

  if (!memDB.users) memDB.users = [];
  if (!memDB.teacherCodes) memDB.teacherCodes = [];
  if (!memDB.classes) memDB.classes = [];
  if (!memDB.sections) memDB.sections = [];
  if (!memDB.enrollments) memDB.enrollments = [];
  if (!memDB.exams) memDB.exams = [];
  if (!memDB.attempts) memDB.attempts = [];
  if (!memDB.evidence) memDB.evidence = [];
  if (!memDB.requests) memDB.requests = [];
  if (!memDB.results) memDB.results = [];
  if (!memDB.complaints) memDB.complaints = [];

  return memDB;
}

function readDB() {
  if (!memDB) initMemDB();
  return memDB;
}

function flushDBToDisk() {
  if (!memDB) return;
  if (isFlushing) {
    pendingFlush = true;
    return;
  }
  isFlushing = true;
  pendingFlush = false;

  const dataStr = JSON.stringify(memDB, null, 2);
  const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;

  fs.writeFile(tmpFile, dataStr, 'utf8', (err) => {
    if (err) {
      console.warn('Async disk write warning:', err);
      isFlushing = false;
      return;
    }
    fs.rename(tmpFile, DB_FILE, (renameErr) => {
      isFlushing = false;
      if (renameErr) {
        console.warn('Atomic rename warning:', renameErr);
      }
      if (pendingFlush) {
        flushDBToDisk();
      }
    });
  });
}

function writeDB(data) {
  if (data) memDB = data;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushDBToDisk();
  }, 100);
}

// Pre-warm database on boot
initMemDB();

function fuzzyNormalize(str) {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

// ── 1. Health Endpoint ────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), server: 'Exam Fight Chemistry Backend' });
});

// ── 2. Auth Endpoints ─────────────────────────────────────────────────────────

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

  if (safeRole === 'teacher' && teacherCode) {
    const codeRecord = db.teacherCodes.find(c => c.code.toUpperCase() === teacherCode.trim().toUpperCase() && !c.is_used);
    if (codeRecord) {
      codeRecord.is_used = true;
      codeRecord.used_by = email;
    }
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

// ── 3. Users Directory Endpoints ──────────────────────────────────────────────

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

// ── 4. Teacher Verification Codes ─────────────────────────────────────────────

app.get(['/api/teacher-codes', '/api/teachers/codes'], (req, res) => {
  const db = readDB();
  res.json({ success: true, codes: db.teacherCodes });
});

const generateTeacherCodeHandler = (req, res) => {
  const { facultyEmail, email } = req.body;
  const targetEmail = facultyEmail || email || null;
  const db = readDB();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const newCode = {
    id: `code-${Date.now()}`,
    code: `CHEM-FACULTY-2026-${randomSuffix}`,
    created_for: targetEmail,
    is_used: false,
    created_at: new Date().toISOString(),
    expires_at: null
  };
  db.teacherCodes.unshift(newCode);
  writeDB(db);
  res.json({ success: true, code: newCode });
};

app.post(['/api/teacher-codes', '/api/teacher-codes/generate', '/api/teachers/codes'], generateTeacherCodeHandler);

app.delete(['/api/teacher-codes/:id', '/api/teachers/codes/:id'], (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.teacherCodes = db.teacherCodes.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ── 5. Classes & Sections Endpoints ───────────────────────────────────────────

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

  const teacherUser = db.users.find(u => u.id === teacherId);
  const actualTeacherName = (teacherName && teacherName !== 'Faculty Instructor')
    ? teacherName.trim()
    : (teacherUser?.full_name || teacherName || 'Faculty Instructor');

  const newClass = {
    id: newClassId,
    name: name.trim(),
    code: cleanCode,
    teacher_id: teacherId || (teacherUser ? teacherUser.id : 'teacher-001'),
    teacher_name: actualTeacherName,
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

// ── 6. Student Join Class By Code (Enrollments) ───────────────────────────────

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
    return res.status(404).json({
      error: 'Invalid section enrollment code. Please check the code provided by your instructor.'
    });
  }

  const existingEnrollment = db.enrollments.find(e =>
    (e.studentId === studentId || (studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())) &&
    e.classId === cls.id
  );

  if (existingEnrollment) {
    return res.status(400).json({ error: `You are already enrolled in ${cls.name} (${section.name}).` });
  }

  const teacherUser = db.users.find(u => u.id === cls.teacher_id);
  const actualTeacherName = cls.teacher_name || teacherUser?.full_name || 'Faculty Instructor';

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
    class: cls,
    section: section,
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

  // Enrich enrollments with full parent class and section details
  list = list.map(e => {
    const parentClass = db.classes.find(c => c.id === e.classId);
    const parentSection = db.sections.find(s => s.id === e.sectionId);
    const teacherUser = db.users.find(u => u.id === (parentClass ? parentClass.teacher_id : e.teacherId));
    const teacherName = parentClass?.teacher_name || teacherUser?.full_name || e.teacherName || 'Faculty Instructor';
    return {
      ...e,
      className: e.className || parentClass?.name || 'Chemistry Class',
      sectionName: e.sectionName || parentSection?.name || 'Section A',
      teacherName: teacherName,
      academicYear: parentClass?.academic_year || '2026-27',
      classCode: parentClass?.code || 'CHEM'
    };
  });

  res.json({ success: true, enrollments: list });
});

app.delete('/api/enrollments/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.enrollments = db.enrollments.filter(e => e.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ── 7. Exams & Questions Pipeline (STEP 3 CORE) ───────────────────────────────

app.get('/api/exams', (req, res) => {
  const { teacherId, studentId, studentEmail, sectionIds, status } = req.query;
  const db = readDB();
  let list = db.exams;

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

      if (e.sectionId && e.sectionId !== 'all') {
        return enrolledSecIds.includes(e.sectionId);
      }
      if (e.classId) {
        return enrolledClsIds.includes(e.classId);
      }
      return false;
    });

    const studentSafeList = list.map(e => {
      const sanitizedQuestions = (e.questions || []).map(q => ({
        id: q.id,
        text: q.text,
        type: q.type || 'mcq',
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        options: (q.options || []).map(opt => ({ id: opt.id, text: opt.text }))
      }));
      return {
        ...e,
        questions: sanitizedQuestions
      };
    });

    return res.json({ success: true, exams: studentSafeList });
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
  const { studentId, studentEmail, teacherId } = req.query;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  if (teacherId && exam.teacherId && exam.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access another faculty member\'s exam.' });
  }

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

    // Security Check: If student has a PENDING request for this exam, block direct access
    const pendingReq = (db.requests || []).find(r => r.studentId === studentId && r.examId === id && r.status === 'PENDING');
    if (pendingReq) {
      return res.status(403).json({
        error: 'This examination is currently locked pending review by your instructor.'
      });
    }

    const rejectedReq = (db.requests || []).find(r => r.studentId === studentId && r.examId === id && r.status === 'REJECTED');
    if (rejectedReq) {
      return res.status(403).json({
        error: 'Your request for this examination was rejected by your instructor.'
      });
    }

    // Sanitize questions for student payload: remove correct answer keys!
    const sanitizedQuestions = (exam.questions || []).map(q => {
      const sanitizedOptions = (q.options || []).map(opt => ({
        id: opt.id,
        text: opt.text,
      }));
      return {
        id: q.id,
        text: q.text,
        type: q.type || 'mcq',
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        options: sanitizedOptions,
      };
    });

    return res.json({
      success: true,
      exam: {
        ...exam,
        questions: sanitizedQuestions,
      }
    });
  }

  res.json({ success: true, exam });
});

// Questions Endpoint (Get, Add, Edit, Delete)
app.get('/api/exams/:id/questions', (req, res) => {
  const { id } = req.params;
  const { studentId, studentEmail } = req.query;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  const questions = exam.questions || [];

  // If student requests, strip correct answer keys
  if (studentId || studentEmail) {
    const sanitized = questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type || 'mcq',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,
      options: (q.options || []).map(opt => ({ id: opt.id, text: opt.text }))
    }));
    return res.json({ success: true, questions: sanitized });
  }

  res.json({ success: true, questions });
});

app.post('/api/exams/:id/questions', (req, res) => {
  const { id } = req.params;
  const { teacherId, question } = req.body;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  if (teacherId && exam.teacherId && exam.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot modify questions in another instructor\'s exam.' });
  }

  if (!exam.questions) exam.questions = [];

  const newQ = {
    id: question.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: question.text || 'Chemistry Question',
    type: question.type || 'mcq',
    options: question.options || [],
    marks: Number(question.marks) || 1,
    negativeMarks: Number(question.negativeMarks) || 0,
    created_at: new Date().toISOString()
  };

  exam.questions.push(newQ);
  exam.totalQuestions = exam.questions.length;
  exam.totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  exam.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, question: newQ, totalQuestions: exam.totalQuestions, totalMarks: exam.totalMarks });
});

app.put('/api/exams/:id/questions/:questionId', (req, res) => {
  const { id, questionId } = req.params;
  const { teacherId, question } = req.body;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  if (teacherId && exam.teacherId && exam.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot edit questions in another instructor\'s exam.' });
  }

  const qIndex = (exam.questions || []).findIndex(q => q.id === questionId);
  if (qIndex === -1) return res.status(404).json({ error: 'Question not found.' });

  exam.questions[qIndex] = { ...exam.questions[qIndex], ...question, id: questionId };
  exam.totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  exam.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, question: exam.questions[qIndex] });
});

app.delete('/api/exams/:id/questions/:questionId', (req, res) => {
  const { id, questionId } = req.params;
  const { teacherId } = req.query;
  const db = readDB();
  const exam = db.exams.find(e => e.id === id);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  if (teacherId && exam.teacherId && exam.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot delete questions from another instructor\'s exam.' });
  }

  exam.questions = (exam.questions || []).filter(q => q.id !== questionId);
  exam.totalQuestions = exam.questions.length;
  exam.totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  exam.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, totalQuestions: exam.totalQuestions, totalMarks: exam.totalMarks });
});

app.post('/api/exams', (req, res) => {
  const examData = req.body;
  const db = readDB();

  if (!examData.title || !examData.title.trim()) {
    return res.status(400).json({ error: 'Exam title is required.' });
  }

  const teacherId = examData.teacherId || 'teacher-001';

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

  const teacherUser = db.users.find(u => u.id === teacherId);
  const actualTeacherName = examData.teacherName || teacherUser?.full_name || 'Faculty Instructor';

  let safeStatus = (examData.status || 'published').toLowerCase();
  if (safeStatus === 'active') safeStatus = 'published';

  const questionsList = examData.questions || [];
  const calculatedMarks = questionsList.reduce((sum, q) => sum + (Number(q.marks) || 1), 0) || Number(examData.totalMarks) || 100;

  const newExam = {
    id: examData.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: examData.title.trim(),
    topic: examData.topic || 'General Chemistry',
    courseCode: courseCode.trim().toUpperCase(),
    courseName: `${courseCode} — ${className}`,
    teacherId,
    teacherName: actualTeacherName,
    classId: examData.classId || null,
    className,
    sectionId: examData.sectionId || null,
    sectionName,
    durationMinutes: Number(examData.durationMinutes) || 60,
    instructions: examData.instructions || 'Standard examination rules apply. Complete all questions before the timer expires.',
    totalQuestions: questionsList.length,
    totalMarks: calculatedMarks,
    passingMarks: Number(examData.passingMarks) || Math.ceil(calculatedMarks * 0.4),
    status: safeStatus,
    questions: questionsList,
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

// ── 8. Attempts & Real-time Answers (STEP 3 ATTEMPT LOGIC) ─────────────────────

app.get('/api/attempts', (req, res) => {
  const { studentId, examId, teacherId } = req.query;
  const db = readDB();
  let list = db.attempts;

  if (teacherId) {
    const teacherExams = db.exams.filter(e => e.teacherId === teacherId).map(e => e.id);
    list = list.filter(a => teacherExams.includes(a.examId));
  }
  if (studentId) {
    list = list.filter(a => a.studentId === studentId);
  }
  if (examId) {
    list = list.filter(a => a.examId === examId);
  }
  res.json({ success: true, attempts: list });
});

app.get('/api/attempts/:id', (req, res) => {
  const { id } = req.params;
  const { studentId, teacherId } = req.query;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Exam attempt not found.' });

  // Security: Only owner student or exam teacher can access
  if (studentId && attempt.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access another student\'s examination attempt.' });
  }

  if (teacherId) {
    const exam = db.exams.find(e => e.id === attempt.examId);
    if (exam && exam.teacherId && exam.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Forbidden: You cannot access attempts from another instructor\'s exam.' });
    }
  }

  res.json({ success: true, attempt });
});

app.post('/api/attempts', (req, res) => {
  const { examId, studentId, studentName, studentEmail, sectionId } = req.body;
  if (!examId || !studentId) return res.status(400).json({ error: 'examId and studentId are required.' });

  const db = readDB();
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  const isPublished = exam.status === 'published' || exam.status === 'active';
  if (!isPublished) return res.status(403).json({ error: 'This exam is currently unpublished.' });

  // Verify enrollment
  const hasEnrollment = db.enrollments.some(e =>
    e.status === 'active' &&
    (e.studentId === studentId || (studentEmail && e.studentEmail.toLowerCase() === studentEmail.toLowerCase())) &&
    (exam.sectionId ? e.sectionId === exam.sectionId : e.classId === exam.classId)
  );

  if (!hasEnrollment) {
    return res.status(403).json({ error: 'Access Denied: You are not enrolled in the class section for this exam.' });
  }

  // Security Check: If student has an active PENDING request, block starting/restarting
  const pendingReq = (db.requests || []).find(r => r.studentId === studentId && r.examId === examId && r.status === 'PENDING');
  if (pendingReq) {
    return res.status(403).json({
      error: 'You have a pending request for this examination. Please wait for your instructor to approve before continuing.'
    });
  }

  // If request was REJECTED, block re-entry
  const rejectedReq = (db.requests || []).find(r => r.studentId === studentId && r.examId === examId && r.status === 'REJECTED');
  if (rejectedReq) {
    return res.status(403).json({
      error: 'Your request for this examination was rejected by your instructor.'
    });
  }

  // Check if existing in-progress attempt exists (or approved for continuation)
  let existingAttempt = db.attempts.find(a => a.examId === examId && a.studentId === studentId && a.status === 'in_progress');
  if (existingAttempt) {
    return res.json({ success: true, attempt: existingAttempt });
  }

  const newAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    examId,
    examTitle: exam.title,
    courseCode: exam.courseCode,
    className: exam.className,
    studentId,
    studentName: studentName || 'Student Candidate',
    studentEmail: studentEmail || '',
    sectionId: sectionId || exam.sectionId,
    status: 'in_progress',
    score: null,
    totalMarks: exam.totalMarks || 100,
    integrityScore: 100,
    answers: {},
    proctoringEvents: [],
    startedAt: new Date().toISOString(),
    submittedAt: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.attempts.unshift(newAttempt);
  writeDB(db);
  res.json({ success: true, attempt: newAttempt });
});

app.put('/api/attempts/:id/answers', (req, res) => {
  const { id } = req.params;
  const { studentId, answers } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Exam attempt not found.' });

  if (studentId && attempt.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot modify another student\'s answers.' });
  }

  if (attempt.status === 'submitted') {
    return res.status(400).json({ error: 'Cannot modify answers after final exam submission.' });
  }

  attempt.answers = { ...attempt.answers, ...(answers || {}) };
  attempt.updated_at = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, answers: attempt.answers });
});

app.post('/api/attempts/:id/events', (req, res) => {
  const { id } = req.params;
  const { eventType, severity, description, timestamp, metadata } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Exam attempt not found.' });

  const newEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    attemptId: id,
    eventType: eventType || 'PROCTORING_FLAG',
    severity: severity || 'medium',
    description: description || 'Proctoring alert triggered',
    timestamp: timestamp || new Date().toISOString(),
    metadata: metadata || {}
  };

  if (!attempt.proctoringEvents) attempt.proctoringEvents = [];
  attempt.proctoringEvents.push(newEvent);

  // Recalculate integrity score
  const penalty = severity === 'high' ? 10 : severity === 'medium' ? 5 : 2;
  attempt.integrityScore = Math.max(0, (attempt.integrityScore || 100) - penalty);
  attempt.updated_at = new Date().toISOString();

  // Also save in evidence store
  const newEvidence = {
    id: `evi-evt-${Date.now()}`,
    examId: attempt.examId,
    attemptId: id,
    studentId: attempt.studentId,
    evidenceType: 'proctoring_event',
    metadata: { ...newEvent },
    recordedAt: newEvent.timestamp
  };
  db.evidence.push(newEvidence);

  writeDB(db);
  res.json({ success: true, event: newEvent, integrityScore: attempt.integrityScore });
});

app.post('/api/attempts/:id/submit', (req, res) => {
  const { id } = req.params;
  const { studentId, answers } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Exam attempt not found.' });

  if (studentId && attempt.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot submit another student\'s attempt.' });
  }

  if (answers) {
    attempt.answers = { ...attempt.answers, ...answers };
  }

  // Automatic Grading against exam questions
  const exam = db.exams.find(e => e.id === attempt.examId);
  let totalScore = 0;
  let maxScore = exam ? exam.totalMarks : 100;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const questionResults = [];

  if (exam && Array.isArray(exam.questions)) {
    maxScore = exam.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    exam.questions.forEach((q, idx) => {
      const studentAns = attempt.answers[q.id];
      const correctOption = (q.options || []).find(opt => opt.isCorrect);
      let isCorrect = false;
      let obtained = 0;
      let studentText = 'Unattempted';

      if (!studentAns || (typeof studentAns === 'object' && (!studentAns.selectedOptionIds || studentAns.selectedOptionIds.length === 0))) {
        unattemptedCount++;
      } else {
        const selectedVal = typeof studentAns === 'string'
          ? studentAns
          : studentAns.selectedOptionIds ? studentAns.selectedOptionIds[0] : studentAns.value;

        const selectedOptionObj = (q.options || []).find(opt => opt.id === selectedVal || opt.text === selectedVal);
        studentText = selectedOptionObj ? selectedOptionObj.text : String(selectedVal || 'Answered');

        if (correctOption && (selectedVal === correctOption.id || selectedVal === correctOption.text)) {
          isCorrect = true;
          obtained = Number(q.marks) || 1;
          totalScore += obtained;
          correctCount++;
        } else {
          isCorrect = false;
          const neg = Number(q.negativeMarks) || 0;
          totalScore -= neg;
          obtained = neg > 0 ? -neg : 0;
          incorrectCount++;
        }
      }

      questionResults.push({
        questionId: q.id || `q-${idx + 1}`,
        questionNumber: idx + 1,
        questionText: q.text || `Question ${idx + 1}`,
        type: q.type || 'mcq',
        studentAnswer: studentText,
        correctAnswer: correctOption ? correctOption.text : 'N/A',
        isCorrect,
        marks: Number(q.marks) || 1,
        obtainedMarks: obtained
      });
    });
  }

  attempt.status = 'submitted';
  attempt.submittedAt = new Date().toISOString();
  attempt.score = Math.max(0, totalScore);
  attempt.totalMarks = maxScore;
  attempt.questionResults = questionResults;
  attempt.updated_at = new Date().toISOString();

  // Create or Update Result Record in db.results
  const resultId = `res-${attempt.id}`;
  let existingResult = db.results.find(r => r.attemptId === id);
  const percentage = maxScore > 0 ? Math.round((attempt.score / maxScore) * 100) : 0;

  const resultRecord = {
    id: existingResult ? existingResult.id : resultId,
    studentId: attempt.studentId,
    studentName: attempt.studentName,
    studentEmail: attempt.studentEmail,
    teacherId: exam ? exam.teacherId : '',
    teacherName: exam ? exam.teacherName : '',
    classId: exam ? exam.classId : '',
    className: exam ? exam.className : '',
    sectionId: attempt.sectionId || (exam ? exam.sectionId : ''),
    sectionName: exam ? exam.sectionName : 'Section A',
    examId: attempt.examId,
    examTitle: exam ? exam.title : attempt.examTitle,
    attemptId: attempt.id,
    obtainedMarks: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage,
    status: 'EVALUATED',
    questionResults,
    submittedAt: attempt.submittedAt,
    createdAt: existingResult ? existingResult.createdAt : attempt.submittedAt,
    updatedAt: new Date().toISOString()
  };

  if (existingResult) {
    Object.assign(existingResult, resultRecord);
  } else {
    db.results.unshift(resultRecord);
  }

  // Create submission evidence
  db.evidence.push({
    id: `evi-sub-${Date.now()}`,
    examId: attempt.examId,
    attemptId: id,
    studentId: attempt.studentId,
    evidenceType: 'exam_submission',
    metadata: {
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      correctCount,
      incorrectCount,
      unattemptedCount,
      integrityScore: attempt.integrityScore
    },
    recordedAt: attempt.submittedAt
  });

  writeDB(db);
  res.json({
    success: true,
    attempt,
    result: resultRecord,
    grading: {
      score: attempt.score,
      totalMarks: maxScore,
      correctCount,
      incorrectCount,
      unattemptedCount,
      percentage
    }
  });
});

// ── 9. Evidence Vault & Evidence Review (STEP 3 EVIDENCE LOGIC) ─────────────────

app.post('/api/attempts/:id/evidence', (req, res) => {
  const { id } = req.params;
  const { studentId, evidenceType, filePath, signedUrl, durationSeconds, coverageDegrees, metadata } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Exam attempt not found.' });

  const newEvidence = {
    id: `evi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    examId: attempt.examId,
    attemptId: id,
    studentId: studentId || attempt.studentId,
    evidenceType: evidenceType || 'room_scan',
    filePath: filePath || '',
    signedUrl: signedUrl || '',
    durationSeconds: durationSeconds || 0,
    coverageDegrees: coverageDegrees || 300,
    metadata: metadata || {},
    recordedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.evidence.unshift(newEvidence);
  writeDB(db);
  res.json({ success: true, evidence: newEvidence });
});

app.get('/api/attempts/:id/evidence', (req, res) => {
  const { id } = req.params;
  const { studentId, teacherId } = req.query;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

  if (studentId && attempt.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot view evidence from another student\'s attempt.' });
  }

  if (teacherId) {
    const exam = db.exams.find(e => e.id === attempt.examId);
    if (exam && exam.teacherId && exam.teacherId !== teacherId) {
      return res.status(403).json({ error: 'Forbidden: You cannot view evidence from another instructor\'s exam.' });
    }
  }

  const evidenceList = db.evidence.filter(e => e.attemptId === id);
  res.json({ success: true, attempt, evidenceList, proctoringEvents: attempt.proctoringEvents || [] });
});

// Teacher Comprehensive Evidence Review Endpoint
app.get('/api/evidence/review', (req, res) => {
  const { teacherId, examId, studentId, attemptId } = req.query;
  if (!teacherId) return res.status(400).json({ error: 'teacherId is required for evidence review.' });

  const db = readDB();

  // 1. Get exams belonging to this teacher
  const teacherExams = db.exams.filter(e => e.teacherId === teacherId);
  const examIds = teacherExams.map(e => e.id);

  // 2. Get attempts belonging to teacher's exams
  let attempts = db.attempts.filter(a => examIds.includes(a.examId));

  if (examId) {
    attempts = attempts.filter(a => a.examId === examId);
  }
  if (studentId) {
    attempts = attempts.filter(a => a.studentId === studentId);
  }

  let selectedAttempt = null;
  if (attemptId) {
    selectedAttempt = attempts.find(a => a.id === attemptId) || null;
  } else if (attempts.length > 0) {
    selectedAttempt = attempts[0];
  }

  let evidenceList = [];
  let proctoringTimeline = [];

  if (selectedAttempt) {
    evidenceList = db.evidence.filter(e => e.attemptId === selectedAttempt.id);
    proctoringTimeline = (selectedAttempt.proctoringEvents || []).map(evt => ({
      time: new Date(evt.timestamp).toLocaleTimeString(),
      type: evt.eventType,
      severity: evt.severity,
      description: evt.description,
      timestamp: evt.timestamp
    }));
  }

  res.json({
    success: true,
    exams: teacherExams,
    attempts,
    selectedAttempt,
    evidenceList,
    proctoringTimeline
  });
});

// ── 10. Student Requests & Teacher Actions (STEP 4 CORE) ─────────────────────

app.post('/api/requests', (req, res) => {
  const { studentId, studentName, studentEmail, examId, attemptId, requestType, message, reason } = req.body;
  const finalMessage = (message || reason || '').trim();
  if (!studentId || !examId || !finalMessage) {
    return res.status(400).json({ error: 'studentId, examId, and message are required.' });
  }

  const db = readDB();
  const exam = db.exams.find(e => e.id === examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found.' });

  // Security: If attemptId provided, verify it belongs to this student
  if (attemptId) {
    const attempt = db.attempts.find(a => a.id === attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }
    if (attempt.studentId !== studentId) {
      return res.status(403).json({ error: 'Forbidden: You cannot create a request referencing another student\'s attempt.' });
    }
  }

  // Prevent duplicate pending request
  const existingPending = db.requests.find(r =>
    r.studentId === studentId &&
    r.examId === examId &&
    (attemptId ? r.attemptId === attemptId : true) &&
    r.requestType === (requestType || 'EXAM_EXITED') &&
    r.status === 'PENDING'
  );

  if (existingPending) {
    return res.status(400).json({
      error: 'You already have a pending request for this examination. Please wait for your instructor to review it.'
    });
  }

  // Resolve Student Info
  const studentUser = db.users.find(u => u.id === studentId);
  const realStudentName = studentName || studentUser?.full_name || 'Student Candidate';
  const realStudentEmail = studentEmail || studentUser?.email || '';

  // Resolve Teacher Info
  const teacherUser = db.users.find(u => u.id === exam.teacherId);
  const realTeacherName = exam.teacherName || (teacherUser && teacherUser.full_name) || 'Faculty Instructor';

  const newRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId,
    studentName: realStudentName,
    studentEmail: realStudentEmail,
    teacherId: exam.teacherId,
    teacherName: realTeacherName,
    classId: exam.classId || '',
    className: exam.className || 'Class',
    sectionId: exam.sectionId || '',
    sectionName: exam.sectionName || 'Section A',
    examId,
    examTitle: exam.title,
    attemptId: attemptId || null,
    requestType: requestType || 'EXAM_EXITED',
    message: finalMessage,
    reason: finalMessage,
    status: 'PENDING',
    teacherResponse: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.requests.unshift(newRequest);
  writeDB(db);

  res.json({ success: true, request: newRequest });
});

app.get('/api/requests', (req, res) => {
  const { teacherId, studentId, status, examId } = req.query;
  const db = readDB();
  let list = db.requests;

  if (teacherId) {
    list = list.filter(r => r.teacherId === teacherId);
  }
  if (studentId) {
    list = list.filter(r => r.studentId === studentId);
  }
  if (status && status !== 'ALL') {
    list = list.filter(r => r.status === status);
  }
  if (examId) {
    list = list.filter(r => r.examId === examId);
  }

  res.json({ success: true, requests: list });
});

app.get('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { studentId, teacherId } = req.query;
  const db = readDB();
  const request = db.requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  if (studentId && request.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access another student\'s request.' });
  }

  if (teacherId && request.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access requests from another instructor\'s students.' });
  }

  res.json({ success: true, request });
});

app.put('/api/requests/:id/action', (req, res) => {
  const { id } = req.params;
  const { teacherId, status, teacherResponse } = req.body;
  const db = readDB();
  const request = db.requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  if (teacherId && request.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You are not authorized to update another instructor\'s requests.' });
  }

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'RESOLVED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  if (status) request.status = status;
  if (teacherResponse !== undefined) request.teacherResponse = teacherResponse;
  request.resolvedAt = (status === 'APPROVED' || status === 'RESOLVED' || status === 'REJECTED')
    ? new Date().toISOString()
    : null;
  request.updatedAt = new Date().toISOString();

  // If approved and attemptId is linked, ensure attempt is unlocked for re-entry
  if (request.attemptId) {
    const attempt = db.attempts.find(a => a.id === request.attemptId);
    if (attempt) {
      if (status === 'APPROVED') {
        attempt.status = 'in_progress';
        attempt.restartPermission = {
          attemptId: request.attemptId,
          studentId: request.studentId,
          studentName: request.studentName,
          examId: request.examId,
          reason: request.message,
          status: 'granted',
          grantedAt: new Date().toISOString(),
          teacherNote: teacherResponse || 'Approved'
        };
      } else if (status === 'REJECTED') {
        attempt.restartPermission = {
          attemptId: request.attemptId,
          studentId: request.studentId,
          studentName: request.studentName,
          examId: request.examId,
          reason: request.message,
          status: 'rejected',
          grantedAt: new Date().toISOString(),
          teacherNote: teacherResponse || 'Rejected'
        };
      }
      attempt.updated_at = new Date().toISOString();
    }
  }

  writeDB(db);
  res.json({ success: true, request });
});

// ── 11. Results & Marks Management (STEP 5 RESULTS LOGIC) ───────────────────

app.get('/api/results', (req, res) => {
  const { teacherId, studentId, examId, classId, sectionId } = req.query;
  const db = readDB();
  let list = db.results || [];

  if (teacherId) {
    list = list.filter(r => r.teacherId === teacherId);
  }
  if (studentId) {
    list = list.filter(r => r.studentId === studentId);
  }
  if (examId) {
    list = list.filter(r => r.examId === examId);
  }
  if (classId) {
    list = list.filter(r => r.classId === classId);
  }
  if (sectionId) {
    list = list.filter(r => r.sectionId === sectionId);
  }

  res.json({ success: true, results: list });
});

app.get('/api/results/:id', (req, res) => {
  const { id } = req.params;
  const { studentId, teacherId } = req.query;
  const db = readDB();
  const result = (db.results || []).find(r => r.id === id || r.attemptId === id);
  if (!result) return res.status(404).json({ error: 'Result not found.' });

  if (studentId && result.studentId !== studentId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access another candidate\'s examination results.' });
  }

  if (teacherId && result.teacherId !== teacherId) {
    return res.status(403).json({ error: 'Forbidden: You cannot access results for another instructor\'s students.' });
  }

  res.json({ success: true, result });
});

// ── 12. Support Complaints & Feedback Tickets ─────────────────────────────────

app.get('/api/complaints', (req, res) => {
  const { userId, status } = req.query;
  const db = readDB();
  let list = db.complaints || [];

  if (userId) {
    list = list.filter(c => c.userId === userId);
  }
  if (status && status !== 'all') {
    list = list.filter(c => c.status === status);
  }

  res.json({ success: true, complaints: list });
});

app.post('/api/complaints', (req, res) => {
  const { userId, userName, userEmail, userRole, category, subject, description, screenshotUrl } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  const db = readDB();
  const ticketSuffix = Math.floor(1000 + Math.random() * 9000);
  const newComplaint = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ticketNumber: `TICK-${ticketSuffix}`,
    userId: userId || 'unknown-user',
    userName: userName || 'Candidate',
    userEmail: userEmail || '',
    userRole: userRole || 'student',
    category: category || 'General Feedback',
    subject: subject.trim(),
    description: description.trim(),
    screenshotUrl: screenshotUrl || null,
    status: 'Open',
    resolutionNotes: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.complaints) db.complaints = [];
  db.complaints.unshift(newComplaint);
  writeDB(db);

  res.json({ success: true, complaint: newComplaint });
});

app.put('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;
  const db = readDB();
  const complaint = (db.complaints || []).find(c => c.id === id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

  if (status) complaint.status = status;
  if (resolutionNotes !== undefined) complaint.resolutionNotes = resolutionNotes;
  if (status === 'Resolved') {
    complaint.resolvedAt = new Date().toISOString();
  }
  complaint.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, complaint });
});

app.delete('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = (db.complaints || []).findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Complaint not found.' });

  db.complaints.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'Complaint deleted.' });
});

// ── Start Express Server ──────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Exam Fight Chemistry REST Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
