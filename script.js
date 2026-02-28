document.addEventListener('DOMContentLoaded', () => {
    let allNodes = [];
    let currentFilter = 'all';
    let currentSearch = '';
    
    // 国旗映射（简化版）
    const flagEmojis = {
        'us': '🇺🇸', 'jp': '🇯🇵', 'hk': '🇭🇰', 'sg': '🇸🇬',
        'tw': '🇹🇼', 'kr': '🇰🇷', 'de': '🇩🇪', 'gb': '🇬🇧',
        'fr': '🇫🇷', 'ca': '🇨🇦', 'au': '🇦🇺', 'ru': '🇷🇺',
        'cn': '🇨🇳', 'in': '🇮🇳', 'br': '🇧🇷', 'mx': '🇲🇽'
    };
    
    async function fetchData() {
        try {
            showLoading();
            const timestamp = new Date().getTime();
            const resp = await fetch(`nodes.json?t=${timestamp}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            const data = await resp.json();
            allNodes = data.nodes || [];
            
            updateHeader(data.server_info);
            updateStats(data);
            renderFilters();
            renderNodes();
            
        } catch (error) {
            console.error('数据加载失败:', error);
            document.getElementById('nodes-container').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>数据加载失败</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">重试</button>
                </div>
            `;
        }
    }
    
    function showLoading() {
        document.getElementById('nodes-container').innerHTML = `
            <div class="loading-state">
                <div class="scanner"></div>
                <p><i class="fas fa-satellite-dish"></i> 正在扫描全球节点...</p>
            </div>
        `;
    }
    
    function updateHeader(serverInfo) {
        const runnerIp = document.getElementById('runner-ip');
        const updateTime = document.getElementById('update-time');
        
        if (runnerIp) {
            runnerIp.innerHTML = `
                <i class="fas fa-server"></i>
                <span>分析源: ${serverInfo.city}, ${serverInfo.country}</span>
                <small>(${serverInfo.ip})</small>
            `;
        }
        
        if (updateTime) {
            const timeStr = serverInfo.timestamp || '未知时间';
            updateTime.textContent = `最后更新: ${formatTime(timeStr)}`;
        }
    }
    
    function updateStats(data) {
        const stats = data.statistics || {};
        const nodeCount = document.getElementById('node-count');
        const countryCount = document.getElementById('country-count');
        const avgLatency = document.getElementById('avg-latency');
        
        if (nodeCount) nodeCount.textContent = stats.active_nodes || 0;
        if (countryCount) countryCount.textContent = stats.countries ? stats.countries.length : 0;
        if (avgLatency) avgLatency.textContent = `${stats.average_latency || 0}ms`;
    }
    
    function formatTime(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return timestamp;
        }
    }
    
    function getLatencyClass(latency) {
        if (latency < 80) return 'excellent';
        if (latency < 180) return 'good';
        return 'poor';
    }
    
    function getLatencyText(latency) {
        if (latency < 80) return '极速';
        if (latency < 180) return '良好';
        return '一般';
    }
    
    function getFlagEmoji(countryCode) {
        return flagEmojis[countryCode.toLowerCase()] || '🌐';
    }
    
    function renderFilters() {
        const container = document.getElementById('country-filters');
        if (!container) return;
        
        // 收集所有