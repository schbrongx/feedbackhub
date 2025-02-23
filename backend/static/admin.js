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

    // Event listener for "New Feedback" select-all checkbox
    const selectAllNew = document.getElementById("selectAllNew");
    selectAllNew.addEventListener("change", function() {
        const rowCheckboxes = document.querySelectorAll("#feedbackTableNew .rowCheckbox");
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllNew.checked;
        });
        updateBulkActionButtons("New");
    });

    // Event listener for "Processed Feedback" select-all checkbox (only for visible rows)
    const selectAllProcessed = document.getElementById("selectAllProcessed");
    selectAllProcessed.addEventListener("change", function() {
        const rowCheckboxes = document.querySelectorAll("#feedbackTableProcessed .rowCheckbox");
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllProcessed.checked;
        });
        updateBulkActionButtons("Processed");
    });

    // Helper: update bulk action buttons based on selected checkboxes
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

    // Update funnel icon for tag filter using Bootstrap Icons
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
    // Update funnel icon for status filter using Bootstrap Icons
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

    // Populate tag filter dropdown based on processed feedback data
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

    // Populate status filter dropdown based on processed feedback data
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

    // Render processed feedback rows applying tag and status filters (if any)
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
            const truncatedText = feedback.text.length > 40 ? feedback.text.substring(0, 40) + "..." : feedback.text;
            const previewImage = feedback.screenshot ? 
                `<img src="/static/uploads/${feedback.screenshot}" alt="Screenshot" style="width: 50px; height: 50px; object-fit: cover;">` : 
                `<div style="width: 50px; height: 50px; background-color: #ccc; display: flex; align-items: center; justify-content: center;">N/A</div>`;
            let formattedTimestamp = "";
            if (feedback.created_at) {
                const ts = new Date(feedback.created_at);
                formattedTimestamp = ts.toLocaleString();
            }
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="rowCheckbox" data-id="${feedback.id}">
                </td>
                <td>${feedback.id}</td>
                <td>${previewImage}</td>
                <td>
                    ${feedback.title} (${truncatedText})
                    <br>
                    <small style="color: grey;">${formattedTimestamp}</small>
                </td>
                <td>${feedback.tag}</td>
                <td>${feedback.status}</td>
                <td>
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
                </td>
            `;
            const rowCheckbox = row.querySelector(".rowCheckbox");
            rowCheckbox.addEventListener("change", function() {
                const allCheckboxes = feedbackTableProcessed.querySelectorAll(".rowCheckbox");
                const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                document.getElementById("selectAllProcessed").checked = allChecked;
                updateBulkActionButtons("Processed");
            });
            feedbackTableProcessed.appendChild(row);
        });
    }

    async function loadFeedbacks() {
        try {
            // Retrieve stored filters
            const storedTags = localStorage.getItem("activeTagFilters");
            if (storedTags) {
                activeTagFilters = JSON.parse(storedTags);
            }
            const storedStatuses = localStorage.getItem("activeStatusFilters");
            if (storedStatuses) {
                activeStatusFilters = JSON.parse(storedStatuses);
            }
            const response = await fetch("/feedbacks");
            const feedbacks = await response.json();
            
            feedbackTableNew.innerHTML = "";
            // Reset processed feedback data
            processedFeedbackData = [];
            let totalCount = 0;
            let acceptedCount = 0;
            let spamCount = 0;
            
            feedbacks.forEach(feedback => {
                totalCount++;
                if (feedback.status === "accepted") acceptedCount++;
                if (feedback.status === "spam") spamCount++;
                
                if (feedback.status === "submitted") {
                    // Render in New Feedback table
                    const truncatedText = feedback.text.length > 40 ? feedback.text.substring(0, 40) + "..." : feedback.text;
                    const previewImage = feedback.screenshot ? 
                        `<img src="/static/uploads/${feedback.screenshot}" alt="Screenshot" style="width: 50px; height: 50px; object-fit: cover;">` : 
                        `<div style="width: 50px; height: 50px; background-color: #ccc; display: flex; align-items: center; justify-content: center;">N/A</div>`;
                    let formattedTimestamp = "";
                    if (feedback.created_at) {
                        const ts = new Date(feedback.created_at);
                        formattedTimestamp = ts.toLocaleString();
                    }
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>
                            <input type="checkbox" class="rowCheckbox" data-id="${feedback.id}">
                        </td>
                        <td>${feedback.id}</td>
                        <td>${previewImage}</td>
                        <td>
                            ${feedback.title} (${truncatedText})
                            <br>
                            <small style="color: grey;">${formattedTimestamp}</small>
                        </td>
                        <td>${feedback.tag}</td>
                        <td>${feedback.status}</td>
                        <td>
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
                        </td>
                    `;
                    const rowCheckbox = row.querySelector(".rowCheckbox");
                    rowCheckbox.addEventListener("change", function() {
                        const allCheckboxes = feedbackTableNew.querySelectorAll(".rowCheckbox");
                        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                        document.getElementById("selectAllNew").checked = allChecked;
                        updateBulkActionButtons("New");
                    });
                    feedbackTableNew.appendChild(row);
                } else {
                    // For processed feedback, store for filtering/rendering
                    processedFeedbackData.push(feedback);
                }
            });
            
            totalFeedback.innerText = `Total Feedback: ${totalCount}`;
            acceptedFeedback.innerText = `Accepted: ${acceptedCount}`;
            spamFeedback.innerText = `Spam: ${spamCount}`;
            
            // Update both dropdowns and render processed feedback using current filters
            updateTagFilterDropdown();
            updateStatusFilterDropdown();
            renderProcessedFeedbacks();
            updateFunnelIcon();
            updateStatusFilterIcon();
        } catch (error) {
            console.error("Error loading feedbacks:", error);
        }
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

    // Bulk Action Event Listeners for update actions (for Accept, Duplicate, and Spam)
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

    // Bulk Action Event Listener for delete action
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

    // Add bulk update listeners for both tables (Accept, Duplicate, Spam)
    addBulkUpdateListener("New", "Accept", "accepted");
    addBulkUpdateListener("New", "Duplicate", "duplicate");
    addBulkUpdateListener("New", "Spam", "spam");
    addBulkUpdateListener("Processed", "Accept", "accepted");
    addBulkUpdateListener("Processed", "Duplicate", "duplicate");
    addBulkUpdateListener("Processed", "Spam", "spam");

    // Add bulk delete listeners for both tables
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
    
    // Expose loadFeedbacks globally so that quick actions can call it
    window.loadFeedbacks = loadFeedbacks;
});
    
// Update quick actions to call the globally defined loadFeedbacks()
window.updateStatus = async function(feedbackId, newStatus) {
    try {
        await fetch("/update_status", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `feedback_id=${feedbackId}&new_status=${newStatus}`
        });
        await window.loadFeedbacks(); // now loadFeedbacks is globally available
    } catch (error) {
        console.error("Error updating status:", error);
    }
};
