const apiUrl = "https://desktop-ojk12ss.tailb5236b.ts.net/print";

let currentIdempotencyKey = null;

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


document.addEventListener('DOMContentLoaded', function() {

    const uploadForm = document.getElementById('uploadForm');
    const uploadText = document.getElementById("uploadText");
    const uploadStatus = document.getElementById('uploadStatus');
    const imageFileInput = document.getElementById('fileInput');

    //Generate uuid when user uploads image
    if (imageFileInput) {
        imageFileInput.addEventListener('change', function(event) {
            if (this.files && this.files.length > 0) {
                currentIdempotencyKey = generateUUID();
                console.log('New UUID generated for uploaded file:', currentIdempotencyKey);
                uploadStatus.innerHTML = 'File selected - ready to submit';
            } else {
                currentIdempotencyKey = null;
            }
        });
    }

    // Text form submission
    uploadText.addEventListener("submit", function(event) {
        event.preventDefault();

        const textInput = document.getElementById("userText");
        
        if (!textInput) {
            return;
        }

        if (!textInput.value.trim()){
            uploadStatus.innerHTML = "no text :(";
            return;
        }

        const bytes = new TextEncoder().encode(textInput.value);
        let binary = "";
        bytes.forEach(b => binary += String.fromCharCode(b));
        const base64String = btoa(binary);

        uploadStatus.innerHTML = 'sending to api ...';

        const requestBody = {
            user: "frank",
            filename: "Name",
            fileBase64: base64String,
            idempotencyKey: currentIdempotencyKey
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        .then(function(response) {
            if (response.ok) {
                uploadStatus.innerHTML = 'text sent successfully';
            } 
        })
        .catch(function(error) {
            uploadStatus.innerHTML = "Error! (too many requests or printing turned off)";
        });
    });

    // Image form submission
    uploadForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const imageFileInput = document.getElementById('fileInput');

        if (!imageFileInput) {
            return;
        }

        if (!imageFileInput.files || imageFileInput.files.length === 0) {
            uploadStatus.innerHTML = "image please :(";
            return;
        }

        const file = imageFileInput.files[0];

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            uploadStatus.innerHTML = 'file must be JPG, JPEG, or PNG';
            return;
        }

        uploadStatus.innerHTML = 'converting image to base64...';

        const reader = new FileReader();

        reader.onload = function() {

            const result = reader.result;
            const base64String = result.substring(result.indexOf(',') + 1);

            const requestBody = {
                user: "frank",
                filename: "Name",
                fileBase64: base64String
            };

            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(function(response) {

                if (response.ok) {
                    uploadStatus.innerHTML = 'image sent successfully';
                } 
            })
            .catch(function(error) {
                uploadStatus.innerHTML = "Error! (too many requests or printing turned off)";
            });
        };

        reader.onerror = function(err) {
            uploadStatus.innerHTML = 'failed to read file';
        };

        reader.readAsDataURL(file);
    });
});