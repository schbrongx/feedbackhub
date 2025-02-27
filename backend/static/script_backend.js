// script_backend.js
document.addEventListener("DOMContentLoaded", async function() {
    const feedbackTableNew = document.getElementById("feedbackTableNew");
    const feedbackTableProcessed = document.getElementById("feedbackTableProcessed");
    const syncButton = document.getElementById("syncButton");
    const feedbackTabs = document.getElementById("feedbackTabs");
    const totalFeedback = document.getElementById("totalFeedback");
    const acceptedFeedback = document.getElementById("acceptedFeedback");
    const spamFeedback = document.getElementById("spamFeedback");

    // Global variables for processed feedback and filters
    let processedFeedbackData = [];
    let activeTagFilters = [];
    let activeStatusFilters = [];

    // Retrieve stored filters if any
    const storedTagFilters = localStorage.getItem("activeTagFilters");
    if (storedTagFilters) {
        activeTagFilters = JSON.parse(storedTagFilters);
    }
    const storedStatusFilters = localStorage.getItem("activeStatusFilters");
    if (storedStatusFilters) {
        activeStatusFilters = JSON.parse(storedStatusFilters);
    }

    // Restore active tab on page load
    const activeTab = localStorage.getItem("activeTab");
    if (activeTab) {
        let selectedTab = document.querySelector(`[data-bs-target='${activeTab}']`);
        if (selectedTab) {
            selectedTab.click();
        }
    }
    feedbackTabs.addEventListener("click", function(event) {
        if (event.target && event.target.dataset.bsTarget) {
            localStorage.setItem("activeTab", event.target.dataset.bsTarget);
        }
    });

    // --- Tag Filter Dropdown Behavior ---
    const tagFilterButton = document.getElementById("tagFilterButton");
    const tagFilterDropdown = document.getElementById("tagFilterDropdown");
    tagFilterButton.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    function showTagDropdown() {
        tagFilterDropdown.classList.add("show");
        tagFilterButton.parentElement.classList.add("show");
    }
    function hideTagDropdown() {
        tagFilterDropdown.classList.remove("show");
        tagFilterButton.parentElement.classList.remove("show");
    }
    tagFilterButton.addEventListener("mouseenter", showTagDropdown);
    tagFilterButton.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!tagFilterButton.matches(":hover") && !tagFilterDropdown.matches(":hover")) {
                hideTagDropdown();
            }
        }, 100);
    });
    tagFilterDropdown.addEventListener("mouseenter", showTagDropdown);
    tagFilterDropdown.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!tagFilterButton.matches(":hover") && !tagFilterDropdown.matches(":hover")) {
                hideTagDropdown();
            }
        }, 100);
    });
    // --- End Tag Filter Dropdown Behavior ---

    // --- Status Filter Dropdown Behavior ---
    const statusFilterButton = document.getElementById("statusFilterButton");
    const statusFilterDropdown = document.getElementById("statusFilterDropdown");
    statusFilterButton.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    function showStatusDropdown() {
        statusFilterDropdown.classList.add("show");
        statusFilterButton.parentElement.classList.add("show");
    }
    function hideStatusDropdown() {
        statusFilterDropdown.classList.remove("show");
        statusFilterButton.parentElement.classList.remove("show");
    }
    statusFilterButton.addEventListener("mouseenter", showStatusDropdown);
    statusFilterButton.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!statusFilterButton.matches(":hover") && !statusFilterDropdown.matches(":hover")) {
                hideStatusDropdown();
            }
        }, 100);
    });
    statusFilterDropdown.addEventListener("mouseenter", showStatusDropdown);
    statusFilterDropdown.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!statusFilterButton.matches(":hover") && !statusFilterDropdown.matches(":hover")) {
                hideStatusDropdown();
            }
        }, 100);
    });
    // --- End Status Filter Dropdown Behavior ---

    // Event listener für "New Feedback" Select-All-Checkbox
    const selectAllNew = document.getElementById("selectAllNew");
    selectAllNew.addEventListener("change", function() {
        const rowCheckboxes = document.querySelectorAll("#feedbackTableNew .rowCheckbox");
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllNew.checked;
        });
        updateBulkActionButtons("New");
    });

    // Event listener für "Processed Feedback" Select-All-Checkbox (nur für gefilterte Zeilen)
    const selectAllProcessed = document.getElementById("selectAllProcessed");
    selectAllProcessed.addEventListener("change", function() {
        const rowCheckboxes = document.querySelectorAll("#feedbackTableProcessed .rowCheckbox");
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllProcessed.checked;
        });
        updateBulkActionButtons("Processed");
    });

    // Helper: updateBulkActionButtons
    function updateBulkActionButtons(tableType) {
        const tableSelector = tableType === "New" ? "#feedbackTableNew" : "#feedbackTableProcessed";
        const bulkButtons = document.querySelectorAll(
            `#bulkAccept${tableType}, #bulkDuplicate${tableType}, #bulkSpam${tableType}, #bulkDelete${tableType}`
        );
        const selectedCheckboxes = document.querySelectorAll(`${tableSelector} .rowCheckbox:checked`);
        bulkButtons.forEach(btn => {
            btn.disabled = (selectedCheckboxes.length === 0);
        });
    }

    // Update Funnel Icons
    function updateFunnelIcon() {
        const funnelIcon = document.getElementById("funnelIcon");
        if (activeTagFilters.length > 0) {
            funnelIcon.className = "bi bi-funnel-fill";
            funnelIcon.style.fontSize = "16px";
            funnelIcon.style.color = "grey";
        } else {
            funnelIcon.className = "bi bi-funnel";
            funnelIcon.style.fontSize = "16px";
            funnelIcon.style.color = "";
        }
    }
    function updateStatusFilterIcon() {
        const statusIcon = document.getElementById("statusFilterIcon");
        if (activeStatusFilters.length > 0) {
            statusIcon.className = "bi bi-funnel-fill";
            statusIcon.style.fontSize = "16px";
            statusIcon.style.color = "grey";
        } else {
            statusIcon.className = "bi bi-funnel";
            statusIcon.style.fontSize = "16px";
            statusIcon.style.color = "";
        }
    }

    // Populate Dropdowns
    function updateTagFilterDropdown() {
        const dropdown = document.getElementById("tagFilterDropdown");
        dropdown.innerHTML = "";
        const tagsSet = new Set();
        processedFeedbackData.forEach(fb => {
            if (fb.tag) {
                tagsSet.add(fb.tag);
            }
        });
        const uniqueTags = Array.from(tagsSet).sort();
        uniqueTags.forEach(tag => {
            const div = document.createElement("div");
            div.className = "form-check";
            div.innerHTML = `
                <input class="form-check-input tag-filter-checkbox" type="checkbox" value="${tag}" id="tagFilter_${tag}">
                <label class="form-check-label" for="tagFilter_${tag}">${tag}</label>
            `;
            dropdown.appendChild(div);
        });
        const checkboxes = dropdown.querySelectorAll(".tag-filter-checkbox");
        checkboxes.forEach(cb => {
            if (activeTagFilters.includes(cb.value)) {
                cb.checked = true;
            }
            cb.addEventListener("change", function() {
                activeTagFilters = Array.from(checkboxes)
                                      .filter(x => x.checked)
                                      .map(x => x.value);
                localStorage.setItem("activeTagFilters", JSON.stringify(activeTagFilters));
                renderProcessedFeedbacks();
                updateFunnelIcon();
            });
        });
    }

    function updateStatusFilterDropdown() {
        const dropdown = document.getElementById("statusFilterDropdown");
        dropdown.innerHTML = "";
        const statusSet = new Set();
        processedFeedbackData.forEach(fb => {
            if (fb.status) {
                statusSet.add(fb.status);
            }
        });
        const uniqueStatuses = Array.from(statusSet).sort();
        uniqueStatuses.forEach(status => {
            const div = document.createElement("div");
            div.className = "form-check";
            div.innerHTML = `
                <input class="form-check-input status-filter-checkbox" type="checkbox" value="${status}" id="statusFilter_${status}">
                <label class="form-check-label" for="statusFilter_${status}">${status}</label>
            `;
            dropdown.appendChild(div);
        });
        const checkboxes = dropdown.querySelectorAll(".status-filter-checkbox");
        checkboxes.forEach(cb => {
            if (activeStatusFilters.includes(cb.value)) {
                cb.checked = true;
            }
            cb.addEventListener("change", function() {
                activeStatusFilters = Array.from(checkboxes)
                                      .filter(x => x.checked)
                                      .map(x => x.value);
                localStorage.setItem("activeStatusFilters", JSON.stringify(activeStatusFilters));
                renderProcessedFeedbacks();
                updateStatusFilterIcon();
            });
        });
    }

    // Render Processed Feedbacks
    function renderProcessedFeedbacks() {
        feedbackTableProcessed.innerHTML = "";
        let filteredData = processedFeedbackData;
        if (activeTagFilters.length > 0) {
            filteredData = filteredData.filter(fb => activeTagFilters.includes(fb.tag));
        }
        if (activeStatusFilters.length > 0) {
            filteredData = filteredData.filter(fb => activeStatusFilters.includes(fb.status));
        }
        filteredData.forEach(feedback => {
            const row = document.createElement("tr");
            
            // Checkbox
            const checkboxCell = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("rowCheckbox");
            checkbox.dataset.id = feedback.id;
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
            
            // ID
            const idCell = document.createElement("td");
            idCell.innerText = feedback.id;
            row.appendChild(idCell);
            
            // Preview Image
            const previewCell = document.createElement("td");
            const previewImage = feedback.screenshot ?
                `<img src="/static/uploads/${feedback.screenshot}" alt="Screenshot" style="width: 50px; height: 50px; object-fit: cover;">` :
                `<div style="width: 50px; height: 50px; background-color: #ccc; display: flex; align-items: center; justify-content: center;">N/A</div>`;
            previewCell.innerHTML = previewImage;
            row.appendChild(previewCell);
            
            // Title and Text (clickable)
            const titleCell = document.createElement("td");
            const clickableContainer = document.createElement("div");
            clickableContainer.classList.add("clickable-feedback");
            clickableContainer.style.cursor = "pointer";
            const truncatedText = feedback.text.length > 40 ? feedback.text.substring(0, 40) + "..." : feedback.text;
            let formattedTimestamp = "";
            if (feedback.created_at) {
                const ts = new Date(feedback.created_at);
                formattedTimestamp = ts.toLocaleString();
            }
            clickableContainer.innerHTML = `
                ${feedback.title} (${truncatedText})
                <br>
                <small style="color: grey;">${formattedTimestamp}</small>
            `;
            clickableContainer.addEventListener("click", function() {
                openFeedbackModal(feedback);
            });
            titleCell.appendChild(clickableContainer);
            row.appendChild(titleCell);
            
            // Tag
            const tagCell = document.createElement("td");
            tagCell.innerText = feedback.tag;
            row.appendChild(tagCell);
            
            // Status
            const statusCell = document.createElement("td");
            statusCell.innerText = feedback.status;
            row.appendChild(statusCell);
            
            // Actions
            const actionCell = document.createElement("td");
			actionCell.classList.add("action-cell");
            actionCell.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Actions
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'accepted')">Accept</a></li>
                        <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'duplicate')">Mark Duplicate</a></li>
                        <li><a class="dropdown-item text-warning" href="#" onclick="updateStatus(${feedback.id}, 'spam')">Mark Spam</a></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeedback(${feedback.id})">Delete</a></li>
                    </ul>
                </div>
            `;
            row.appendChild(actionCell);
            
            // Checkbox Listener
            checkbox.addEventListener("change", function() {
                const allCheckboxes = feedbackTableProcessed.querySelectorAll(".rowCheckbox");
                const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                document.getElementById("selectAllProcessed").checked = allChecked;
                updateBulkActionButtons("Processed");
            });
            
            feedbackTableProcessed.appendChild(row);
        });
	    hidePoweruserElements();
    }

    async function loadFeedbacks() {
        try {
            // Lade gespeicherte Filter (falls vorhanden)
            const storedTags = localStorage.getItem("activeTagFilters");
            if (storedTags) {
                activeTagFilters = JSON.parse(storedTags);
            }
            const storedStatuses = localStorage.getItem("activeStatusFilters");
            if (storedStatuses) {
                activeStatusFilters = JSON.parse(storedStatuses);
            }
            // Feedbacks vom Backend abrufen
            const response = await fetch("/feedbacks");
            const feedbacks = await response.json();

            // Neue Feedback-Tabelle leeren
            feedbackTableNew.innerHTML = "";
            // Processed-Feedback-Daten zurücksetzen
            processedFeedbackData = [];
            let totalCount = 0;
            let acceptedCount = 0;
            let spamCount = 0;

            // Alle Feedbacks durchlaufen
            feedbacks.forEach(feedback => {
                totalCount++;
                if (feedback.status === "accepted") acceptedCount++;
                if (feedback.status === "spam") spamCount++;

                if (feedback.status === "submitted") {
                    // Feedback in New-Tabelle einfügen
                    const row = document.createElement("tr");
                    // Checkbox
                    const checkboxCell = document.createElement("td");
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.classList.add("rowCheckbox");
                    checkbox.dataset.id = feedback.id;
                    checkboxCell.appendChild(checkbox);
                    row.appendChild(checkboxCell);
                    // ID
                    const idCell = document.createElement("td");
                    idCell.innerText = feedback.id;
                    row.appendChild(idCell);
                    // Preview
                    const previewCell = document.createElement("td");
                    const previewImage = feedback.screenshot ?
                        `<img src="/static/uploads/${feedback.screenshot}" alt="Screenshot" style="width: 50px; height: 50px; object-fit: cover;">` :
                        `<div style="width: 50px; height: 50px; background-color: #ccc; display: flex; align-items: center; justify-content: center;">N/A</div>`;
                    previewCell.innerHTML = previewImage;
                    row.appendChild(previewCell);
                    // Titel und Text (als klickbarer Container)
                    const titleCell = document.createElement("td");
                    const clickableContainer = document.createElement("div");
                    clickableContainer.classList.add("clickable-feedback");
                    clickableContainer.style.cursor = "pointer";
                    const truncatedText = feedback.text.length > 40 ? feedback.text.substring(0, 40) + "..." : feedback.text;
                    let formattedTimestamp = "";
                    if (feedback.created_at) {
                        const ts = new Date(feedback.created_at);
                        formattedTimestamp = ts.toLocaleString();
                    }
                    clickableContainer.innerHTML = `
                        ${feedback.title} (${truncatedText})
                        <br>
                        <small style="color: grey;">${formattedTimestamp}</small>
                    `;
                    clickableContainer.addEventListener("click", function() {
                        openFeedbackModal(feedback);
                    });
                    titleCell.appendChild(clickableContainer);
                    row.appendChild(titleCell);
                    // Tag
                    const tagCell = document.createElement("td");
                    tagCell.innerText = feedback.tag;
                    row.appendChild(tagCell);
                    // Status
                    const statusCell = document.createElement("td");
                    statusCell.innerText = feedback.status;
                    row.appendChild(statusCell);
                    // Aktionen (Dropdown)
                    const actionCell = document.createElement("td");
					actionCell.classList.add("action-cell");
                    actionCell.innerHTML = `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'accepted')">Accept</a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'duplicate')">Mark Duplicate</a></li>
                                <li><a class="dropdown-item text-warning" href="#" onclick="updateStatus(${feedback.id}, 'spam')">Mark Spam</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeedback(${feedback.id})">Delete</a></li>
                            </ul>
                        </div>
                    `;
                    row.appendChild(actionCell);
                    // Checkbox Listener
                    checkbox.addEventListener("change", function() {
                        const allCheckboxes = feedbackTableNew.querySelectorAll(".rowCheckbox");
                        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                        document.getElementById("selectAllNew").checked = allChecked;
                        updateBulkActionButtons("New");
                    });
                    feedbackTableNew.appendChild(row);
                } else {
                    // Feedbacks mit anderem Status speichern
                    processedFeedbackData.push(feedback);
                }
            });

            totalFeedback.innerText = `Total Feedback: ${totalCount}`;
            acceptedFeedback.innerText = `Accepted: ${acceptedCount}`;
            spamFeedback.innerText = `Spam: ${spamCount}`;

            // Dropdowns aktualisieren und Processed Feedback rendern
            updateTagFilterDropdown();
            updateStatusFilterDropdown();
            renderProcessedFeedbacks();
            updateFunnelIcon();
            updateStatusFilterIcon();
        } catch (error) {
            console.error("Error loading feedbacks:", error);
        }
		hidePoweruserElements();
    }

    async function syncFeedbacks() {
        try {
            syncButton.disabled = true;
            syncButton.innerText = "Syncing...";
            await fetch("/sync_feedbacks", { method: "POST" });
            await loadFeedbacks();
            syncButton.innerText = "Sync Feedbacks";
            syncButton.disabled = false;
        } catch (error) {
            console.error("Error syncing feedbacks:", error);
            syncButton.innerText = "Sync Failed";
        }
    }

    // Bulk Action Listener: Update
    function addBulkUpdateListener(tableType, buttonIdSuffix, newStatus) {
        const btn = document.getElementById(`bulk${buttonIdSuffix}${tableType}`);
        if (btn) {
            btn.addEventListener("click", async function() {
                const tableSelector = tableType === "New" ? "#feedbackTableNew" : "#feedbackTableProcessed";
                const selectedCheckboxes = document.querySelectorAll(`${tableSelector} .rowCheckbox:checked`);
                const ids = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
                for (const id of ids) {
                    await fetch("/update_status", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `feedback_id=${id}&new_status=${newStatus}`
                    });
                }
                await loadFeedbacks(); // refresh without resetting filters
            });
        }
    }

    // Bulk Action Listener: Delete
    function addBulkDeleteListener(tableType) {
        const btn = document.getElementById(`bulkDelete${tableType}`);
        if (btn) {
            btn.addEventListener("click", async function() {
                if (!confirm("Are you sure you want to delete the selected feedback?")) {
                    return;
                }
                const tableSelector = tableType === "New" ? "#feedbackTableNew" : "#feedbackTableProcessed";
                const selectedCheckboxes = document.querySelectorAll(`${tableSelector} .rowCheckbox:checked`);
                const ids = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
                for (const id of ids) {
                    await fetch("/delete_feedback", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: `feedback_id=${id}`
                    });
                }
                await loadFeedbacks(); // refresh without resetting filters
            });
        }
    }

    // Bulk Listeners
    addBulkUpdateListener("New", "Accept", "accepted");
    addBulkUpdateListener("New", "Duplicate", "duplicate");
    addBulkUpdateListener("New", "Spam", "spam");
    addBulkUpdateListener("Processed", "Accept", "accepted");
    addBulkUpdateListener("Processed", "Duplicate", "duplicate");
    addBulkUpdateListener("Processed", "Spam", "spam");
    addBulkDeleteListener("New");
    addBulkDeleteListener("Processed");

    window.deleteFeedback = async function(feedbackId) {
        if (!confirm("Are you sure you want to delete this feedback?")) {
            return;
        }
        try {
            await fetch("/delete_feedback", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `feedback_id=${feedbackId}`
            });
            await loadFeedbacks(); // refresh without resetting filters
        } catch (error) {
            console.error("Error deleting feedback:", error);
        }
    };

    syncButton.addEventListener("click", syncFeedbacks);
    await loadFeedbacks();

    // Expose loadFeedbacks globally so quick actions can call it
    window.loadFeedbacks = loadFeedbacks;
});

window.updateStatus = async function(feedbackId, newStatus) {
    try {
        await fetch("/update_status", {
            method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `feedback_id=${feedbackId}&new_status=${newStatus}`
        });
        await window.loadFeedbacks();
    } catch (error) {
        console.error("Error updating status:", error);
    }
};

function openFeedbackModal(feedback) {
  document.getElementById("modalTitle").innerText = feedback.title;
  document.getElementById("modalText").innerText = feedback.text;
  document.getElementById("modalTag").innerText = "Tag: " + feedback.tag;
  document.getElementById("modalStatus").innerText = "Status: " + feedback.status;
  if (feedback.screenshot) {
    document.getElementById("modalScreenshot").src = "/static/uploads/" + feedback.screenshot;
    document.getElementById("modalScreenshotWrapper").style.display = "block";
  } else {
    document.getElementById("modalScreenshotWrapper").style.display = "none";
  }
  document.getElementById("editControls").style.display = "none";
  document.getElementById("editIcon").style.display = "inline-block";
  window.currentFeedback = feedback;
  document.getElementById("feedbackModal").style.display = "flex";
}

document.getElementById("feedbackModal").addEventListener("click", function(e) {
  if (e.target === this) {
    closeFeedbackModal();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    if (document.getElementById("feedbackModal").style.display === "flex") {
      closeFeedbackModal();
    }
  }
});

function closeFeedbackModal() {
  document.getElementById("feedbackModal").style.display = "none";
  window.currentFeedback = null;
}

document.getElementById("modalScreenshotWrapper").addEventListener("click", function(e) {
  e.stopPropagation();
  openScreenshotModal();
});

function openScreenshotModal() {
  let src = document.getElementById("modalScreenshot").src;
  document.getElementById("enlargedScreenshot").src = src;
  document.getElementById("screenshotModal").style.display = "flex";
}

document.getElementById("screenshotModal").addEventListener("click", function(e) {
  if (e.target === this) {
    closeScreenshotModal();
  }
});

function closeScreenshotModal() {
  document.getElementById("screenshotModal").style.display = "none";
}

document.getElementById("downloadIcon").addEventListener("click", function(e) {
  e.stopPropagation();
  const link = document.createElement("a");
  const src = document.getElementById("modalScreenshot").src;
  link.href = src;
  link.download = window.currentFeedback ? window.currentFeedback.title + ".jpg" : "screenshot.jpg";
  link.click();
});

document.getElementById("editIcon").addEventListener("click", function() {
  enterEditMode();
});

function enterEditMode() {
  document.getElementById("editIcon").style.display = "none";
  document.getElementById("editControls").style.display = "flex";
  
  const titleElem = document.getElementById("modalTitle");
  const titleValue = titleElem.innerText;
  titleElem.innerHTML = `<input type="text" id="editTitle" class="form-control" value="${titleValue}">`;
  
  const textElem = document.getElementById("modalText");
  const textValue = textElem.innerText;
  textElem.innerHTML = `<textarea id="editText" class="form-control" style="height: 200px;">${textValue}</textarea>`;
  
  const tagElem = document.getElementById("modalTag");
  const currentTag = tagElem.innerText.replace("Tag: ", "");
  tagElem.innerHTML = `<select id="editTag" class="form-select">
                          <option value="Bug">Bug</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Suggestion">Suggestion</option>
                        </select>`;
  document.getElementById("editTag").value = currentTag;
  
  const statusElem = document.getElementById("modalStatus");
  const currentStatus = statusElem.innerText.replace("Status: ", "");
  statusElem.innerHTML = `<select id="editStatus" class="form-select">
                             <option value="submitted">submitted</option>
                             <option value="accepted">accepted</option>
                             <option value="rejected">rejected</option>
                             <option value="duplicate">duplicate</option>
                             <option value="spam">spam</option>
                           </select>`;
  document.getElementById("editStatus").value = currentStatus;
  
  const screenshotWrapper = document.getElementById("modalScreenshotWrapper");
  if (screenshotWrapper.style.display !== "none") {
    if (!document.getElementById("trashIcon")) {
      const trash = document.createElement("i");
      trash.id = "trashIcon";
      trash.className = "bi bi-trash text-white position-absolute";
      trash.style.bottom = "5px";
      trash.style.left = "5px";
      trash.style.cursor = "pointer";
      screenshotWrapper.appendChild(trash);
      trash.addEventListener("click", function(e) {
        e.stopPropagation();
        document.getElementById("modalScreenshot").src = "";
        screenshotWrapper.style.display = "none";
        if (window.currentFeedback) {
          window.currentFeedback.screenshot = "";
        }
      });
    }
  }
}

// Save-Button: Änderungen speichern (jetzt Backend-Aufruf)
document.getElementById("saveIcon").addEventListener("click", async function() {
  const newTitle = document.getElementById("editTitle").value;
  const newText = document.getElementById("editText").value;
  const newTag = document.getElementById("editTag").value;
  const newStatus = document.getElementById("editStatus").value;
  const newScreenshot = window.currentFeedback.screenshot || "";
  
  // Erstelle URL-encoded FormData
  const formData = new URLSearchParams();
  formData.append("feedback_id", window.currentFeedback.id);
  formData.append("title", newTitle);
  formData.append("text", newText);
  formData.append("tag", newTag);
  formData.append("status", newStatus);
  formData.append("screenshot", newScreenshot);
  
  try {
    const res = await fetch("/update_feedback", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: formData.toString()
    });
    if (!res.ok) {
      throw new Error("Error updating feedback");
    }
    // Nach erfolgreichem Speichern die Liste neu laden und Modal schließen
    await window.loadFeedbacks();
    closeFeedbackModal();
  } catch (err) {
    console.error("Error saving feedback:", err);
    alert("Error saving feedback. Please try again.");
  }
});

document.getElementById("cancelIcon").addEventListener("click", function() {
  if (confirm("Discard changes?")) {
    exitEditMode();
  }
});

function exitEditMode() {
  openFeedbackModal(window.currentFeedback);
}

function openFeedbackModal(feedback) {
  document.getElementById("modalTitle").innerText = feedback.title;
  document.getElementById("modalText").innerText = feedback.text;
  document.getElementById("modalTag").innerText = "Tag: " + feedback.tag;
  document.getElementById("modalStatus").innerText = "Status: " + feedback.status;
  if (feedback.screenshot) {
    document.getElementById("modalScreenshot").src = "/static/uploads/" + feedback.screenshot;
    document.getElementById("modalScreenshotWrapper").style.display = "block";
  } else {
    document.getElementById("modalScreenshotWrapper").style.display = "none";
  }
  document.getElementById("editControls").style.display = "none";
  document.getElementById("editIcon").style.display = "inline-block";
  window.currentFeedback = feedback;
  document.getElementById("feedbackModal").style.display = "flex";
}

document.getElementById("feedbackModal").addEventListener("click", function(e) {
  if (e.target === this) {
    closeFeedbackModal();
  }
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    if (document.getElementById("feedbackModal").style.display === "flex") {
      closeFeedbackModal();
    }
  }
});

function closeFeedbackModal() {
  document.getElementById("feedbackModal").style.display = "none";
  window.currentFeedback = null;
}

document.getElementById("modalScreenshotWrapper").addEventListener("click", function(e) {
  e.stopPropagation();
  openScreenshotModal();
});

function openScreenshotModal() {
  let src = document.getElementById("modalScreenshot").src;
  document.getElementById("enlargedScreenshot").src = src;
  document.getElementById("screenshotModal").style.display = "flex";
}

document.getElementById("screenshotModal").addEventListener("click", function(e) {
  if (e.target === this) {
    closeScreenshotModal();
  }
});

function closeScreenshotModal() {
  document.getElementById("screenshotModal").style.display = "none";
}

document.getElementById("downloadIcon").addEventListener("click", function(e) {
  e.stopPropagation();
  const link = document.createElement("a");
  const src = document.getElementById("modalScreenshot").src;
  link.href = src;
  link.download = window.currentFeedback ? window.currentFeedback.title + ".jpg" : "screenshot.jpg";
  link.click();
});

window.updateStatus = async function(feedbackId, newStatus) {
  try {
    await fetch("/update_status", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `feedback_id=${feedbackId}&new_status=${newStatus}`
    });
    await window.loadFeedbacks();
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

function hidePoweruserElements() {

     // hide elements for normal users
    if (window.currentUserRole !== "poweruser") {
        // hide the edit icon:
        const editIcon = document.getElementById("editIcon");
        if (editIcon) {
            editIcon.style.display = "none";
        }
        // hide the quick actions:
        document.querySelectorAll(".action-cell").forEach(cell => {
            cell.style.setProperty("display", "none", "important");
			cell.classList.add("d-none");
		});
        // hide bulk actions:
        const bulkButtons = document.querySelectorAll("[id^='bulk']");
        bulkButtons.forEach(btn => btn.style.display = "none");
        // hide the sync button:
        if (syncButton) {
            syncButton.style.display = "none";
        }
    }
	
}
