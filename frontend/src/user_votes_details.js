// Import styles used by user_votes_details.html
import './css/style.css';
import './css/photo_rankings.css'; // Reusing some styles
import './css/user_votes_details.css';

document.addEventListener('DOMContentLoaded', () => {
    const userSelect = document.getElementById('user-select');
    const userPhotoDisplay = document.getElementById('user-photo-display');
    const selectedUserHeading = document.getElementById('selected-user-heading');
    let enlargedPreviewPopup = null;

    const groupNameMapping = { // Should be consistent with other JS files
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
    };

    async function fetchVotedUsers() {
        try {
            const response = await fetch('/api/users/voted');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const users = await response.json();
            populateUserDropdown(users);
        } catch (error) {
            console.error('Failed to fetch voted users:', error);
            userSelect.innerHTML = '<option value="">Unable to load users</option>';
        }
    }

    function populateUserDropdown(users) {
        if (users.length === 0) {
            userSelect.innerHTML = '<option value="">No users have voted yet</option>';
            return;
        }
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.username;
            userSelect.appendChild(option);
        });
    }

    async function fetchAndDisplayUserVotes(username) {
        if (!username) {
            userPhotoDisplay.innerHTML = '<p>Please select a user to view their voted photos.</p>';
            selectedUserHeading.textContent = '';
            return;
        }
        selectedUserHeading.textContent = `${username}'s voted choices:`;
        userPhotoDisplay.innerHTML = '<p>Loading...</p>';

        try {
            const response = await fetch(`/api/users/${username}/votes`);
            if (!response.ok) {
                if (response.status === 404) {
                     userPhotoDisplay.innerHTML = `<p>Could not find voting records for user ${username}.</p>`;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }
            const votedPhotos = await response.json();
            renderUserVotedPhotos(votedPhotos);
        } catch (error) {
            console.error(`Failed to fetch votes for ${username}:`, error);
            userPhotoDisplay.innerHTML = `<p>Failed to load voting records for ${username}.</p>`;
        }
    }

    function renderUserVotedPhotos(photos) {
        userPhotoDisplay.innerHTML = '';
        if (photos.length === 0) {
            userPhotoDisplay.innerHTML = '<p>This user has no voting records, or the selected photos no longer exist.</p>';
            return;
        }

        photos.forEach(photo => {
            const item = document.createElement('div');
            item.classList.add('user-photo-display-item'); 

            const img = document.createElement('img');
            const photoPath = photo.photo_path; // Path provided by backend
            img.src = photoPath; 
            img.alt = photo.photo_filename;

            const photographerName = groupNameMapping[photo.group_id] || `Group ${photo.group_id}`;
            const photographerDisplay = document.createElement('div');
            photographerDisplay.classList.add('photographer-name-detail');
            photographerDisplay.textContent = `拍攝者: ${photographerName}`;
            
            const filenameDisplay = document.createElement('div');
            filenameDisplay.classList.add('photo-filename-detail');
            filenameDisplay.textContent = `檔名: ${photo.photo_filename}`;

            item.appendChild(img);
            item.appendChild(photographerDisplay);
            item.appendChild(filenameDisplay);

            // Add mouseenter and mouseleave listeners for image preview
            item.addEventListener('mouseenter', (event) => {
                // For user votes, we are showing what they selected, not the photo's total rank/votes.
                showEnlargedPhotoPreview(event, photoPath, photographerName, `Selected at: ${new Date(photo.timestamp).toLocaleString()}`);
            });
            item.addEventListener('mouseleave', () => {
                hideEnlargedPhotoPreview();
            });

            userPhotoDisplay.appendChild(item);
        });
    }

    // Function to show enlarged photo preview (adapted from photo_rankings.js)
    function showEnlargedPhotoPreview(event, photoPath, photographerName, detailText) {
        hideEnlargedPhotoPreview(); 

        enlargedPreviewPopup = document.createElement('div');
        enlargedPreviewPopup.id = 'enlarged-photo-preview-popup'; // Use the same ID to reuse CSS
        
        const imgPreview = document.createElement('img');
        imgPreview.src = photoPath;
        imgPreview.alt = 'Enlarged photo preview';
        
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('preview-details');
        
        const nameP = document.createElement('p');
        nameP.textContent = `Photographer: ${photographerName}`;
        
        const detailP = document.createElement('p'); // Changed from votesP
        detailP.textContent = detailText; // Display timestamp or other relevant detail
        
        detailsDiv.appendChild(nameP);
        detailsDiv.appendChild(detailP);
        
        enlargedPreviewPopup.appendChild(imgPreview);
        enlargedPreviewPopup.appendChild(detailsDiv);
        
        document.body.appendChild(enlargedPreviewPopup);

        const popupWidth = enlargedPreviewPopup.offsetWidth;
        const popupHeight = enlargedPreviewPopup.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let x = event.pageX + 20;
        let y = event.pageY + 20;

        if (x + popupWidth > viewportWidth + scrollX) {
            x = event.pageX - popupWidth - 20;
        }
        if (x < scrollX) {
            x = scrollX + 5;
        }
        if (y + popupHeight > viewportHeight + scrollY) {
            y = event.pageY - popupHeight - 20;
        }
        if (y < scrollY) {
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

    userSelect.addEventListener('change', (event) => {
        fetchAndDisplayUserVotes(event.target.value);
    });

    fetchVotedUsers(); // Initial fetch
});