// Import styles used by user_votes_details.html
import './css/style.css';
import './css/photo_rankings.css'; // Reusing some styles
import './css/user_votes_details.css';

document.addEventListener('DOMContentLoaded', () => {
    const userSelect = document.getElementById('user-select');
    const userPhotoDisplay = document.getElementById('user-photo-display');
    const selectedUserHeading = document.getElementById('selected-user-heading');
    let enlargedPreviewPopup = null; // Variable for the preview popup

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
            userSelect.innerHTML = '<option value="">無法載入使用者</option>';
        }
    }

    function populateUserDropdown(users) {
        if (users.length === 0) {
            userSelect.innerHTML = '<option value="">尚無使用者投票</option>';
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
            userPhotoDisplay.innerHTML = '<p>請先選擇一位使用者以查看其投票的照片。</p>';
            selectedUserHeading.textContent = '';
            return;
        }
        selectedUserHeading.textContent = `${username} 的投票選擇：`;
        userPhotoDisplay.innerHTML = '<p>載入中...</p>';

        try {
            const response = await fetch(`/api/users/${username}/votes`);
            if (!response.ok) {
                if (response.status === 404) {
                     userPhotoDisplay.innerHTML = `<p>找不到使用者 ${username} 的投票紀錄。</p>`;
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return;
            }
            const votedPhotos = await response.json();
            renderUserVotedPhotos(votedPhotos);
        } catch (error) {
            console.error(`Failed to fetch votes for ${username}:`, error);
            userPhotoDisplay.innerHTML = `<p>載入 ${username} 的投票紀錄失敗。</p>`;
        }
    }

    function renderUserVotedPhotos(photos) {
        userPhotoDisplay.innerHTML = '';
        if (photos.length === 0) {
            userPhotoDisplay.innerHTML = '<p>此使用者沒有投票紀錄，或選擇的照片已不存在。</p>';
            return;
        }

        photos.forEach(photo => {
            const item = document.createElement('div');
            item.classList.add('user-photo-display-item'); 

            const img = document.createElement('img');
            const photoPath = photo.photo_path; // Path provided by backend
            img.src = photoPath; 
            img.alt = photo.photo_filename;

            const photographerName = groupNameMapping[photo.group_id] || `組別 ${photo.group_id}`;
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
                // For user votes, we don't have a separate 'votes' count per photo in this context,
                // as we are showing what they selected, not the photo's total rank/votes.
                // We can pass undefined or a relevant string if needed by showEnlargedPhotoPreview.
                // For now, let's adapt showEnlargedPhotoPreview or pass minimal info.
                showEnlargedPhotoPreview(event, photoPath, photographerName, `選擇時間: ${new Date(photo.timestamp).toLocaleString()}`);
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
        nameP.textContent = `拍攝者: ${photographerName}`;
        
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

    // Initial fetch
    fetchVotedUsers();
});