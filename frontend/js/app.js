document.addEventListener('DOMContentLoaded', () => {
    const photoGallery = document.getElementById('photo-gallery');
    const submitVoteButton = document.getElementById('submit-vote');
    const voteStatus = document.getElementById('vote-status');
    const selectionCountDisplay = document.getElementById('selection-count');

    // Mode toggle buttons
    const voteModeBtn = document.getElementById('vote-mode-btn');
    const browseModeBtn = document.getElementById('browse-mode-btn');
    const voteModeBtnRight = document.getElementById('vote-mode-btn-right');
    const browseModeBtnRight = document.getElementById('browse-mode-btn-right');

    // Lightbox elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    
    const MAX_SELECTIONS = 25;
    let selectedPhotos = new Set();
    let currentMode = 'vote'; // 'vote' or 'browse'
    let allPhotosData = []; // To store all fetched photo data
    let currentLightboxIndex = -1;
    let imagePreviewPopup = null; // Variable to hold the preview popup element
    let username = ''; // Variable to store the username

    function promptForUsername() {
        username = prompt("請輸入您的名稱：", "");
        if (!username || username.trim() === "") {
            username = "匿名使用者"; // Default if no name is entered
            alert("您將以「匿名使用者」的身份投票。");
        }
        // You could display the username somewhere on the page if desired
        // For example: document.getElementById('username-display').textContent = `投票者: ${username}`;
    }

    // Helper function to preload an image
    function preloadImage(url) {
        const img = new Image();
        img.src = url;
    }

    async function fetchPhotos() {
        try {
            const response = await fetch('/api/available-photos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const photos = await response.json();
            allPhotosData = photos; // Store photos for lightbox
            renderPhotos(photos);
        } catch (error) {
            console.error('Failed to fetch photos:', error);
            photoGallery.innerHTML = '<p>Error loading photos. Please try again later.</p>';
        }
    }

    function renderPhotos(photos) {
        photoGallery.innerHTML = ''; // Clear existing photos
        if (photos.length === 0) {
            photoGallery.innerHTML = '<p>No photos available for voting at the moment.</p>';
            if (currentMode === 'vote') {
                selectionCountDisplay.textContent = `Selected: 0 / ${MAX_SELECTIONS}`;
                submitVoteButton.disabled = true;
            }
            return;
        }
        photos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.classList.add('photo-item');
            item.dataset.filename = photo.filename;

            const img = document.createElement('img');
            img.src = photo.path; 
            img.alt = photo.filename;
            img.onerror = () => { 
                item.innerHTML = `<p>Error loading ${photo.filename}</p>`;
            };

            const filenameOverlay = document.createElement('div');
            filenameOverlay.classList.add('filename-overlay');
            filenameOverlay.textContent = photo.filename;
            
            item.appendChild(img);
            item.appendChild(filenameOverlay);

            item.addEventListener('click', () => handlePhotoClick(item, photo, index));

            // Add mouseenter and mouseleave listeners for image preview
            item.addEventListener('mouseenter', (event) => {
                if (currentMode === 'vote') {
                    showImagePreview(photo.path, event);
                }
            });
            item.addEventListener('mouseleave', () => {
                if (currentMode === 'vote') {
                    hideImagePreview();
                }
            });

            photoGallery.appendChild(item);
        });
        if (currentMode === 'vote') {
            updateSelectionCount();
        }
    }

    function handlePhotoClick(item, photo, index) {
        if (currentMode === 'vote') {
            toggleSelection(item, photo.filename);
        } else { // browse mode
            openLightbox(index);
        }
    }

    function toggleSelection(item, filename) {
        if (selectedPhotos.has(filename)) {
            selectedPhotos.delete(filename);
            item.classList.remove('selected');
        } else {
            if (selectedPhotos.size < MAX_SELECTIONS) {
                selectedPhotos.add(filename);
                item.classList.add('selected');
            } else {
                alert(`You can select a maximum of ${MAX_SELECTIONS} photos.`);
            }
        }
        updateSelectionCount();
    }

    function updateSelectionCount() {
        selectionCountDisplay.textContent = `Selected: ${selectedPhotos.size} / ${MAX_SELECTIONS}`;
        submitVoteButton.disabled = selectedPhotos.size === 0;
    }

    // Image Preview Functions
    function showImagePreview(photoPath, event) {
        hideImagePreview(); // Remove any existing preview

        imagePreviewPopup = document.createElement('div');
        imagePreviewPopup.id = 'image-preview-popup';
        
        const img = document.createElement('img');
        img.src = photoPath;
        img.alt = 'Image Preview';
        imagePreviewPopup.appendChild(img);
        
        document.body.appendChild(imagePreviewPopup);

        // Position the popup near the mouse cursor
        // Adjustments to keep it within viewport
        const popupWidth = imagePreviewPopup.offsetWidth;
        const popupHeight = imagePreviewPopup.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = event.pageX + 15; // 15px offset from cursor
        let y = event.pageY + 15;

        if (x + popupWidth > viewportWidth + scrollX) {
            x = event.pageX - popupWidth - 15; // Show on the left if not enough space on right
        }
        if (x < scrollX) { // Ensure it doesn't go off the left edge
            x = scrollX + 5;
        }

        if (y + popupHeight > viewportHeight + scrollY) {
            y = event.pageY - popupHeight - 15; // Show above if not enough space below
        }
        if (y < scrollY) { // Ensure it doesn't go off the top edge
            y = scrollY + 5;
        }

        imagePreviewPopup.style.left = `${x}px`;
        imagePreviewPopup.style.top = `${y}px`;
    }

    function hideImagePreview() {
        if (imagePreviewPopup) {
            imagePreviewPopup.remove();
            imagePreviewPopup = null;
        }
    }


    // Lightbox functions
    function openLightbox(index) {
        if (index < 0 || index >= allPhotosData.length) {
            console.error("Invalid lightbox index:", index);
            return;
        }
        currentLightboxIndex = index;
        const photo = allPhotosData[index];
        lightboxModal.style.display = 'block';
        lightboxImg.src = photo.path;
        lightboxCaption.textContent = photo.filename;

        lightboxPrev.style.display = (index === 0) ? 'none' : 'block';
        lightboxNext.style.display = (index === allPhotosData.length - 1) ? 'none' : 'block';

        // Preload next and previous images
        if (index + 1 < allPhotosData.length) {
            preloadImage(allPhotosData[index + 1].path);
        }
        if (index - 1 >= 0) {
            preloadImage(allPhotosData[index - 1].path);
        }
    }

    function closeLightbox() {
        lightboxModal.style.display = 'none';
    }

    function showNextPhoto() {
        if (currentLightboxIndex < allPhotosData.length - 1) {
            openLightbox(currentLightboxIndex + 1);
        }
    }

    function showPrevPhoto() {
        if (currentLightboxIndex > 0) {
            openLightbox(currentLightboxIndex - 1);
        }
    }

    // Event listeners for lightbox
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevPhoto);
    lightboxNext.addEventListener('click', showNextPhoto);
    // Optional: Close lightbox when clicking outside the image
    lightboxModal.addEventListener('click', (event) => {
        if (event.target === lightboxModal) { // Clicked on the background
            closeLightbox();
        }
    });
     // Keyboard navigation for lightbox
    document.addEventListener('keydown', (event) => {
        if (lightboxModal.style.display === 'block') {
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowRight') {
                showNextPhoto();
            } else if (event.key === 'ArrowLeft') {
                showPrevPhoto();
            }
        }
    });


    // Mode switching logic
    function setMode(mode) {
        hideImagePreview(); // Hide preview when mode changes
        currentMode = mode;
        if (mode === 'vote') {
            document.body.classList.remove('browse-mode');
            voteModeBtn.classList.add('active');
            browseModeBtn.classList.remove('active');
            voteModeBtnRight.classList.add('active');
            browseModeBtnRight.classList.remove('active');
            
            selectionCountDisplay.style.display = 'block';
            submitVoteButton.style.display = 'block';
            updateSelectionCount(); // Restore selection count and button state

            // Re-apply 'selected' class to items based on selectedPhotos
            document.querySelectorAll('.photo-item').forEach(item => {
                if (selectedPhotos.has(item.dataset.filename)) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });

        } else { // browse mode
            document.body.classList.add('browse-mode');
            browseModeBtn.classList.add('active');
            voteModeBtn.classList.remove('active');
            browseModeBtnRight.classList.add('active');
            voteModeBtnRight.classList.remove('active');

            selectionCountDisplay.style.display = 'none';
            submitVoteButton.style.display = 'none';
            
            // Clear visual selection when switching to browse mode
            document.querySelectorAll('.photo-item.selected').forEach(el => el.classList.remove('selected'));
            // Note: selectedPhotos set is not cleared here, so selections are remembered if user switches back.
            // If you want to clear selections on mode switch, uncomment:
            // selectedPhotos.clear();
        }
    }

    voteModeBtn.addEventListener('click', () => setMode('vote'));
    browseModeBtn.addEventListener('click', () => setMode('browse'));
    voteModeBtnRight.addEventListener('click', () => setMode('vote'));
    browseModeBtnRight.addEventListener('click', () => setMode('browse'));


    submitVoteButton.addEventListener('click', async () => {
        if (selectedPhotos.size === 0) {
            alert('Please select at least one photo to vote.');
            return;
        }
        if (!username || username.trim() === "") {
            alert('無法獲取使用者名稱，請重新整理頁面再試。');
            return;
        }

        voteStatus.textContent = 'Submitting votes...';
        submitVoteButton.disabled = true;

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: username, // Add username to the request
                    selected_photos: Array.from(selectedPhotos) 
                }),
            });

            if (response.ok) {
                const result = await response.json();
                voteStatus.innerHTML = `投票成功! ${result.message} <a href="https://youtube.com/shorts/CUeVEBtWJ5Q?feature=share" target="_blank">來自深淵的餽贈</a>`;
                selectedPhotos.clear();
                document.querySelectorAll('.photo-item.selected').forEach(el => el.classList.remove('selected'));
                updateSelectionCount();
                 // Optionally redirect or clear selection after a delay
                setTimeout(() => { 
                    voteStatus.textContent = ''; 
                    voteStatus.innerHTML = ''; // Clear innerHTML as well
                }, 10000); // Increased timeout to 10 seconds
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.detail || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to submit votes:', error);
            voteStatus.textContent = `Error: ${error.message}`;
        } finally {
            // Re-enable button only if there was an error and user might want to retry
            // If successful, they should probably re-select or be navigated away
            if (!voteStatus.textContent.startsWith('投票成功')) {
                 submitVoteButton.disabled = selectedPhotos.size === 0;
            }
        }
    });

    promptForUsername(); // Prompt for username when the page loads
    fetchPhotos();
    setMode('vote'); // Initialize in vote mode
});
