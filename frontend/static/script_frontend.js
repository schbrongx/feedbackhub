// file: script_frontend.js
document.getElementById("feedbackForm").addEventListener("submit", async function(event) {
    event.preventDefault();  // Prevent default submit

    const submitButton = document.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.innerText = "Submitted...";
    submitButton.classList.add("btn-secondary");
    submitButton.classList.remove("btn-primary");

    const title = document.getElementById("title").value;
    const text = document.getElementById("text").value;
    const tag = document.getElementById("tag").value;
    const contact = document.getElementById("contact").value;
    const fileInput = document.getElementById("screenshot");
    const responseMessage = document.getElementById("responseMessage");

    let base64Screenshot = pastedScreenshot || "";  // In case it was pasted

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        base64Screenshot = await convertToBase64(file);
    }

    const data = {
        title: title,
        text: text,
        tag: tag,
        screenshot: base64Screenshot,
        contact: contact ? { "name": contact } : {}
    };

    try {
        const response = await fetch("/api/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer supersecretkey123"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        responseMessage.classList.remove("d-none", "alert-danger");
        responseMessage.classList.add("alert", "alert-success");
        responseMessage.innerText = result.message || "Feedback submitted successfully!";
        
        submitButton.parentNode.insertBefore(responseMessage, submitButton);
		// reset the form after 5 seconds
        setTimeout(function() {
            submitButton.disabled = false;
            submitButton.innerText = "Submit";
            submitButton.classList.add("btn-primary");
            submitButton.classList.remove("btn-secondary");
            document.getElementById("feedbackForm").reset();
            responseMessage.classList.add("d-none"); // hide response message
			const previewImage = document.getElementById("previewImage");
            previewImage.src = "";
            previewImage.classList.add("d-none");
            pastedScreenshot = "";
        }, 5000)
    } catch (error) {
        responseMessage.classList.remove("d-none", "alert-success");
        responseMessage.classList.add("alert", "alert-danger");
        responseMessage.innerText = "Error submitting feedback!";
                submitButton.parentNode.insertBefore(responseMessage, submitButton);
		// reset only the button after 10 seconds in case of an error
        setTimeout(function() {
            submitButton.disabled = false;
            submitButton.innerText = "Submit";
            submitButton.classList.add("btn-primary");
            submitButton.classList.remove("btn-secondary");
            responseMessage.classList.add("d-none"); // hide response message
        }, 10000)
    }
});

// Convert a file to base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = error => reject(error);
    });
}

// Handle screenshots from the clipboard
let pastedScreenshot = "";

document.getElementById("pasteArea").addEventListener("paste", async function(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;

    for (let item of items) {
        if (item.type.startsWith("image")) {
            const file = item.getAsFile();
            pastedScreenshot = await convertToBase64(file);

            // Show a preview
            const previewImage = document.getElementById("previewImage");
            previewImage.src = "data:image/png;base64," + pastedScreenshot;
            previewImage.classList.remove("d-none");
        }
    }
});