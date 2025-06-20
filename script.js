document.addEventListener('DOMContentLoaded', () => {

    const USE_MOCK_DATA = false;
    const API_URL = 'http://192.168.103.77:3000'; 
    const POLLING_RATE = 2000;
    const LIVE_CHART_MAX_POINTS = 20;

    // --- DOM ELEMENT REFERENCES ---
    const systemStatusIndicator = document.getElementById('system-status-indicator');
    const systemStatusText = document.getElementById('system-status-text');
    const controlBtn = document.getElementById('control-toggle-btn');
    const distanceTableBody = document.querySelector('#distance-history-table tbody');
    const detectionTableBody = document.querySelector('#detection-history-table tbody');

    // --- CHART.JS HELPER FUNCTION ---
    function createLiveChart(canvasId, label, color, yAxisMax = null) { 
        const ctx = document.getElementById(canvasId).getContext('2d');
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true,
                    max: yAxisMax 
                },
                x: { display: false }
            },
            plugins: { legend: { display: false } }
        };

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    borderColor: color,
                    backgroundColor: `${color}1A`,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: options
        });
    }
    
    // --- CHART INITIALIZATION ---
    const liveDistanceChart = createLiveChart('live-distance-chart', 'Distance', '#007bff', 10); 
    const liveDetectionChart = createLiveChart('live-detection-chart', 'Detection', '#dc3545');
    
    liveDetectionChart.options.scales.y.max = 1.1;
    liveDetectionChart.options.scales.y.min = -0.1;
    liveDetectionChart.data.datasets[0].stepped = true;

    // --- GLOBAL STATE ---
    let currentSystemStatus = 'on';

    
    async function fetchDataAndUpdate() {
        try {
            const response = await fetch(`${API_URL}/api/sensor-data`);
            if (!response.ok) {
                setConnectionStatus('error', 'Server Error');
                return;
            }
            const data = await response.json();
            updateDashboard(data);
            setConnectionStatus('on', 'Connected');

        } catch (error) {
            console.error("Error fetching data:", error);
            setConnectionStatus('error', 'Connection Failed');
        }
    }

    function updateDashboard(data) {
        if (!data || data.length === 0) return;
        updateLiveChart(liveDistanceChart, data, 'distance_cm');
        updateLiveChart(liveDetectionChart, data, 'led_is_on');
        updateHistoryTable(distanceTableBody, data, 'distance_cm');
        updateHistoryTable(detectionTableBody, data, 'led_is_on');
    }

    function updateLiveChart(chart, data, dataKey) {
        const liveData = data.slice(-LIVE_CHART_MAX_POINTS);
        chart.data.labels = liveData.map(d => new Date(d.created_at).toLocaleTimeString());
        chart.data.datasets[0].data = liveData.map(d => dataKey === 'led_is_on' ? (d[dataKey] ? 1 : 0) : d[dataKey]);
        chart.update('none');
    }

    function updateHistoryTable(tableBody, data, dataKey) {
        tableBody.innerHTML = '';
        [...data].reverse().forEach(d => {
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            const valueCell = document.createElement('td');
            timeCell.textContent = new Date(d.created_at).toLocaleTimeString();
            if (dataKey === 'led_is_on') {
                valueCell.textContent = d[dataKey] ? 'Detected' : 'Clear';
                valueCell.style.color = d[dataKey] ? '#dc3545' : '#28a745';
                valueCell.style.fontWeight = 'bold';
            } else {
                valueCell.textContent = parseFloat(d[dataKey]).toFixed(2);
            }
            row.appendChild(timeCell);
            row.appendChild(valueCell);
            tableBody.appendChild(row);
        });
    }

    async function toggleControl() {
        const newStatus = currentSystemStatus === 'on' ? 'off' : 'on';
        if (USE_MOCK_DATA) {
            currentSystemStatus = newStatus;
            updateControlUI();
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/control`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newStatus: newStatus })
            });
            const result = await response.json();
            currentSystemStatus = result.status;
            updateControlUI();
        } catch (error) {
            setConnectionStatus('error', 'Control Failed');
        }
    }

    function updateControlUI() {
        controlBtn.textContent = currentSystemStatus === 'on' ? 'Turn Off' : 'Turn On';
    }

    function setConnectionStatus(status, text) {
        systemStatusText.textContent = text;
        systemStatusIndicator.className = 'indicator-light';
        if (status === 'on') systemStatusIndicator.classList.add('on');
        if (status === 'error') systemStatusIndicator.classList.add('error');
    }

    controlBtn.addEventListener('click', toggleControl);
    updateControlUI();

    if (USE_MOCK_DATA) {
        let mockData = [];
        function generateMockData() {
            const newDistance = Math.random() * 15;
            mockData.push({
                distance_cm: newDistance.toFixed(2),
                led_is_on: newDistance < 10,
                created_at: new Date().toISOString()
            });
            if (mockData.length > 100) mockData.shift();
            updateDashboard(mockData);
            setConnectionStatus('on', 'Connected (Mock)');
        }
        setInterval(generateMockData, POLLING_RATE);
    } else {
        setConnectionStatus('checking', 'Connecting...');
        fetchDataAndUpdate();
        setInterval(fetchDataAndUpdate, POLLING_RATE);
    }
});