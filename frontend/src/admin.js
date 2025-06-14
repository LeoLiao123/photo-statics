// Import global styles used by admin.html
import './css/style.css';

document.addEventListener('DOMContentLoaded', () => {
    // photoRankingBody removed
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

    // fetchPhotoRankings function removed
    // renderPhotoRankings function removed

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
            const groupNameCell = row.insertCell();
            groupNameCell.textContent = groupNameMapping[group.group_id] || `組別 ${group.group_id}`; // 使用對應名稱或預設
            groupNameCell.classList.add('group-name-cell');
            
            const totalVotesCell = row.insertCell();
            totalVotesCell.textContent = group.total_votes;
            totalVotesCell.classList.add('total-votes-cell');
        });
    }

    function pollData() {
        // fetchPhotoRankings call removed
        fetchGroupRankings();
    }

    // Initial fetch
    pollData();
    // Set up polling
    setInterval(pollData, POLLING_INTERVAL);
});
// 1-阿財 2. 鼠鼠 3. Ting