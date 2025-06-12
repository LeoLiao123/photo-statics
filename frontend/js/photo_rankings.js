document.addEventListener('DOMContentLoaded', () => {
    const photoRankingDisplay = document.getElementById('photo-ranking-display');
    const POLLING_INTERVAL = 5000; // 5 seconds
    let enlargedPreviewPopup = null;

    const groupNameMapping = {
        1: '阿財',
        2: '鼠鼠',
        3: 'Ting',
        4: '冠名',
        5: '五',
        6: '六',
        7: '七',
        8: '八',
        9: '九',
        10: '十'
        // 您可以根據需要擴展此對應
    };

    async function fetchPhotoRankings() {
        try {
            const response = await fetch('/api/photos/ranking');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rankings = await response.json();
            renderPhotoRankings(rankings);
        } catch (error) {
            console.error('Failed to fetch photo rankings:', error);
            if (photoRankingDisplay) photoRankingDisplay.innerHTML = `<p>Error loading photo rankings. Please try again later.</p>`;
        }
    }

    function renderPhotoRankings(rankings) {
        if (!photoRankingDisplay) return;
        photoRankingDisplay.innerHTML = ''; // Clear existing content

        if (rankings.length === 0) {
            photoRankingDisplay.innerHTML = `<p>No photo votes recorded yet.</p>`;
            return;
        }

        const topThreeContainer = document.createElement('div');
        topThreeContainer.id = 'top-three-container';
        photoRankingDisplay.appendChild(topThreeContainer);

        const otherPhotosContainer = document.createElement('div');
        otherPhotosContainer.id = 'other-photos-container';
        photoRankingDisplay.appendChild(otherPhotosContainer);

        rankings.forEach((photo, index) => {
            const item = document.createElement('div');
            item.classList.add('photo-ranking-item');

            const rankDisplay = document.createElement('div');
            rankDisplay.classList.add('rank');
            rankDisplay.textContent = `排名: ${index + 1}`;

            const img = document.createElement('img');
            const photoPath = `/images/${photo.filename}.webp`;
            img.src = photoPath; 
            img.alt = `Rank ${index + 1} - ${photo.filename}`;

            const votesDisplay = document.createElement('div');
            votesDisplay.classList.add('votes');
            votesDisplay.textContent = `票數: ${photo.votes}`;
            
            const photographerName = groupNameMapping[photo.group_id] || `組別 ${photo.group_id}`;
            const photographerDisplay = document.createElement('div');
            photographerDisplay.classList.add('photographer-name');
            photographerDisplay.textContent = `拍攝者: ${photographerName}`;

            item.appendChild(rankDisplay);
            item.appendChild(img);
            item.appendChild(votesDisplay);
            item.appendChild(photographerDisplay);

            item.addEventListener('mouseenter', (event) => {
                showEnlargedPhotoPreview(event, photoPath, photographerName, photo.votes);
            });
            item.addEventListener('mouseleave', () => {
                hideEnlargedPhotoPreview();
            });

            if (index < 3) { // Top 3 photos
                item.classList.add('top-rank-item');
                topThreeContainer.appendChild(item);
            } else { // Other photos
                item.classList.add('other-rank-item');
                otherPhotosContainer.appendChild(item);
            }
        });
    }

    function showEnlargedPhotoPreview(event, photoPath, photographerName, votes) {
        hideEnlargedPhotoPreview(); // Remove any existing preview

        enlargedPreviewPopup = document.createElement('div');
        enlargedPreviewPopup.id = 'enlarged-photo-preview-popup';
        
        const imgPreview = document.createElement('img');
        imgPreview.src = photoPath;
        imgPreview.alt = 'Enlarged photo preview';
        
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('preview-details');
        
        const nameP = document.createElement('p');
        nameP.textContent = `拍攝者: ${photographerName}`;
        
        const votesP = document.createElement('p');
        votesP.textContent = `票數: ${votes}`;
        
        detailsDiv.appendChild(nameP);
        detailsDiv.appendChild(votesP);
        
        enlargedPreviewPopup.appendChild(imgPreview);
        enlargedPreviewPopup.appendChild(detailsDiv);
        
        document.body.appendChild(enlargedPreviewPopup);

        // Intelligent positioning logic
        const popupWidth = enlargedPreviewPopup.offsetWidth;
        const popupHeight = enlargedPreviewPopup.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = event.pageX + 20; // Offset from cursor
        let y = event.pageY + 20;

        // Adjust if popup goes off screen
        if (x + popupWidth > viewportWidth + scrollX) {
            x = event.pageX - popupWidth - 20; // Show on the left
        }
        if (x < scrollX) { // Ensure it doesn't go off the left edge
            x = scrollX + 5;
        }

        if (y + popupHeight > viewportHeight + scrollY) {
            y = event.pageY - popupHeight - 20; // Show above
        }
        if (y < scrollY) { // Ensure it doesn't go off the top edge
            y = scrollY + 5;
        }

        enlargedPreviewPopup.style.left = `${x}px`;
        enlargedPreviewPopup.style.top = `${y}px`;
    }

    function hideEnlargedPhotoPreview() {
        if (enlargedPreviewPopup) {
            enlargedPreviewPopup.remove();
            enlargedPreviewPopup = null;
        }
    }

    function pollData() {
        fetchPhotoRankings();
    }

    // Initial fetch
    pollData();
    // Set up polling
    setInterval(pollData, POLLING_INTERVAL);
});
