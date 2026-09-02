// ======================================================
// PUA UniTrack - ADMIN DASHBOARD
// ======================================================

const API = "/api";


// ======================================================
// ELEMENTS
// ======================================================

const pendingContainer =
  document.getElementById("pending");

const allDoctorsContainer =
  document.getElementById("allDoctors");

const pendingCount =
  document.getElementById("pendingCount");

const refreshButton =
  document.getElementById("refresh");

const logoutButton =
  document.getElementById("logout");


// ======================================================
// AUTH
// ======================================================

const token = localStorage.getItem("pua_token");

if (!token) {
  window.location.href = "/login.html";
}


// ======================================================
// API HELPER
// ======================================================

async function apiFetch(url, options = {}) {

  const response = await fetch(
    `${API}${url}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...(options.headers || {})
      }
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {

    if (response.status === 401 ||
        response.status === 403) {

      localStorage.removeItem("pua_token");
      localStorage.removeItem("pua_user");

      window.location.href = "/login.html";

      return;
    }

    throw new Error(
      data.message || "Request failed."
    );
  }

  return data;
}


// ======================================================
// CHECK ADMIN
// ======================================================

async function checkAdmin() {

  try {

    const data =
      await apiFetch("/me");

    if (!data?.user ||
        data.user.role !== "ADMIN") {

      alert("Administrator access required.");

      localStorage.removeItem("pua_token");
      localStorage.removeItem("pua_user");

      window.location.href = "/login.html";

      return false;
    }

    return true;

  } catch (error) {

    console.error(error);

    alert("Could not verify administrator account.");

    return false;
  }
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// LOAD PENDING DOCTORS
// ======================================================

async function loadPendingDoctors() {

  pendingContainer.innerHTML =
    "<p>Loading...</p>";

  try {

    const doctors =
      await apiFetch("/admin/pending-doctors");

    pendingCount.textContent =
      `${doctors.length} waiting for approval`;

    if (!doctors.length) {

      pendingContainer.innerHTML =
        `<p class="empty-state">
          No pending accounts.
        </p>`;

      return;
    }

    pendingContainer.innerHTML =
      doctors.map(renderPendingDoctor).join("");

  } catch (error) {

    console.error(error);

    pendingContainer.innerHTML =
      `<p class="error-state">
        ${escapeHTML(error.message)}
      </p>`;
  }
}


// ======================================================
// RENDER PENDING DOCTOR
// ======================================================

function renderPendingDoctor(user) {

  const doctor =
    user.doctor || {};

  const subjects =
    doctor.subjects || [];

  const subjectText =
    subjects.length
      ? subjects
          .map(subject => subject.name)
          .join(", ")
      : "No subjects added";

  return `
    <article class="admin-row">

      <div class="admin-info">

        <strong>
          ${escapeHTML(user.name)}
        </strong>

        <small>
          ${escapeHTML(user.email)}
        </small>

        <small>
          ${escapeHTML(subjectText)}
        </small>

      </div>

      <div class="admin-actions">

        <button
          class="small-btn approve-btn"
          data-id="${escapeHTML(user.id)}"
        >
          Approve
        </button>

        <button
          class="small-btn danger-btn reject-btn"
          data-id="${escapeHTML(user.id)}"
        >
          Reject
        </button>

      </div>

    </article>
  `;
}


// ======================================================
// LOAD ALL DOCTORS
// ======================================================

async function loadAllDoctors() {

  allDoctorsContainer.innerHTML =
    "<p>Loading...</p>";

  try {

    const doctors =
      await apiFetch("/admin/doctors");

    if (!doctors.length) {

      allDoctorsContainer.innerHTML =
        `<p class="empty-state">
          No doctors found.
        </p>`;

      return;
    }

    allDoctorsContainer.innerHTML =
      doctors.map(renderDoctor).join("");

  } catch (error) {

    console.error(error);

    allDoctorsContainer.innerHTML =
      `<p class="error-state">
        ${escapeHTML(error.message)}
      </p>`;
  }
}


// ======================================================
// RENDER DOCTOR
// ======================================================

function renderDoctor(user) {

  const doctor =
    user.doctor || {};

  const status =
    user.approval || "PENDING";

  const location =
    doctor.building && doctor.office
      ? `${doctor.building} • ${doctor.office}`
      : "Location not set";

  const subjects =
    doctor.subjects || [];

  const subjectText =
    subjects.length
      ? subjects
          .map(subject => subject.name)
          .join(", ")
      : "No subjects";

  return `
    <article class="admin-row">

      <div class="admin-info">

        <strong>
          ${escapeHTML(user.name)}
        </strong>

        <small>
          ${escapeHTML(user.email)}
        </small>

        <small>
          ${escapeHTML(subjectText)}
          •
          ${escapeHTML(location)}
        </small>

      </div>


      <div class="admin-actions">

        <span
          class="status-badge status-${status.toLowerCase()}"
        >
          ${escapeHTML(status)}
        </span>

        <button
          class="small-btn danger-btn delete-doctor-btn"
          data-id="${escapeHTML(user.id)}"
          data-name="${escapeHTML(user.name)}"
        >
          Delete
        </button>

      </div>

    </article>
  `;
}


// ======================================================
// APPROVE / REJECT
// ======================================================

async function updateApproval(
  userId,
  approval
) {

  try {

    await apiFetch(
      `/admin/doctors/${userId}/approval`,
      {
        method: "PATCH",

        body: JSON.stringify({
          approval
        })
      }
    );

    await loadPendingDoctors();
    await loadAllDoctors();

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}


// ======================================================
// DELETE DOCTOR
// ======================================================

async function deleteDoctor(
  userId,
  doctorName
) {

  const confirmed =
    window.confirm(
      `Delete ${doctorName} permanently?\n\n` +
      "This will remove the doctor's account " +
      "and their stored profile data."
    );

  if (!confirmed) {
    return;
  }

  try {

    await apiFetch(
      `/admin/doctors/${userId}`,
      {
        method: "DELETE"
      }
    );

    alert(
      "Doctor deleted successfully."
    );

    await loadPendingDoctors();
    await loadAllDoctors();

  } catch (error) {

    console.error(error);

    alert(
      `Could not delete doctor.\n\n${error.message}`
    );
  }
}


// ======================================================
// EVENT DELEGATION
// ======================================================

document.addEventListener(
  "click",
  async (event) => {

    const approveButton =
      event.target.closest(".approve-btn");

    if (approveButton) {

      await updateApproval(
        approveButton.dataset.id,
        "APPROVED"
      );

      return;
    }


    const rejectButton =
      event.target.closest(".reject-btn");

    if (rejectButton) {

      await updateApproval(
        rejectButton.dataset.id,
        "REJECTED"
      );

      return;
    }


    const deleteButton =
      event.target.closest(
        ".delete-doctor-btn"
      );

    if (deleteButton) {

      await deleteDoctor(
        deleteButton.dataset.id,
        deleteButton.dataset.name
      );
    }
  }
);


// ======================================================
// REFRESH
// ======================================================

refreshButton.addEventListener(
  "click",
  async () => {

    refreshButton.disabled = true;

    try {

      await loadPendingDoctors();
      await loadAllDoctors();

    } finally {

      refreshButton.disabled = false;
    }
  }
);


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
  "click",
  () => {

    localStorage.removeItem("pua_token");
    localStorage.removeItem("pua_user");

    window.location.href =
      "/login.html";
  }
);


// ======================================================
// INITIALIZE
// ======================================================

async function init() {

  const isAdmin =
    await checkAdmin();

  if (!isAdmin) {
    return;
  }

  await loadPendingDoctors();
  await loadAllDoctors();
}

init();