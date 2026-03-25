document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const accountButton = document.getElementById("account-button");
  const accountStatus = document.getElementById("account-status");
  const authModal = document.getElementById("auth-modal");
  const closeAuthModalButton = document.getElementById("close-auth-modal");
  const authForm = document.getElementById("auth-form");
  const teacherToolsCopy = document.getElementById("teacher-tools-copy");

  let currentTeacher = null;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.className = "hidden";
    }, 5000);
  }

  function openAuthModal() {
    authModal.classList.remove("hidden");
  }

  function closeAuthModal() {
    authModal.classList.add("hidden");
    authForm.reset();
  }

  function renderAccountState() {
    if (currentTeacher) {
      accountButton.textContent = "Sign Out";
      accountStatus.textContent = `Signed in as ${currentTeacher.name}`;
      accountStatus.classList.remove("hidden");
      teacherToolsCopy.textContent =
        "You can now register and unregister students directly from each activity card.";
    } else {
      accountButton.textContent = "Teacher Login";
      accountStatus.textContent = "";
      accountStatus.classList.add("hidden");
      teacherToolsCopy.textContent =
        "Sign in as a teacher to register or unregister students for activities.";
    }
  }

  async function loadAuthStatus() {
    try {
      const response = await fetch("/auth/status");
      const status = await response.json();
      currentTeacher = status.authenticated ? status.user : null;
      renderAccountState();
    } catch (error) {
      currentTeacher = null;
      renderAccountState();
      console.error("Error loading auth status:", error);
    }
  }

  function registerFieldId(activityName) {
    return `register-${activityName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;
  }

  function buildTeacherActions(activityName) {
    if (!currentTeacher) {
      return "";
    }

    const fieldId = registerFieldId(activityName);

    return `
      <form class="register-form" data-activity="${activityName}">
        <label for="${fieldId}" class="sr-only">Student email</label>
        <input
          id="${fieldId}"
          name="email"
          type="email"
          placeholder="student@mergington.edu"
          required
        />
        <button type="submit">Register Student</button>
      </form>
    `;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        currentTeacher
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" type="button">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${buildTeacherActions(name)}
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      document.querySelectorAll(".register-form").forEach((form) => {
        form.addEventListener("submit", handleRegister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.elements.email;
    const email = emailInput.value;
    const activity = form.getAttribute("data-activity");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        form.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  }

  accountButton.addEventListener("click", async () => {
    if (currentTeacher) {
      try {
        const response = await fetch("/auth/logout", { method: "POST" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || "Failed to sign out");
        }
        currentTeacher = null;
        renderAccountState();
        fetchActivities();
        showMessage(result.message, "success");
      } catch (error) {
        showMessage(error.message || "Failed to sign out.", "error");
      }
      return;
    }

    openAuthModal();
  });

  closeAuthModalButton.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Failed to sign in.", "error");
        return;
      }

      currentTeacher = result.user;
      renderAccountState();
      closeAuthModal();
      fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage("Failed to sign in. Please try again.", "error");
      console.error("Error signing in:", error);
    }
  });

  // Initialize app
  loadAuthStatus().then(fetchActivities);
});
