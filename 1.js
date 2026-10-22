

const SUPABASE_URL = "https://rwqutztruyodkdrqztfq.supabase.co";
const SUPABASE_KEY = "sb_publishable_8gp_Xa9qG626mwMsMQ_RHA_oDKU_QBg";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* -------------------------
   صفحه
------------------------- */

function showPage(pageId, button) {

  document.querySelectorAll(".page")
    .forEach(page => page.classList.remove("active"));

  document.getElementById(pageId)
    .classList.add("active");

  document.querySelectorAll(".menu-btn")
    .forEach(btn => btn.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }

  if (pageId === "dashboard") {
    loadDashboard();
  }

  if (pageId === "teachers") {
    loadTeachers();
  }

  if (pageId === "students") {
    loadStudents();
  }

  if (pageId === "parents") {
    loadParents();
  }

  if (pageId === "assignments") {
    loadAssignments();
  }

  if (pageId === "reports") {
    loadReportStudents();
  }
  if (pageId === "academic-exams" || pageId === "academic-attendance" || pageId === "academic-periodic") {
    loadManagerAcademicData();
  }
  if (pageId === "schedule") {
    updateScheduleClasses(false);
    loadSchedule();
  }
  if (pageId === "circulars") {
    updateCircularTarget();
    loadCirculars();
  }
}


/* -------------------------
   پیام
------------------------- */

function showMessage(id, text, type = "success") {

  const el = document.getElementById(id);

  el.className = "message " + type;
  el.textContent = text;

}


/* -------------------------
   بررسی ورود
------------------------- */

async function checkManager() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    location.href = "index.html";
    return;
  }

  const user = session.user;
  currentManagerId = user.id;

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "manager") {

    await supabaseClient.auth.signOut();

    location.href = "index.html";

    return;
  }

  document.getElementById("managerName")
    .textContent = profile.full_name;

  loadDashboard();
}


/* -------------------------
   داشبورد
------------------------- */

async function loadDashboard() {

  const [
    teachers,
    students,
    parents,
    managers
  ] = await Promise.all([
    // شمارش معلم‌های فعال از جدول نقش معلم؛ profiles ممکن است پروفایل‌های قدیمی/حذف‌شده داشته باشد.
    supabaseClient
      .from("teachers")
      .select("user_id", { count: "exact", head: true }),

    // فقط دانش‌آموزهایی شمرده شوند که هنوز فعال‌اند.
    supabaseClient
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("active", true),

    supabaseClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "parent"),

    supabaseClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "manager")
  ]);

  // اگر یک درخواست خطا داشته باشد، خطا را در وضعیت سیستم نشان بدهیم؛ عدد قدیمی/گمراه‌کننده نمایش داده نشود.
  const countErrors = [teachers, students, parents, managers].filter(x => x.error);
  if (countErrors.length) {
    console.error("خطا در دریافت آمار داشبورد:", countErrors.map(x => x.error));
    document.getElementById("systemStatus").textContent =
      "دریافت بخشی از آمار با خطا روبه‌رو شد؛ دسترسی جدول‌ها و ساختار پایگاه داده را بررسی کنید.";
  } else {
    document.getElementById("systemStatus").textContent =
      "سیستم با موفقیت به Supabase متصل است.";
  }

  document.getElementById("teacherCount")
    .textContent = teachers.error ? "—" : (teachers.count ?? 0);

  document.getElementById("studentCount")
    .textContent = students.error ? "—" : (students.count ?? 0);

  document.getElementById("parentCount")
    .textContent = parents.error ? "—" : (parents.count ?? 0);

  document.getElementById("managerCount")
    .textContent = managers.error ? "—" : (managers.count ?? 0);

}


/* -------------------------
   Edge Function
------------------------- */

async function callCreateUser(payload) {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    throw new Error("نشست مدیر منقضی شده است.");
  }

  const response = await fetch(
    SUPABASE_URL + "/functions/v1/create-school-user",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + session.access_token,
        "apikey": SUPABASE_KEY
      },

      body: JSON.stringify(payload)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error ||
      result.message ||
      "خطا در ساخت حساب"
    );
  }

  return result;
}


/* -------------------------
   معلم
------------------------- */

function addTeacherAssignment() {

  const container =
    document.getElementById("teacherAssignments");

  const row =
    document.createElement("div");

  row.className = "assignment";

  row.innerHTML = `

    <div>
      <label>درس</label>
      <input class="ta-subject" placeholder="مثلاً علوم">
    </div>

    <div>
      <label>پایه</label>
      <select class="ta-grade"><option value="نهم">نهم</option></select>
    </div>

    <div>
      <label>کلاس</label>
      <select class="ta-class"><option value="">کلاس را انتخاب کنید</option><option value="شهید الله دادی">شهید الله دادی</option></select>
    </div>

    <button
      class="danger-btn"
      onclick="this.parentElement.remove()"
    >
      حذف
    </button>

  `;

  container.appendChild(row);
}


async function createTeacher() {

  const name =
    document.getElementById("teacherName")
      .value.trim();

  if (!name) {
    showMessage(
      "teacherMessage",
      "نام معلم را وارد کنید.",
      "error"
    );
    return;
  }

  const rows =
    document.querySelectorAll(
      "#teacherAssignments .assignment"
    );

  const assignments = [];

  rows.forEach(row => {

    const subject =
      row.querySelector(".ta-subject").value.trim();

    const grade =
      row.querySelector(".ta-grade").value.trim();

    const className =
      row.querySelector(".ta-class").value.trim();

    if (subject && grade && className) {

      assignments.push({
        subject,
        grade,
        class_name: className
      });

    }

  });

  if (!assignments.length) {

    showMessage(
      "teacherMessage",
      "حداقل یک درس و کلاس وارد کنید.",
      "error"
    );

    return;
  }

  try {

    const result =
      await callCreateUser({

        full_name: name,

        role: "teacher",

        assignments

      });

    showMessage(
      "teacherMessage",
      "معلم با موفقیت ثبت شد."
    );

    document.getElementById("teacherCredentials")
      .style.display = "block";

    document.getElementById("teacherCredentials")
      .innerHTML = `

        <div>نام کاربری:
          <strong>${result.username}</strong>
        </div>

        <div style="margin-top:8px">
          رمز عبور:
          <strong>${result.password}</strong>
        </div>

      `;

    document.getElementById("teacherName").value = "";

    document.getElementById("teacherAssignments")
      .innerHTML = "";

    addTeacherAssignment();

    loadTeachers();

    loadDashboard();

  } catch (error) {

    showMessage(
      "teacherMessage",
      error.message,
      "error"
    );

  }

}


/* -------------------------
   لیست معلم‌ها
------------------------- */

async function loadTeachers() {

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select(`
      id,
      full_name,
      username,
      teachers(
        subject
      )
    `)
    .eq("role", "teacher")
    .order("full_name");

  const tbody =
    document.getElementById("teachersTable");

  tbody.innerHTML = "";

  if (error) {

    tbody.innerHTML =
      `<tr><td colspan="5">${error.message}</td></tr>`;

    return;
  }

  if (!data || !data.length) {

    tbody.innerHTML =
      `<tr><td colspan="5" class="empty">معلم ثبت نشده است.</td></tr>`;

    return;
  }

  const activeTeachers = data.filter(teacher => Array.isArray(teacher.teachers) ? teacher.teachers.length > 0 : !!teacher.teachers);
  if (!activeTeachers.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">معلم فعالی ثبت نشده است.</td></tr>`;
    return;
  }

  activeTeachers.forEach(teacher => {

    const subjects =
      [].concat(teacher.teachers || [])
        .map(x => x.subject)
        .filter(Boolean)
        .join("، ");

    tbody.innerHTML += `

      <tr>

        <td>${escapeHtml(teacher.full_name)}</td>

        <td>${escapeHtml(teacher.username)}</td>

        <td>${escapeHtml(subjects || "-")}</td>
        <td><span class="muted" title="رمزهای Supabase قابل بازیابی نیستند">قابل بازیابی نیست</span></td>
        <td><button class="danger-btn" onclick="deleteTeacher('${teacher.id}', decodeURIComponent('${encodeURIComponent(teacher.full_name || '')}'))">حذف معلم</button></td>

      </tr>

    `;

  });

}


/* -------------------------
   دانش‌آموز
------------------------- */

async function createStudent() {

  const name =
    document.getElementById("studentName")
      .value.trim();

  const grade =
    document.getElementById("studentGrade")
      .value.trim();

  const className =
    document.getElementById("studentClass")
      .value.trim();

  if (!name || !grade || !className) {

    showMessage(
      "studentMessage",
      "همه اطلاعات دانش‌آموز را وارد کنید.",
      "error"
    );

    return;
  }

  try {

    const result =
      await callCreateUser({

        full_name: name,

        role: "student",

        grade,

        class_name: className

      });

    showMessage(
      "studentMessage",
      "دانش‌آموز با موفقیت ثبت شد."
    );

    document.getElementById("studentCredentials")
      .style.display = "block";

    document.getElementById("studentCredentials")
      .innerHTML = `

        <div>
          نام کاربری:
          <strong>${result.username}</strong>
        </div>

        <div style="margin-top:8px">
          رمز عبور:
          <strong>${result.password}</strong>
        </div>

      `;

    document.getElementById("studentName").value = "";
    document.getElementById("studentGrade").value = "";
    document.getElementById("studentClass").value = "";

    loadStudents();
    loadDashboard();

  } catch (error) {

    showMessage(
      "studentMessage",
      error.message,
      "error"
    );

  }

}


/* -------------------------
   لیست دانش‌آموزها
------------------------- */

async function loadStudents() {

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select(`
      id,
      full_name,
      username,
      students!inner(
        grade,
        class_name,
        active
      )
    `)
    .eq("role", "student")
    .eq("students.active", true)
    .order("full_name");

  const tbody =
    document.getElementById("studentsTable");

  tbody.innerHTML = "";

  if (error) {

    tbody.innerHTML =
      `<tr><td colspan="6">${error.message}</td></tr>`;

    return;
  }

  if (!data || !data.length) {

    tbody.innerHTML =
      `<tr><td colspan="6" class="empty">دانش‌آموزی ثبت نشده است.</td></tr>`;

    return;
  }

  data.forEach(student => {

    const info = Array.isArray(student.students) ? student.students[0] : student.students;

    tbody.innerHTML += `

      <tr>

        <td>${escapeHtml(student.full_name)}</td>

        <td>${escapeHtml(student.username)}</td>

        <td>${escapeHtml(info?.grade || "-")}</td>

        <td>${escapeHtml(info?.class_name || "-")}</td>
        <td><span class="muted" title="رمزهای Supabase قابل بازیابی نیستند">قابل بازیابی نیست</span></td>

        <td>
          <button
            class="danger-btn"
            onclick="deleteStudent('${student.id}', decodeURIComponent('${encodeURIComponent(student.full_name || '')}'))"
          >
            حذف
          </button>
        </td>

      </tr>

    `;

  });

}


/* -------------------------
   حذف معلم
------------------------- */
async function deleteTeacher(profileId, teacherName) {
  const ok = confirm(
    `آیا از حذف دسترسی معلم «${teacherName}» مطمئن هستید؟\n\nحساب معلم از فهرست معلمان فعال خارج می‌شود. برای جلوگیری از خراب‌شدن سوابق نمره‌ها و حضور و غیاب، اطلاعات تاریخی حذف نمی‌شوند.`
  );
  if (!ok) return;

  try {
    // حذف مستقیم profiles معمولاً به‌خاطر کلیدهای خارجی سوابق آموزشی شکست می‌خورد.
    // حذف رکورد نقش معلم، دسترسی به پنل معلم را می‌بندد و پروفایل/سوابق تاریخی را نگه می‌دارد.
    const { error: teacherError } = await supabaseClient
      .from('teachers')
      .delete()
      .eq('user_id', profileId);

    if (teacherError) throw teacherError;

    showMessage('teacherMessage', `دسترسی معلم «${teacherName}» برداشته شد. سوابق آموزشی قبلی حفظ شده‌اند.`);
    await loadTeachers();
    await loadDashboard();
    await loadManagerAcademicData();
  } catch (error) {
    showMessage('teacherMessage', 'حذف دسترسی معلم انجام نشد: ' + (error.message || 'خطای نامشخص'), 'error');
  }
}

/* -------------------------
   حذف دانش‌آموز
------------------------- */

async function deleteStudent(profileId, studentName) {
  const ok = confirm(
    `آیا از حذف «${studentName}» مطمئن هستید؟\n\nحساب دانش‌آموز غیرفعال می‌شود و از فهرست فعال‌ها کنار می‌رود. برای حفظ نمره‌ها و کارنامه‌های قبلی، اطلاعات تاریخی از دیتابیس پاک نمی‌شوند.`
  );
  if (!ok) return;
  try {
    // حذف مستقیم profiles با خطای کلید خارجی روبه‌رو می‌شود و ممکن است سابقهٔ تحصیلی را خراب کند.
    // غیرفعال‌سازی باعث می‌شود ورود دانش‌آموز مسدود شود و سوابق مدرسه حفظ شوند.
    const { error } = await supabaseClient
      .from('students')
      .update({ active: false })
      .eq('user_id', profileId);
    if (error) throw error;

    showMessage('studentMessage', `حساب دانش‌آموز «${studentName}» غیرفعال شد و از فهرست فعال‌ها حذف شد.`);
    await loadStudents();
    await loadParentStudents();
    await loadDashboard();
    await loadManagerAcademicData();
  } catch (error) {
    showMessage('studentMessage', 'حذف/غیرفعال‌سازی دانش‌آموز انجام نشد: ' + (error.message || 'خطای نامشخص'), 'error');
  }
}


/* -------------------------
   والد
------------------------- */

async function loadParentStudents() {
  const select = document.getElementById("parentStudent");
  if (!select) return;

  select.innerHTML = `<option value="">در حال دریافت دانش‌آموزان...</option>`;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select(`
      id,
      full_name,
      students!inner(
        id,
        grade,
        class_name
      )
    `)
    .eq("role", "student")
    .order("full_name");

  select.innerHTML = `<option value="">انتخاب دانش‌آموز</option>`;

  if (error) {
    select.innerHTML = `<option value="">خطا در دریافت دانش‌آموزان</option>`;
    showMessage("parentMessage", `دریافت فهرست دانش‌آموزان ناموفق بود: ${error.message}`, "error");
    return;
  }

  (data || []).forEach(profile => {
    const studentRows = Array.isArray(profile.students)
      ? profile.students
      : (profile.students ? [profile.students] : []);

    studentRows.forEach(studentRecord => {
      // parent_students.student_id references students.id (BIGINT),
      // not profiles.id (UUID). Keep the numeric student table ID here.
      const option = document.createElement("option");
      option.value = String(studentRecord.id);
      const classLabel = [studentRecord.grade, studentRecord.class_name].filter(Boolean).join(" · ");
      option.textContent = `${profile.full_name || "دانش‌آموز"}${classLabel ? " — " + classLabel : ""}`;
      select.appendChild(option);
    });
  });

  if (select.options.length === 1) {
    select.innerHTML = `<option value="">ابتدا یک دانش‌آموز ثبت کنید</option>`;
  }
}


async function createParent() {
  const name = document.getElementById("parentName").value.trim();
  const studentId = document.getElementById("parentStudent").value;
  if (!name || !studentId) {
    showMessage("parentMessage", "نام والد و دانش‌آموز را انتخاب کنید.", "error");
    return;
  }

  const submitButton = document.querySelector('#parents button[onclick="createParent()"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.dataset.originalText = submitButton.textContent;
    submitButton.textContent = "در حال ثبت...";
  }

  let createdAccount = null;
  try {
    createdAccount = await callCreateUser({ full_name: name, role: "parent" });

    const credentials = document.getElementById("parentCredentials");
    credentials.style.display = "block";
    credentials.innerHTML = `
      <div>نام کاربری: <strong>${escapeHtml(createdAccount.username || "")}</strong></div>
      <div style="margin-top:8px">رمز عبور: <strong>${escapeHtml(createdAccount.password || "")}</strong></div>
    `;

    const { error: linkError } = await supabaseClient
      .from("parent_students")
      .insert({ parent_user_id: createdAccount.user_id, student_id: studentId });

    if (linkError) {
      showMessage("parentMessage", `حساب والد ساخته شد، اما اتصال به دانش‌آموز انجام نشد: ${linkError.message}. اطلاعات ورود بالا را نگه دار و سیاست دسترسی جدول parent_students را بررسی کن.`, "error");
      await loadParents();
      await loadDashboard();
      return;
    }

    showMessage("parentMessage", "حساب والد ساخته شد و به دانش‌آموز انتخاب‌شده متصل شد.");
    document.getElementById("parentName").value = "";
    document.getElementById("parentStudent").value = "";
    await loadParents();
    await loadParentStudents();
    await loadDashboard();
  } catch (error) {
    if (createdAccount && createdAccount.user_id) {
      showMessage("parentMessage", `حساب والد ساخته شده است، اما مرحلهٔ بعدی با خطا روبه‌رو شد: ${error.message || "خطای نامشخص"}. اطلاعات ورود بالا را نگه دار.`, "error");
      try { await loadParents(); } catch (_) {}
      try { await loadDashboard(); } catch (_) {}
    } else {
      showMessage("parentMessage", error.message || "ساخت حساب والد انجام نشد.", "error");
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = submitButton.dataset.originalText || "ثبت والد";
      delete submitButton.dataset.originalText;
    }
  }
}

/* -------------------------
   لیست والدین
------------------------- */

async function loadParents() {

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select(`
      id,
      full_name,
      username
    `)
    .eq("role", "parent")
    .order("full_name");

  const tbody =
    document.getElementById("parentsTable");

  tbody.innerHTML = "";

  if (error) {

    tbody.innerHTML =
      `<tr><td colspan="3">${escapeHtml(error.message)}</td></tr>`;

    return;
  }

  if (!data || !data.length) {

    tbody.innerHTML =
      `<tr><td colspan="3" class="empty">والدی ثبت نشده است.</td></tr>`;

    return;
  }

  data.forEach(parent => {

    tbody.innerHTML += `

      <tr>
        <td>${escapeHtml(parent.full_name || '')}</td>
        <td>${escapeHtml(parent.username || '')}</td>
        <td><button class="danger-btn" type="button" onclick="deleteParent('${parent.id}', decodeURIComponent('${encodeURIComponent(parent.full_name || '')}'))">حذف والد</button></td>
      </tr>

    `;

  });

}


/* -------------------------
   حذف والد
------------------------- */
async function deleteParent(profileId, parentName) {
  const ok = confirm(
    `آیا از حذف دسترسی والد «${parentName}» مطمئن هستید؟\n\nارتباط والد با دانش‌آموزان حذف می‌شود و سپس تلاش می‌شود حساب والد نیز حذف شود. سوابق آموزشی دانش‌آموزان حذف نمی‌شوند.`
  );
  if (!ok) return;

  try {
    // ابتدا ارتباط‌های والد با دانش‌آموزان را حذف می‌کنیم.
    const { error: relationError } = await supabaseClient
      .from('parent_students')
      .delete()
      .eq('parent_user_id', profileId);
    if (relationError) throw relationError;

    // سپس حساب والد را حذف می‌کنیم. اگر وابستگی دیگری مانع شود، خطای دیتابیس نمایش داده می‌شود.
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', profileId)
      .eq('role', 'parent');
    if (profileError) throw profileError;

    showMessage('parentMessage', `حساب والد «${parentName}» حذف شد.`);
    await loadParents();
    await loadParentStudents();
    await loadDashboard();
  } catch (error) {
    showMessage(
      'parentMessage',
      'حذف والد کامل نشد: ' + (error.message || 'خطای نامشخص') + '؛ اگر ارتباط والد حذف شده باشد، ممکن است لازم باشد صفحه را تازه‌سازی کنید و سیاست RLS/وابستگی‌های دیتابیس بررسی شود.',
      'error'
    );
    await loadParents();
  }
}


/* -------------------------
   تخصیص درس
------------------------- */

async function loadAssignmentTeachers() {

  const {
    data
  } = await supabaseClient
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .order("full_name");

  const select =
    document.getElementById("assignmentTeacher");

  select.innerHTML =
    `<option value="">انتخاب معلم</option>`;

  (data || []).forEach(teacher => {

    select.innerHTML += `

      <option value="${teacher.id}">
        ${escapeHtml(teacher.full_name)}
      </option>

    `;

  });

}


async function addAssignment() {

  const userId =
    document.getElementById("assignmentTeacher")
      .value;

  const subject =
    document.getElementById("assignmentSubject")
      .value.trim();

  const grade =
    document.getElementById("assignmentGrade")
      .value.trim();

  const className =
    document.getElementById("assignmentClass")
      .value.trim();

  if (!userId || !subject || !grade || !className) {

    showMessage(
      "assignmentMessage",
      "همه اطلاعات را وارد کنید.",
      "error"
    );

    return;
  }

  const {
    data: teacher,
    error: teacherError
  } = await supabaseClient
    .from("teachers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (teacherError) {

    showMessage(
      "assignmentMessage",
      teacherError.message,
      "error"
    );

    return;
  }

  const {
    error
  } = await supabaseClient
    .from("teacher_assignments")
    .insert({

      teacher_id: teacher.id,

      subject,

      grade,

      class_name: className

    });

  if (error) {

    showMessage(
      "assignmentMessage",
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "assignmentMessage",
    "تخصیص با موفقیت ثبت شد."
  );

  document.getElementById("assignmentSubject").value = "";
  document.getElementById("assignmentGrade").value = "";
  document.getElementById("assignmentClass").value = "";

  loadAssignments();

}


async function loadAssignments() {

  await loadAssignmentTeachers();

  const {
    data,
    error
  } = await supabaseClient
    .from("teacher_assignments")
    .select(`
      subject,
      grade,
      class_name,
      teachers(
        profiles(
          full_name
        )
      )
    `);

  const tbody =
    document.getElementById("assignmentsTable");

  tbody.innerHTML = "";

  if (error) {

    tbody.innerHTML =
      `<tr><td colspan="4">${error.message}</td></tr>`;

    return;
  }

  if (!data || !data.length) {

    tbody.innerHTML =
      `<tr><td colspan="4" class="empty">تخصیصی وجود ندارد.</td></tr>`;

    return;
  }

  data.forEach(item => {

    const teacher =
      item.teachers?.profiles?.full_name || "-";

    tbody.innerHTML += `

      <tr>

        <td>${escapeHtml(teacher)}</td>

        <td>${escapeHtml(item.subject)}</td>

        <td>${escapeHtml(item.grade)}</td>

        <td>${escapeHtml(item.class_name)}</td>

      </tr>

    `;

  });

}


/* -------------------------
   کارنامه
------------------------- */

async function loadReportStudents() {

  const {
    data
  } = await supabaseClient
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name");

  const select =
    document.getElementById("reportStudent");

  select.innerHTML =
    `<option value="">انتخاب دانش‌آموز</option>`;

  (data || []).forEach(student => {

    select.innerHTML += `

      <option value="${student.id}">
        ${escapeHtml(student.full_name)}
      </option>

    `;

  });

}


function updateReportScope() {

  const scope =
    document.getElementById("reportScope").value;

  document.getElementById("reportStudentBox")
    .style.display =
      scope === "student"
        ? "block"
        : "none";

  document.getElementById("reportClassBox")
    .style.display =
      scope === "class"
        ? "block"
        : "none";

}


async function createReportCards() {

  const type =
    document.getElementById("reportType").value;

  const scope =
    document.getElementById("reportScope").value;

  if (scope === "student") {

    const studentUserId =
      document.getElementById("reportStudent").value;

    if (!studentUserId) {

      showMessage(
        "reportMessage",
        "دانش‌آموز را انتخاب کنید.",
        "error"
      );

      return;
    }

    const {
      data: student
    } = await supabaseClient
      .from("students")
      .select("id")
      .eq("user_id", studentUserId)
      .single();

    if (!student) {

      showMessage(
        "reportMessage",
        "اطلاعات دانش‌آموز پیدا نشد.",
        "error"
      );

      return;
    }

    const {
      error
    } = await supabaseClient
      .from("report_cards")
      .insert({

        student_id: student.id,

        report_type: type,

        published: false

      });

    if (error) {

      showMessage(
        "reportMessage",
        error.message,
        "error"
      );

      return;
    }

    showMessage(
      "reportMessage",
      "کارنامه برای دانش‌آموز ایجاد شد."
    );

    return;
  }


  if (scope === "class") {

    const className =
      document.getElementById("reportClass")
        .value.trim();

    if (!className) {

      showMessage(
        "reportMessage",
        "نام کلاس را وارد کنید.",
        "error"
      );

      return;
    }

    const {
      data: students
    } = await supabaseClient
      .from("students")
      .select("id, class_name")
      .eq("class_name", className);

    if (!students || !students.length) {

      showMessage(
        "reportMessage",
        "دانش‌آموزی در این کلاس پیدا نشد.",
        "error"
      );

      return;
    }

    const rows =
      students.map(student => ({

        student_id: student.id,

        report_type: type,

        published: false

      }));

    const {
      error
    } = await supabaseClient
      .from("report_cards")
      .insert(rows);

    if (error) {

      showMessage(
        "reportMessage",
        error.message,
        "error"
      );

      return;
    }

    showMessage(
      "reportMessage",
      "کارنامه برای کل کلاس ایجاد شد."
    );

    return;
  }


  if (scope === "school") {

    const {
      data: students
    } = await supabaseClient
      .from("students")
      .select("id");

    if (!students || !students.length) {

      showMessage(
        "reportMessage",
        "هیچ دانش‌آموزی وجود ندارد.",
        "error"
      );

      return;
    }

    const rows =
      students.map(student => ({

        student_id: student.id,

        report_type: type,

        published: false

      }));

    const {
      error
    } = await supabaseClient
      .from("report_cards")
      .insert(rows);

    if (error) {

      showMessage(
        "reportMessage",
        error.message,
        "error"
      );

      return;
    }

    showMessage(
      "reportMessage",
      "کارنامه برای کل مدرسه ایجاد شد."
    );

  }

}


/* -------------------------
   تغییر رمز
------------------------- */

async function changePassword() {

  const password =
    document.getElementById("newPassword")
      .value;

  const confirm =
    document.getElementById("confirmPassword")
      .value;

  if (password.length < 6) {

    showMessage(
      "passwordMessage",
      "رمز عبور باید حداقل ۶ کاراکتر باشد.",
      "error"
    );

    return;
  }

  if (password !== confirm) {

    showMessage(
      "passwordMessage",
      "دو رمز عبور یکسان نیستند.",
      "error"
    );

    return;
  }

  const {
    error
  } = await supabaseClient.auth
    .updateUser({
      password
    });

  if (error) {

    showMessage(
      "passwordMessage",
      error.message,
      "error"
    );

    return;
  }

  showMessage(
    "passwordMessage",
    "رمز عبور با موفقیت تغییر کرد."
  );

  document.getElementById("newPassword").value = "";
  document.getElementById("confirmPassword").value = "";

}


/* -------------------------
   خروج
------------------------- */

async function logout() {

  const btn = document.querySelector(".logout");
  if (btn) btn.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signOut({ scope: "global" });
    if (error) throw error;
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    location.replace("index.html");
  }

}


/* -------------------------
   جلوگیری از HTML Injection
------------------------- */


/* ===== عملیات آموزشی مدیر ===== */
let managerAcademicAssignments=[];
let managerAcademicStudents=[];
let managerAcademicExams=[];
let managerAcademicActive=null;
async function managerNotifyAcademic(a,title,body,type){if(!a||!window.SchoolLive?.schedule?.notifyClass)return;try{await window.SchoolLive.schedule.notifyClass(supabaseClient,a.grade,a.class_name,title,body,type||'academic');}catch(e){console.warn('ثبت اعلان انجام نشد:',e);}}

async function loadManagerAcademicData(){
  const r=await supabaseClient.from('teacher_assignments').select('id,teacher_id,subject,grade,class_name,teachers!inner(id,user_id)').order('grade').order('class_name');
  if(r.error){console.error(r.error);return;}
  const teacherIds=[...new Set((r.data||[]).map(x=>x.teacher_id))];
  let names={};
  if(teacherIds.length){const tr=await supabaseClient.from('profiles').select('id,full_name').in('id',(r.data||[]).map(x=>x.teachers?.user_id).filter(Boolean));if(!tr.error)names=Object.fromEntries((tr.data||[]).map(x=>[x.id,x.full_name]));}
  managerAcademicAssignments=(r.data||[]).map(a=>({...a,teacher_name:names[a.teachers?.user_id]||'بدون نام'}));
  ['academicExamAssignment','academicAttendanceAssignment','academicPeriodicAssignment'].forEach(id=>{const sel=document.getElementById(id);if(!sel)return;sel.innerHTML='<option value="">انتخاب معلم و کلاس...</option>'+managerAcademicAssignments.map(a=>`<option value="${a.id}">${escapeHtml(a.teacher_name)} — ${escapeHtml(a.subject||'')} — ${escapeHtml(a.grade)} — ${escapeHtml(a.class_name)}</option>`).join('');});
}
function getManagerAcademicAssignment(type){const id=document.getElementById(type==='exam'?'academicExamAssignment':type==='attendance'?'academicAttendanceAssignment':'academicPeriodicAssignment')?.value;return managerAcademicAssignments.find(a=>String(a.id)===String(id))||null;}
async function managerAcademicClassChanged(type){const a=getManagerAcademicAssignment(type);managerAcademicActive=a;const p=type==='exam'?'academicExam':type==='attendance'?'academicAttendance':'academicPeriodic';document.getElementById(p+'Grade').value=a?.grade||'';document.getElementById(p+'Class').value=a?.class_name||'';if(!a)return;await managerLoadAcademicStudents(a);if(type==='exam')await managerLoadExams();if(type==='attendance')managerRenderAttendance();if(type==='periodic')await managerRenderPeriodic();}
async function managerLoadAcademicStudents(a){const r=await supabaseClient.from('profiles').select('id,full_name,username,students!inner(id,grade,class_name)').eq('role','student').eq('students.grade',a.grade).eq('students.class_name',a.class_name).order('full_name');if(r.error){managerAcademicStudents=[];console.error(r.error);return;}managerAcademicStudents=(r.data||[]).map(x=>({profile_id:x.id,name:x.full_name,username:x.username,student:Array.isArray(x.students)?x.students[0]:x.students}));}
async function managerCreateExam(){
  const a=getManagerAcademicAssignment('exam');
  if(!a)return showMessage('academicExamMessage','ابتدا معلم و کلاس را انتخاب کنید.','error');
  const title=document.getElementById('managerExamTitle').value.trim();
  if(!title)return showMessage('academicExamMessage','عنوان امتحان را وارد کنید.','error');
  const payload={teacher_id:a.teacher_id,subject:a.subject,grade:a.grade,class_name:a.class_name,title,exam_date:document.getElementById('managerExamDate').value||null,max_score:Number(document.getElementById('managerExamMax').value||20)};
  const r=await supabaseClient.from('exams').insert(payload).select().single();
  if(r.error)return showMessage('academicExamMessage',r.error.message,'error');
  document.getElementById('managerExamTitle').value='';
  showMessage('academicExamMessage','امتحان ایجاد شد.');
  await managerNotifyAcademic(a,'امتحان جدید: '+title,`برای کلاس ${a.grade} ${a.class_name} امتحان «${title}» ثبت شد.`,'exam');
  await managerLoadExams();
  await managerOpenScores(r.data.id);
}
async function managerLoadExams(){
  const box=document.getElementById('managerExamList');
  if(!box)return;
  const a=getManagerAcademicAssignment('exam');
  if(!a){box.innerHTML='<div class="muted">ابتدا یک کلاس را انتخاب کنید.</div>';return;}
  const r=await supabaseClient.from('exams').select('*').eq('teacher_id',a.teacher_id).eq('subject',a.subject).eq('grade',a.grade).eq('class_name',a.class_name).order('exam_date',{ascending:false});
  if(r.error){box.innerHTML=escapeHtml(r.error.message);return;}
  managerAcademicExams=r.data||[];
  box.innerHTML=managerAcademicExams.length?`<table><thead><tr><th>عنوان</th><th>تاریخ</th><th>حداکثر نمره</th><th>عملیات</th></tr></thead><tbody>${managerAcademicExams.map(e=>`<tr><td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.exam_date||'-')}</td><td>${escapeHtml(e.max_score)}</td><td><button class="secondary-btn" onclick="managerOpenScores('${e.id}')">ثبت / ویرایش نمره</button></td></tr>`).join('')}</tbody></table>`:'<div class="muted">امتحانی برای این کلاس ثبت نشده است.</div>';
}
async function managerOpenScores(id){
  const e=managerAcademicExams.find(x=>String(x.id)===String(id))||((await supabaseClient.from('exams').select('*').eq('id',id).single()).data);
  if(!e)return;
  const sr=await supabaseClient.from('exam_scores').select('student_id,score').eq('exam_id',e.id);
  if(sr.error)return showMessage('academicExamMessage',sr.error.message,'error');
  const map=new Map((sr.data||[]).map(x=>[String(x.student_id),x.score]));
  document.getElementById('managerScorePanel').classList.remove('hidden');
  document.getElementById('managerScoreTitle').textContent=e.title+' — نمره از '+e.max_score;
  document.getElementById('managerScoreTable').innerHTML=`<table><thead><tr><th>دانش‌آموز</th><th>نام کاربری</th><th>نمره</th></tr></thead><tbody>${managerAcademicStudents.map(s=>`<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.username)}</td><td><input class="manager-score-input" data-student="${s.student.id}" type="number" min="0" max="${e.max_score}" step="0.01" value="${map.get(String(s.student.id))??''}"></td></tr>`).join('')}</tbody></table>`;
  document.getElementById('managerScorePanel').dataset.exam=e.id;
}
async function managerSaveScores(){
  const examId=document.getElementById('managerScorePanel').dataset.exam;
  if(!examId)return;
  const rows=[...document.querySelectorAll('.manager-score-input')].filter(x=>x.value!=='').map(x=>({exam_id:examId,student_id:Number(x.dataset.student),score:Number(x.value)}));
  if(!rows.length)return showMessage('managerScoreMessage','حداقل یک نمره وارد کنید.','error');
  for(const row of rows){
    const existing=await supabaseClient.from('exam_scores').select('id').eq('exam_id',row.exam_id).eq('student_id',row.student_id).maybeSingle();
    if(existing.error)return showMessage('managerScoreMessage',existing.error.message,'error');
    const r=existing.data?await supabaseClient.from('exam_scores').update({score:row.score}).eq('id',existing.data.id):await supabaseClient.from('exam_scores').insert(row);
    if(r.error)return showMessage('managerScoreMessage',r.error.message,'error');
  }
  showMessage('managerScoreMessage','نمره‌ها با موفقیت ذخیره شدند.');
  const a=getManagerAcademicAssignment('exam'); if(a) await managerNotifyAcademic(a,'ثبت یا ویرایش نمره‌ها','نمره‌های امتحان برای کلاس '+a.grade+' '+a.class_name+' ثبت یا ویرایش شد.','grade');
}
function managerRenderAttendance(){
  const box=document.getElementById('managerAttendanceTable');
  if(!box)return;
  if(!managerAcademicActive){box.innerHTML='<div class="muted">ابتدا یک کلاس را انتخاب کنید.</div>';return;}
  box.innerHTML=`<div style="max-width:250px;margin-bottom:15px"><label>تاریخ</label><input id="managerAttendanceDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><table><thead><tr><th>دانش‌آموز</th><th>نام کاربری</th><th>وضعیت</th></tr></thead><tbody>${managerAcademicStudents.map(s=>`<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.username)}</td><td><select class="manager-att-status" data-student="${s.student.id}"><option value="حاضر">حاضر</option><option value="غایب">غایب</option><option value="موجه">موجه</option><option value="تاخیر">تأخیر</option></select></td></tr>`).join('')}</tbody></table>`;
}
async function managerSaveAttendance(){
  const a=getManagerAcademicAssignment('attendance');
  if(!a)return showMessage('academicAttendanceMessage','ابتدا کلاس را انتخاب کنید.','error');
  const date=document.getElementById('managerAttendanceDate')?.value;
  if(!date)return showMessage('academicAttendanceMessage','تاریخ را انتخاب کنید.','error');
  const rows=[...document.querySelectorAll('.manager-att-status')].map(x=>({student_id:Number(x.dataset.student),teacher_id:a.teacher_id,attendance_date:date,status:x.value}));
  const del=await supabaseClient.from('attendance').delete().eq('teacher_id',a.teacher_id).eq('attendance_date',date).in('student_id',rows.map(x=>x.student_id));
  if(del.error)return showMessage('academicAttendanceMessage',del.error.message,'error');
  const r=await supabaseClient.from('attendance').insert(rows);
  if(r.error)return showMessage('academicAttendanceMessage',r.error.message,'error');
  showMessage('academicAttendanceMessage','حضور و غیاب ذخیره شد.');
  await managerNotifyAcademic(a,'ثبت حضور و غیاب','حضور و غیاب کلاس '+a.grade+' '+a.class_name+' برای تاریخ '+date+' ثبت شد.','attendance');
}
async function managerRenderPeriodic(){
  const box=document.getElementById('managerPeriodicTable');
  if(!box)return;
  const a=getManagerAcademicAssignment('periodic');
  if(!a){box.innerHTML='<div class="muted">ابتدا یک کلاس را انتخاب کنید.</div>';return;}
  const r=await supabaseClient.from('periodic_grades').select('student_id,grade').eq('teacher_id',a.teacher_id).eq('subject',a.subject||'').eq('term','دوره‌ای');
  if(r.error)return showMessage('academicPeriodicMessage',r.error.message,'error');
  const map=new Map((r.data||[]).map(x=>[String(x.student_id),x.grade]));
  box.innerHTML=`<table><thead><tr><th>دانش‌آموز</th><th>نام کاربری</th><th>نمره دوره‌ای</th></tr></thead><tbody>${managerAcademicStudents.map(s=>`<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.username)}</td><td><input class="manager-periodic-input" data-student="${s.student.id}" type="number" min="0" max="20" step="0.01" value="${map.get(String(s.student.id))??''}"></td></tr>`).join('')}</tbody></table>`;
}
async function managerSavePeriodic(){
  const a=getManagerAcademicAssignment('periodic');
  if(!a)return showMessage('academicPeriodicMessage','ابتدا کلاس را انتخاب کنید.','error');
  const rows=[...document.querySelectorAll('.manager-periodic-input')].filter(x=>x.value!=='').map(x=>({student_id:Number(x.dataset.student),teacher_id:a.teacher_id,subject:a.subject||'',term:'دوره‌ای',grade:Number(x.value)}));
  if(!rows.length)return showMessage('academicPeriodicMessage','حداقل یک نمره وارد کنید.','error');
  for(const row of rows){
    const existing=await supabaseClient.from('periodic_grades').select('id').eq('student_id',row.student_id).eq('teacher_id',row.teacher_id).eq('subject',row.subject).eq('term',row.term).maybeSingle();
    if(existing.error)return showMessage('academicPeriodicMessage',existing.error.message,'error');
    const r=existing.data?await supabaseClient.from('periodic_grades').update({grade:row.grade}).eq('id',existing.data.id):await supabaseClient.from('periodic_grades').insert(row);
    if(r.error)return showMessage('academicPeriodicMessage',r.error.message,'error');
  }
  showMessage('academicPeriodicMessage','نمرات دوره‌ای ذخیره شدند.');
  await managerNotifyAcademic(a,'ثبت نمره‌های دوره‌ای','نمره‌های دوره‌ای کلاس '+a.grade+' '+a.class_name+' ثبت یا ویرایش شد.','grade');
}

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* -------------------------
   شروع
------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    addTeacherAssignment();

    await checkManager();

    await loadParentStudents();

  }
);


/* قابلیت‌های تکمیلی: برنامه هفتگی و بخش‌نامه‌ها */
let currentManagerId = null;
const schoolDays = {1:'شنبه',2:'یکشنبه',3:'دوشنبه',4:'سه‌شنبه',5:'چهارشنبه',6:'پنجشنبه'};
const schoolClasses = {'نهم':['شهید الله دادی']};
function fillClassSelect(id, grade){const el=document.getElementById(id);if(!el)return;const arr=schoolClasses[grade]||[];const old=el.value;el.innerHTML=arr.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');if(arr.includes(old))el.value=old;}
function updateScheduleClasses(shouldLoad=true){fillClassSelect('scheduleClass',document.getElementById('scheduleGrade')?.value||'نهم');if(shouldLoad)loadSchedule();}
function updateCircularClassOptions(){fillClassSelect('circularClass',document.getElementById('circularGrade')?.value||'نهم');}
function updateCircularTarget(){const scope=document.getElementById('circularScope')?.value||'school';document.getElementById('circularGradeWrap')?.classList.toggle('hidden',scope==='school');document.getElementById('circularClassWrap')?.classList.toggle('hidden',scope!=='class');updateCircularClassOptions();}
function scheduleMessage(t,err=false){showMessage('scheduleMessage',t,err?'error':'success');}
async function loadSchedule(){const box=document.getElementById('scheduleTable');if(!box)return;const grade=document.getElementById('scheduleGrade')?.value||'نهم';const cls=document.getElementById('scheduleClass')?.value||'';if(!cls){box.innerHTML='<p class="muted">ابتدا کلاس را انتخاب کنید.</p>';return;}const r=await supabaseClient.from('school_timetable').select('*').eq('grade',grade).eq('class_name',cls).order('day_number').order('period');if(r.error){box.innerHTML='<p class="muted">برای فعال‌شدن برنامه هفتگی، فایل SQL همراه پروژه را در SQL Editor سوپابیس اجرا کنید.<br>'+escapeHtml(r.error.message)+'</p>';return;}const rows=r.data||[];box.innerHTML=rows.length?`<table><thead><tr><th>روز</th><th>زنگ</th><th>زمان</th><th>درس</th><th>دبیر</th><th>حذف</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${schoolDays[x.day_number]||'—'}</td><td>${escapeHtml(x.period)}</td><td>${escapeHtml(String(x.start_time||'').slice(0,5))} تا ${escapeHtml(String(x.end_time||'').slice(0,5))}</td><td>${escapeHtml(x.subject)}</td><td>${escapeHtml(x.teacher_name||'—')}</td><td><button class="danger-btn" onclick="deleteScheduleItem('${x.id}')">حذف</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">برای این کلاس هنوز برنامه‌ای ثبت نشده است.</p>';}
async function saveScheduleItem(){const grade=document.getElementById('scheduleGrade').value,cls=document.getElementById('scheduleClass').value,day=Number(document.getElementById('scheduleDay').value),period=Number(document.getElementById('schedulePeriod').value),subject=document.getElementById('scheduleSubject').value.trim(),teacher=document.getElementById('scheduleTeacher').value.trim(),start=document.getElementById('scheduleStart').value,end=document.getElementById('scheduleEnd').value;if(!grade||!cls||!subject||!start||!end)return scheduleMessage('پایه، کلاس، درس و ساعت شروع و پایان را تکمیل کنید.',true);if(start>=end)return scheduleMessage('ساعت پایان باید بعد از ساعت شروع باشد.',true);const row={grade,class_name:cls,day_number:day,period,subject,teacher_name:teacher||null,start_time:start,end_time:end,updated_by:currentManagerId,updated_at:new Date().toISOString()};const r=await supabaseClient.from('school_timetable').upsert(row,{onConflict:'grade,class_name,day_number,period'});if(r.error)return scheduleMessage('ثبت برنامه انجام نشد: '+r.error.message,true);document.getElementById('scheduleSubject').value='';document.getElementById('scheduleTeacher').value='';scheduleMessage('برنامه هفتگی ذخیره شد.');await loadSchedule();}
async function deleteScheduleItem(id){if(!confirm('این زنگ از برنامه هفتگی حذف شود؟'))return;const r=await supabaseClient.from('school_timetable').delete().eq('id',id);if(r.error)return scheduleMessage('حذف انجام نشد: '+r.error.message,true);scheduleMessage('زنگ حذف شد.');await loadSchedule();}
function circularTargetLabel(x){if(x.target_scope==='school')return 'کل مدرسه';if(x.target_scope==='grade')return 'پایه '+(x.grade||'—');return (x.grade||'')+' — '+(x.class_name||'');}
async function loadCirculars(){const box=document.getElementById('circularList');if(!box)return;const r=await supabaseClient.from('school_circulars').select('*').order('created_at',{ascending:false}).limit(60);if(r.error){box.innerHTML='<p class="muted">برای انتشار بخش‌نامه، فایل SQL همراه پروژه را در Supabase اجرا کنید.<br>'+escapeHtml(r.error.message)+'</p>';return;}const rows=r.data||[];box.innerHTML=rows.length?rows.map(x=>`<article class="circular-item"><strong>${escapeHtml(x.title)}</strong><div style="white-space:pre-wrap;line-height:1.9;margin-top:8px">${escapeHtml(x.body)}</div><div class="circular-meta">مخاطب: ${escapeHtml(circularTargetLabel(x))} · هفته: ${escapeHtml(x.week_start||'—')} · وضعیت: ${x.is_published?'منتشر شده':'پیش‌نویس'}</div><button class="danger-btn" style="margin-top:9px" onclick="deleteCircular('${x.id}')">حذف بخش‌نامه</button></article>`).join(''):'<p class="muted">هنوز بخش‌نامه‌ای ثبت نشده است.</p>';}
async function publishCircular(){const title=document.getElementById('circularTitle').value.trim(),body=document.getElementById('circularBody').value.trim(),week=document.getElementById('circularWeek').value,scope=document.getElementById('circularScope').value,grade=document.getElementById('circularGrade').value,cls=document.getElementById('circularClass').value;if(!title||!body||!week)return showMessage('circularMessage','عنوان، متن و شروع هفته را وارد کنید.','error');if(scope==='grade'&&!grade)return showMessage('circularMessage','پایه را انتخاب کنید.','error');if(scope==='class'&&(!grade||!cls))return showMessage('circularMessage','پایه و کلاس را انتخاب کنید.','error');const row={title,body,week_start:week,target_scope:scope,grade:scope==='school'?null:grade,class_name:scope==='class'?cls:null,is_published:true,created_by:currentManagerId,published_at:new Date().toISOString()};const r=await supabaseClient.from('school_circulars').insert(row);if(r.error)return showMessage('circularMessage','انتشار انجام نشد: '+r.error.message,'error');document.getElementById('circularTitle').value='';document.getElementById('circularBody').value='';showMessage('circularMessage','بخش‌نامه منتشر شد و برای مخاطبان انتخاب‌شده قابل مشاهده است.');await loadCirculars();}
async function deleteCircular(id){if(!confirm('این بخش‌نامه حذف شود؟'))return;const r=await supabaseClient.from('school_circulars').delete().eq('id',id);if(r.error)return showMessage('circularMessage','حذف انجام نشد: '+r.error.message,'error');showMessage('circularMessage','بخش‌نامه حذف شد.');await loadCirculars();}


