//upload logic

//set up url using secrets
const apiKey = import.meta.env.VITE_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;

document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');

    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const imageFileInput = document.getElementById('imageFile');
            const titleInput = document.getElementById('imageTitle');
            
            if (!imageFileInput.files || imageFileInput.files.length === 0) {
                uploadStatus.innerHTML = 'image please';
                return;
            }
            
            const file = imageFileInput.files[0];
            const filename = titleInput.value.trim() || 'name';
            
            uploadStatus.innerHTML = 'converting image to base64...';
            
            const reader = new FileReader();
            
            reader.onload = function() {
                const result = reader.result;
                const base64String = result.substring(result.indexOf(',') + 1);
                
                const requestBody = {
                    user: "frank",
                    filename: filename,
                    fileBase64: base64String
                };
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                .then(function(response) {
                    if (response.ok) {
                        uploadStatus.innerHTML = 'image sent successfully';
                    } else {
                        uploadStatus.innerHTML = 'API error: ' + response.status;
                    }
                })
                .catch(function(error) {
                    uploadStatus.innerHTML = 'error: ' + error.message;
                });
            };
            
            reader.onerror = function() {
                uploadStatus.innerHTML = 'failed to read file';
            };
            
            reader.readAsDataURL(file);
        });
    }
});