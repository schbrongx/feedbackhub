// file: script.js
document.addEventListener("DOMContentLoaded", async function() {
    const feedbackTableNew = document.getElementById("feedbackTableNew");
    const feedbackTableProcessed = document.getElementById("feedbackTableProcessed");
    const syncButton = document.getElementById("syncButton");

    async function loadFeedbacks() {
        try {
            const response = await fetch("/feedbacks");
            const feedbacks = await response.json();
            
            feedbackTableNew.innerHTML = "";
            feedbackTableProcessed.innerHTML = "";
            
            feedbacks.forEach(feedback => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${feedback.id}</td>
                    <td>${feedback.title}</td>
                    <td>${feedback.tag}</td>
                    <td>${feedback.status}</td>
                    <td>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'reviewed')">Mark Reviewed</a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'accepted')">Accept</a></li>
                                <li><a class="dropdown-item" href="#" onclick="updateStatus(${feedback.id}, 'duplicate')">Mark Duplicate</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeedback(${feedback.id})">Delete</a></li>
                            </ul>
                        </div>
                    </td>
                `;
                
                if (feedback.status === "submitted") {
                    feedbackTableNew.appendChild(row);
                } else {
                    feedbackTableProcessed.appendChild(row);
                }
            });
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

    async function deleteFeedback(feedbackId) {
        if (!confirm("Are you sure you want to delete this feedback?")) {
            return;
        }
        try {
            await fetch("/delete_feedback", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `feedback_id=${feedbackId}`
            });
            location.reload();
        } catch (error) {
            console.error("Error deleting feedback:", error);
        }
    }

    syncButton.addEventListener("click", syncFeedbacks);
    await loadFeedbacks();
});

async function updateStatus(feedbackId, newStatus) {
    try {
        await fetch("/update_status", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `feedback_id=${feedbackId}&new_status=${newStatus}`
        });
        location.reload();
    } catch (error) {
        console.error("Error updating status:", error);
    }
}
