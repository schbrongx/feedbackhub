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
                        <button class="btn btn-sm btn-primary" onclick="updateStatus(${feedback.id}, 'reviewed')">Mark Reviewed</button>
                        <button class="btn btn-sm btn-success" onclick="updateStatus(${feedback.id}, 'accepted')">Accept</button>
                        <button class="btn btn-sm btn-warning" onclick="updateStatus(${feedback.id}, 'duplicate')">Mark Duplicate</button>
                        <button class="btn btn-sm btn-danger" onclick="updateStatus(${feedback.id}, 'spam')">Mark Spam</button>
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
