const apiKey = import.meta.env.VITE_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;

document.addEventListener('DOMContentLoaded', function() {
    console.log('[INIT] DOM loaded');

    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');

    if (!uploadForm) {
        console.error('[ERROR] uploadForm not found');
        return;
    }

    uploadForm.addEventListener('submit', function(event) {
        console.log('[EVENT] form submit triggered');
        event.preventDefault();

        const imageFileInput = document.getElementById('imageFile');
        const titleInput = document.getElementById('imageTitle');

        if (!imageFileInput) {
            console.error('[ERROR] imageFile input not found');
            return;
        }

        if (!imageFileInput.files || imageFileInput.files.length === 0) {
            console.warn('[VALIDATION] no file selected');
            uploadStatus.innerHTML = 'image please';
            return;
        }

        const file = imageFileInput.files[0];
        const filename = titleInput.value.trim() || 'name';

        console.log('[FILE] name:', file.name);
        console.log('[FILE] size (bytes):', file.size);
        console.log('[FILE] type:', file.type);
        console.log('[META] filename used:', filename);

        uploadStatus.innerHTML = 'converting image to base64...';

        const reader = new FileReader();

        reader.onload = function() {
            console.log('[FILEREADER] load success');

            const result = reader.result;
            const base64String = result.substring(result.indexOf(',') + 1);

            console.log('[BASE64] length:', base64String.length);

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
                console.log('[RESPONSE] status:', response.status);
                console.log('[RESPONSE] ok:', response.ok);

                if (response.ok) {
                    uploadStatus.innerHTML = 'image sent successfully';
                } else {
                    uploadStatus.innerHTML = 'API error: ' + response.status;
                }
            })
            .catch(function(error) {
                console.error('[FETCH ERROR]', error);
                uploadStatus.innerHTML = 'error: ' + error.message;
            });
        };

        reader.onerror = function(err) {
            console.error('[FILEREADER ERROR]', err);
            uploadStatus.innerHTML = 'failed to read file';
        };

        console.log('[FILEREADER] starting readAsDataURL');
        reader.readAsDataURL(file);
    });
});