document.addEventListener('DOMContentLoaded', () => {
    const photoRankingBody = document.getElementById('photo-ranking-body');
    const groupRankingBody = document.getElementById('group-ranking-body');
    const POLLING_INTERVAL = 5000; // 5 seconds

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
            if (photoRankingBody) photoRankingBody.innerHTML = `<tr><td colspan="4">Error loading photo rankings.</td></tr>`;
        }
    }

    function renderPhotoRankings(rankings) {
        if (!photoRankingBody) return;
        photoRankingBody.innerHTML = ''; // Clear existing rows
        if (rankings.length === 0) {
            photoRankingBody.innerHTML = `<tr><td colspan="4">No photo votes recorded yet.</td></tr>`;
            return;
        }
        rankings.forEach((photo, index) => {
            const row = photoRankingBody.insertRow();
            row.insertCell().textContent = index + 1; // Rank
            
            const imgCell = row.insertCell();
            const img = document.createElement('img');
            // Assuming image path can be constructed or is available
            img.src = `/images/${photo.filename}.jpg`; 
            img.alt = photo.filename;
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.objectFit = 'cover';
            imgCell.appendChild(img);
            imgCell.append(` ${photo.filename}`);

            row.insertCell().textContent = groupNameMapping[photo.group_id] || photo.group_id; // 使用對應名稱
            row.insertCell().textContent = photo.votes;
        });
    }

    async function fetchGroupRankings() {
        try {
            const response = await fetch('/api/groups/ranking');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const rankings = await response.json();
            renderGroupRankings(rankings);
        } catch (error) {
            console.error('Failed to fetch group rankings:', error);
            if (groupRankingBody) groupRankingBody.innerHTML = `<tr><td colspan="3">Error loading group rankings.</td></tr>`;
        }
    }

    function renderGroupRankings(rankings) {
        if (!groupRankingBody) return;
        groupRankingBody.innerHTML = ''; // Clear existing rows
         if (rankings.length === 0) {
            groupRankingBody.innerHTML = `<tr><td colspan="3">No group votes recorded yet.</td></tr>`;
            return;
        }
        rankings.forEach((group, index) => {
            const row = groupRankingBody.insertRow();
            row.insertCell().textContent = index + 1; // Rank
            row.insertCell().textContent = groupNameMapping[group.group_id] || group.group_id; // 使用對應名稱
            row.insertCell().textContent = group.total_votes;
        });
    }

    function pollData() {
        fetchPhotoRankings();
        fetchGroupRankings();
    }

    // Initial fetch
    pollData();
    // Set up polling
    setInterval(pollData, POLLING_INTERVAL);
});
// 1-阿財 2. 鼠鼠 3. Ting