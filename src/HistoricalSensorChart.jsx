import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SENSOR_TYPES = [
  { id: 'humidity', label: '습도 (%)', endpoint: '/farm/humidity', color: 'blue' },
  { id: 'temperature', label: '온도 (°C)', endpoint: '/farm/temperature', color: 'orange' },
  { id: 'soil', label: '토양 습도 (%)', endpoint: '/farm/soil', color: 'green' }
];

const HistoricalSensorChart = () => {
  const chartRefs = {
    humidity: useRef(null),
    temperature: useRef(null),
    soil: useRef(null)
  };
  const chartInstances = useRef({});

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async (sensorId, endpoint, label, color) => {
    try {
      const body = {
        page: 0,
        size: 50,
        sort: 'asc',
        ...(startTime && endTime && {
          startTime: `${startTime}:00`,
          endTime: `${endTime}:00`
        }),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      const labels = json.content.map(item =>
        new Date(item.measuredAt).toLocaleTimeString()
      );
      const data = json.content.map(item => item.value);

      if (chartInstances.current[sensorId]) {
        chartInstances.current[sensorId].destroy();
      }

      chartInstances.current[sensorId] = new Chart(chartRefs[sensorId].current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            borderDash: [4, 2],
            pointRadius: 3,
            tension: 0.3,
            backgroundColor: 'transparent'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true },
            x: { title: { display: true, text: '시간' } }
          }
        }
      });
    } catch (err) {
      console.error(`❌ ${sensorId} 데이터 조회 실패`, err);
    }
  };

  const handleQuery = async () => {
    setLoading(true);
    await Promise.all(
      SENSOR_TYPES.map(sensor =>
        fetchData(sensor.id, sensor.endpoint, sensor.label, sensor.color)
      )
    );
    setLoading(false);
  };

  useEffect(() => {
    handleQuery(); // 첫 로딩 시 자동 조회
    return () => {
      // 컴포넌트 언마운트 시 차트 제거
      Object.values(chartInstances.current).forEach(chart => chart?.destroy());
    };
  }, []);

  return (
    <div>
      <h2>📂 과거 센서 데이터 조회</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>
          시작:
          <input
            type="datetime-local"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          종료:
          <input
            type="datetime-local"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </label>
        <button
          onClick={handleQuery}
          disabled={loading || !startTime || !endTime}
          style={{ marginLeft: '10px' }}
        >
          🔍 조회
        </button>
      </div>

      {loading && <p>로딩 중...</p>}

      {SENSOR_TYPES.map(sensor => (
        <div key={sensor.id} style={{ marginBottom: '40px' }}>
          <h3>{sensor.label}</h3>
          <canvas
            ref={chartRefs[sensor.id]}
            height={100}
            style={{ background: '#f4f4f4', borderRadius: '8px' }}
          />
        </div>
      ))}
    </div>
  );
};

export default HistoricalSensorChart;
