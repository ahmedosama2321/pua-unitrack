const getToken = () =>
  localStorage.getItem("pua_token");


function redirectToLogin() {

  localStorage.removeItem(
    "pua_token"
  );

  localStorage.removeItem(
    "pua_user"
  );

  window.location.replace(
    "/login.html"
  );

}


const token =
  getToken();


if (!token) {
  redirectToLogin();
}


// ==========================================
// API
// ==========================================

const api = async (
  path,
  options = {}
) => {

  const currentToken =
    getToken();


  if (!currentToken) {

    redirectToLogin();

    throw new Error(
      "Authentication required."
    );

  }


  const response =
    await fetch(
      path,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),

          Authorization:
            `Bearer ${currentToken}`
        }

      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (
    response.status === 401 ||
    response.status === 403
  ) {

    redirectToLogin();

    throw new Error(
      data.message ||
      "Authentication required."
    );

  }


  if (!response.ok) {

    throw new Error(
      data.message ||
      "Request failed."
    );

  }


  return data;

};


// ==========================================
// STATE
// ==========================================

let currentStatus =
  "UNAVAILABLE";


const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];


// ==========================================
// HELPERS
// ==========================================

function $(id) {

  return document.getElementById(id);

}


// ==========================================
// ADD SCHEDULE ROW
// ==========================================

function addScheduleRow(
  schedule = {}
) {

  const row =
    document.createElement("div");


  row.className =
    "schedule-row";


  row.innerHTML = `

    <select class="day">

      ${days
        .map(
          (day, index) => `

            <option
              value="${index}"
              ${
                schedule.dayOfWeek !== undefined &&
                index === Number(
                  schedule.dayOfWeek
                )
                  ? "selected"
                  : ""
              }
            >
              ${day}
            </option>

          `
        )
        .join("")}

    </select>


    <input
      class="start"
      type="time"
      value="${schedule.startTime || ""}"
    >


    <input
      class="end"
      type="time"
      value="${schedule.endTime || ""}"
    >


    <input
      class="slot-room"
      placeholder="Room"
      value="${schedule.room || ""}"
    >


    <button
      type="button"
      class="remove"
      title="Remove"
    >
      ×
    </button>


    <input
      class="slot-building"
      placeholder="Building"
      value="${schedule.building || ""}"
    >


    <input
      class="slot-subject"
      placeholder="Subject"
      value="${schedule.subject || ""}"
    >

  `;


  row
    .querySelector(".remove")
    ?.addEventListener(
      "click",
      () => row.remove()
    );


  $("scheduleRows")
    ?.appendChild(row);

}


// ==========================================
// STATUS
// ==========================================

function highlightStatus() {

  document
    .querySelectorAll(
      "[data-status]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.status ===
          currentStatus
      );

    });

}


// ==========================================
// INIT
// ==========================================

async function init() {

  try {

    const data =
      await api("/api/me");


    if (
      data.user.role !==
      "DOCTOR"
    ) {

      window.location.replace(
        "/admin.html"
      );

      return;

    }


    $("welcome").textContent =
      `Welcome, ${data.user.name}`;


    $("approvalBadge").textContent =
      data.user.approval;


    if (
      data.user.approval !==
      "APPROVED"
    ) {

      $("approvalBadge")
        .style.color =
        "#ffb25f";


      document
        .querySelectorAll(
          "input, textarea, select, button"
        )
        .forEach(element => {

          if (
            element.id !==
            "logout"
          ) {

            element.disabled =
              true;

          }

        });

    }


    if (data.doctor) {

      currentStatus =
        data.doctor.status ||
        "UNAVAILABLE";


      $("title").value =
        data.doctor.title ||
        "";


      $("phone").value =
        data.doctor.phone ||
        "";


      $("pBuilding").value =
        data.doctor.building ||
        "";


      $("office").value =
        data.doctor.office ||
        "";


      $("building").value =
        data.doctor.building ||
        "";


      $("room").value =
        data.doctor.office ||
        "";


      $("subjects").value =
        (data.doctor.subjects || [])
          .map(
            subject =>
              subject.name
          )
          .join("\n");


      $("scheduleRows")
        .innerHTML = "";


      (
        data.doctor.schedules ||
        []
      ).forEach(
        addScheduleRow
      );


      highlightStatus();

    }

  }

  catch (error) {

    console.error(error);


    if (
      error.message !==
      "Authentication required."
    ) {

      alert(
        error.message
      );

    }


    redirectToLogin();

  }

}


// ==========================================
// STATUS BUTTONS
// ==========================================

document
  .querySelectorAll(
    "[data-status]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentStatus =
          button.dataset.status;


        highlightStatus();

      }
    );

  });


// ==========================================
// LOCATION
// ==========================================

$("updateLocation")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await api(
          "/api/doctors/me/location",
          {
            method: "PATCH",

            body: JSON.stringify({
              building:
                $("building").value,

              room:
                $("room").value,

              status:
                currentStatus
            })

          }
        );


        $("locationMsg")
          .textContent =
          "Location updated successfully.";

      }

      catch (error) {

        $("locationMsg")
          .textContent =
          error.message;

      }

    }
  );


// ==========================================
// PROFILE
// ==========================================

$("saveProfile")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await api(
          "/api/doctors/me/profile",
          {
            method: "PATCH",

            body: JSON.stringify({

              title:
                $("title").value,

              phone:
                $("phone").value,

              building:
                $("pBuilding").value,

              office:
                $("office").value,

              subjects:
                $("subjects")
                  .value
                  .split("\n")
                  .map(
                    value =>
                      value.trim()
                  )
                  .filter(Boolean)

            })

          }
        );


        $("profileMsg")
          .textContent =
          "Profile saved.";

      }

      catch (error) {

        $("profileMsg")
          .textContent =
          error.message;

      }

    }
  );


// ==========================================
// ADD SCHEDULE
// ==========================================

$("addSlot")
  ?.addEventListener(
    "click",
    () => {

      // No fake times or locations.
      // New schedule starts empty.

      addScheduleRow();

    }
  );


// ==========================================
// SAVE SCHEDULE
// ==========================================

$("saveSchedule")
  ?.addEventListener(
    "click",
    async () => {

      const schedules =
        [
          ...document
            .querySelectorAll(
              ".schedule-row"
            )
        ]
        .map(row => ({

          dayOfWeek:
            row.querySelector(
              ".day"
            ).value,

          startTime:
            row.querySelector(
              ".start"
            ).value,

          endTime:
            row.querySelector(
              ".end"
            ).value,

          room:
            row.querySelector(
              ".slot-room"
            ).value,

          building:
            row.querySelector(
              ".slot-building"
            ).value,

          subject:
            row.querySelector(
              ".slot-subject"
            ).value

        }));


      try {

        await api(
          "/api/doctors/me/schedule",
          {
            method: "PUT",

            body: JSON.stringify({
              schedules
            })

          }
        );


        $("scheduleMsg")
          .textContent =
          "Schedule saved.";

      }

      catch (error) {

        $("scheduleMsg")
          .textContent =
          error.message;

      }

    }
  );


// ==========================================
// LOGOUT
// ==========================================

$("logout")
  ?.addEventListener(
    "click",
    () => {

      localStorage.removeItem(
        "pua_token"
      );

      localStorage.removeItem(
        "pua_user"
      );

      sessionStorage.clear();


      window.location.replace(
        "/login.html"
      );

    }
  );


// ==========================================
// START
// ==========================================

init();