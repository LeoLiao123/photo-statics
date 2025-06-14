import { createApp } from 'vue';

// Import global styles used by index.html
import './css/style.css';

// Simple Vue app for demonstration
const VueApp = {
  data() {
    return {
      message: 'Vue is integrated!'
    };
  },
  template: '<p>{{ message }}</p>'
};

// Mount Vue app to the placeholder div in index.html
if (document.getElementById('vue-app-placeholder')) {
  createApp(VueApp).mount('#vue-app-placeholder');
}


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
    let allPhotosData = []; 
    let currentLightboxIndex = -1;
    let imagePreviewPopup = null; 
    let username = ''; 
    let lazyLoadObserver; 

    submitVoteButton.textContent = 'Submit Vote'; // Restore normal button state
    submitVoteButton.disabled = true;

    function promptForUsername() {
        username = prompt("Please enter your name:", "");
        if (!username || username.trim() === "") {
            username = "Anonymous User"; // Default if no name is entered
            alert("You will vote as 'Anonymous User'.");
        }
        // For example: document.getElementById('username-display').textContent = `Voter: ${username}`;
    }

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
            allPhotosData = photos; 
            renderPhotos(photos);
        } catch (error) {
            console.error('Failed to fetch photos:', error);
            photoGallery.innerHTML = '<p>Error loading photos. Please try again later.</p>';
        }
    }

    function renderPhotos(photos) {
        photoGallery.innerHTML = ''; 
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
            img.dataset.src = photo.path; // Lazy loading: store actual src in data-src
            img.alt = photo.filename;
            img.classList.add('lazy-load'); 

            const filenameOverlay = document.createElement('div');
            filenameOverlay.classList.add('filename-overlay');
            filenameOverlay.textContent = photo.filename;
            
            item.appendChild(img);
            item.appendChild(filenameOverlay);

            item.addEventListener('click', () => handlePhotoClick(item, photo, index));

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

        observeLazyLoadImages(); 

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

    function showImagePreview(photoPath, event) {
        hideImagePreview(); 

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

        let x = event.pageX + 15; 
        let y = event.pageY + 15;

        if (x + popupWidth > viewportWidth + scrollX) {
            x = event.pageX - popupWidth - 15; 
        }
        if (x < scrollX) { 
            x = scrollX + 5;
        }

        if (y + popupHeight > viewportHeight + scrollY) {
            y = event.pageY - popupHeight - 15; 
        }
        if (y < scrollY) { 
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

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrevPhoto);
    lightboxNext.addEventListener('click', showNextPhoto);
    lightboxModal.addEventListener('click', (event) => {
        if (event.target === lightboxModal) { // Clicked on the background
            closeLightbox();
        }
    });
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

    function initializeLazyLoadObserver() {
        lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const originalSrc = img.dataset.src;

                    img.onerror = () => {
                        const photoItem = img.closest('.photo-item');
                        if (photoItem) {
                            photoItem.innerHTML = `<p>Error loading ${img.alt}</p>`;
                        }
                        // Optionally, remove the img or style it as broken
                        // img.remove(); 
                    };
                    
                    img.src = originalSrc;
                    img.classList.remove('lazy-load');
                    // Optional: add a 'loaded' class if you want to style loaded images
                    // img.classList.add('loaded'); 
                    observer.unobserve(img);
                }
            });
        }, { 
            rootMargin: "0px 0px 200px 0px" // Start loading images 200px before they enter the viewport
        });
    }

    function observeLazyLoadImages() {
        if (!lazyLoadObserver) return; 
        const lazyImages = photoGallery.querySelectorAll('img.lazy-load');
        lazyImages.forEach(img => {
            lazyLoadObserver.observe(img);
        });
    }

    function setMode(mode) {
        hideImagePreview(); 
        currentMode = mode;
        if (mode === 'vote') {
            document.body.classList.remove('browse-mode');
            voteModeBtn.classList.add('active');
            browseModeBtn.classList.remove('active');
            voteModeBtnRight.classList.add('active');
            browseModeBtnRight.classList.remove('active');
            
            selectionCountDisplay.style.display = 'block';
            submitVoteButton.style.display = 'block';
            updateSelectionCount(); 

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
            
            document.querySelectorAll('.photo-item.selected').forEach(el => el.classList.remove('selected'));
            // Note: selectedPhotos set is not cleared here, selections are remembered if user switches back.
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
            alert('Cannot get username, please refresh the page and try again.');
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
                    username: username, 
                    selected_photos: Array.from(selectedPhotos) 
                }),
            });

            if (response.ok) {
                const result = await response.json();
                voteStatus.innerHTML = `Vote successful! ${result.message}`;
                selectedPhotos.clear();
                document.querySelectorAll('.photo-item.selected').forEach(el => el.classList.remove('selected'));
                updateSelectionCount();
                setTimeout(() => { 
                    voteStatus.textContent = ''; 
                    voteStatus.innerHTML = ''; 
                }, 5000);
            } else {
                const errorResult = await response.json();
                throw new Error(errorResult.detail || `HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to submit votes:', error);
            voteStatus.textContent = `Error: ${error.message}`;
        } finally {
            // Re-enable button only if there was an error and user might want to retry
            if (!voteStatus.textContent.startsWith('Vote successful')) {
                 submitVoteButton.disabled = selectedPhotos.size === 0;
            }
        }
    });

    initializeLazyLoadObserver(); 
    promptForUsername(); 
    fetchPhotos();
    setMode('vote'); 
});