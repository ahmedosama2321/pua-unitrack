const $ = (selector) =>
  document.querySelector(selector);


// ==========================================
// API
// ==========================================

const api = async (path, options = {}) => {

  const response = await fetch(path, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });


  const data =
    await response
      .json()
      .catch(() => ({}));


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

let doctors = [];


// ==========================================
// HELPERS
// ==========================================

function statusText(status) {

  const statuses = {

    AVAILABLE:
      "Available",

    IN_LECTURE:
      "In lecture",

    UNAVAILABLE:
      "Unavailable"

  };


  return statuses[status] ||
    "Not available";
}


function initials(name) {

  if (!name) {
    return "?";
  }


  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, character => {

      const entities = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };

      return entities[character];

    });

}


function formatDate(value) {

  if (!value) {
    return "Not updated";
  }


  const date = new Date(value);


  if (Number.isNaN(date.getTime())) {
    return "Not updated";
  }


  return date.toLocaleString(
    "en-EG",
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  );

}


// ==========================================
// DOCTOR CARDS
// ==========================================

function renderDoctors(list) {

  const grid =
    $("#doctorGrid");


  if (!list.length) {

    grid.innerHTML = `
      <div class="loading">
        No approved faculty found.
      </div>
    `;

    return;
  }


  grid.innerHTML = list
    .map((doctor, index) => {

      const name =
        doctor.user?.name ||
        "Unnamed faculty member";


      const title =
        doctor.title ||
        "Academic information not provided";


      const subjects =
        doctor.subjects
          ?.slice(0, 3)
          .map(subject => subject.name)
          .filter(Boolean)
          .join(", ") ||
        "No subjects added";


      const location =
        doctor.building ||
        doctor.office
          ? [
              doctor.building,
              doctor.office
            ]
              .filter(Boolean)
              .join(" • ")
          : "Location not set";


      return `

        <article
          class="doctor-card"
          style="animation-delay:${index * 60}ms"
        >

          <div class="doc-top">

            <div class="avatar">
              ${escapeHtml(initials(name))}
            </div>


            <div>

              <div class="doc-name">
                ${escapeHtml(name)}
              </div>

              <div class="doc-role">
                ${escapeHtml(title)}
              </div>

            </div>


            <div
              class="status"
              data-status-value="${escapeHtml(doctor.status)}"
            >
              ${escapeHtml(statusText(doctor.status))}
            </div>

          </div>


          <div class="doc-meta">

            <div class="meta">

              <span>
                Subjects
              </span>

              <span>
                ${escapeHtml(subjects)}
              </span>

            </div>


            <div class="meta">

              <span>
                Location
              </span>

              <span>
                ${escapeHtml(location)}
              </span>

            </div>


            <div class="meta">

              <span>
                Last update
              </span>

              <span>
                ${escapeHtml(
                  formatDate(
                    doctor.lastUpdated
                  )
                )}
              </span>

            </div>

          </div>

        </article>

      `;

    })
    .join("");


  updateStatusStyles();

}


// ==========================================
// STATUS VISUALS
// ==========================================

function updateStatusStyles() {

  document
    .querySelectorAll(
      "[data-status-value]"
    )
    .forEach(element => {

      const status =
        element.dataset.statusValue;


      element.classList.remove(
        "status-available",
        "status-lecture",
        "status-unavailable"
      );


      if (status === "AVAILABLE") {

        element.classList.add(
          "status-available"
        );

      }


      if (status === "IN_LECTURE") {

        element.classList.add(
          "status-lecture"
        );

      }


      if (status === "UNAVAILABLE") {

        element.classList.add(
          "status-unavailable"
        );

      }

    });

}


// ==========================================
// LOAD DOCTORS
// ==========================================

async function loadDoctors(query = "") {

  const grid =
    $("#doctorGrid");


  grid.innerHTML = `
    <div class="loading">
      Loading faculty...
    </div>
  `;


  try {

    doctors = await api(
      `/api/doctors?q=${encodeURIComponent(query)}`
    );


    renderDoctors(doctors);

  }

  catch (error) {

    console.error(error);


    grid.innerHTML = `

      <div class="loading">

        Unable to load faculty information.

        <br>

        <small>
          ${escapeHtml(error.message)}
        </small>

      </div>

    `;

  }

}


// ==========================================
// SEARCH
// ==========================================

const search =
  $("#search");


search?.addEventListener(
  "input",
  async () => {

    const query =
      search.value.trim();


    await loadDoctors(query);


    const dropdown =
      $("#searchDrop");


    if (!query) {

      dropdown.innerHTML = "";

      return;

    }


    if (!doctors.length) {

      dropdown.innerHTML = `
        <div class="drop">
          <div>
            <strong>
              No matching faculty
            </strong>

            <small>
              Try another name, subject or office.
            </small>
          </div>
        </div>
      `;

      return;

    }


    dropdown.innerHTML =
      doctors
        .slice(0, 5)
        .map(doctor => {

          const name =
            doctor.user?.name ||
            "Unnamed faculty member";


          const subject =
            doctor.subjects?.[0]?.name ||
            "No subject added";


          const location =
            [
              doctor.building,
              doctor.office
            ]
              .filter(Boolean)
              .join(" • ") ||
            "Location not set";


          return `

            <div class="drop">

              <div class="avatar">
                ${escapeHtml(
                  initials(name)
                )}
              </div>

              <div>

                <strong>
                  ${escapeHtml(name)}
                </strong>

                <small>
                  ${escapeHtml(subject)}
                  •
                  ${escapeHtml(location)}
                </small>

              </div>

            </div>

          `;

        })
        .join("");

  }
);


// ==========================================
// SEARCH BUTTON
// ==========================================

$("#searchBtn")?.addEventListener(
  "click",
  () => {

    $("#doctors")
      ?.scrollIntoView({
        behavior: "smooth"
      });

  }
);


// ==========================================
// CLEAR SEARCH
// ==========================================

$("#clearSearch")?.addEventListener(
  "click",
  async () => {

    if (search) {
      search.value = "";
    }


    $("#searchDrop").innerHTML = "";


    await loadDoctors();

  }
);


// ==========================================
// AI
// ==========================================

const panel =
  $("#aiPanel");

const backdrop =
  $("#aiBackdrop");


function openAI() {

  if (!panel || !backdrop) {
    return;
  }


  panel.style.display = "flex";

  backdrop.style.display =
    "block";


  $("#aiInput")?.focus();

}


function closeAI() {

  if (!panel || !backdrop) {
    return;
  }


  panel.style.display =
    "none";

  backdrop.style.display =
    "none";

}


$("#openAi")
  ?.addEventListener(
    "click",
    openAI
  );


$("#closeAi")
  ?.addEventListener(
    "click",
    closeAI
  );


backdrop
  ?.addEventListener(
    "click",
    closeAI
  );


// ==========================================
// AI MESSAGES
// ==========================================

function addMessage(
  text,
  type
) {

  const box =
    $("#aiMessages");


  if (!box) {
    return;
  }


  const element =
    document.createElement("div");


  element.className =
    `msg ${type}`;


  element.textContent =
    text;


  box.appendChild(element);


  box.scrollTop =
    box.scrollHeight;

}


// ==========================================
// AI REQUEST
// ==========================================

async function sendAI() {

  const input =
    $("#aiInput");


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  addMessage(
    text,
    "user"
  );


  input.value = "";


  const thinking =
    document.createElement("div");


  thinking.className =
    "msg bot";


  thinking.textContent =
    "Thinking…";


  $("#aiMessages")
    ?.appendChild(thinking);


  try {

    const result =
      await api(
        "/api/ai/ask",
        {
          method: "POST",

          body: JSON.stringify({
            message: text
          })
        }
      );


    thinking.textContent =
      result.answer ||
      "No answer was returned.";

  }

  catch (error) {

    console.error(error);


    thinking.textContent =
      "The AI service is unavailable right now. Please use faculty search.";

  }


  const messages =
    $("#aiMessages");


  if (messages) {

    messages.scrollTop =
      messages.scrollHeight;

  }

}


// ==========================================
// AI EVENTS
// ==========================================

$("#sendAi")
  ?.addEventListener(
    "click",
    sendAI
  );


$("#aiInput")
  ?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        sendAI();

      }

    }
  );


// ==========================================
// INITIAL LOAD
// ==========================================

loadDoctors();