import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const MAX_POINTS = 30;
const SSE_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SmartFarmDashboard = () => {
  const temperatureRef = useRef(null);
  const humidityRef = useRef(null);
  const soilRef = useRef(null);

  const chartsRef = useRef({});
  const eventSourcesRef = useRef({});

  const createChart = (ctx, label, color) => {
    if (!ctx) return null;

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label,
          data: [],
          borderColor: color,
          borderDash: [5, 5],
          backgroundColor: 'rgba(0,0,0,0)',
          pointRadius: 3,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          x: { title: { display: true, text: '시간' } },
          y: { beginAtZero: true }
        }
      }
    });
  };

  const connectSSE = (id, chart, eventName) => {
    const eventSource = new EventSource(`${SSE_BASE_URL}/subscribe/${id}`);
    eventSourcesRef.current[id] = eventSource;

    eventSource.addEventListener(eventName, event => {
      if (!chart) return;

      const now = new Date();
      const label = now.toLocaleTimeString();
      const value = parseFloat(event.data);

      if (isNaN(value)) return;

      chart.data.labels.push(label);
      chart.data.datasets[0].data.push(value);

      if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      try {
        chart.update();
      } catch (e) {
        console.warn(`⚠️ Chart update 실패 (${id})`, e.message);
      }
    });

    eventSource.addEventListener('connect', e => {
      console.log(`[✅ ${id}] SSE 연결 성공`);
    });

    eventSource.onerror = err => {
      console.error(`[❌ ${id}] SSE 오류`, err);
      eventSource.close();
    };
  };

  useEffect(() => {
    if (!temperatureRef.current || !humidityRef.current || !soilRef.current) return;

    const tempChart = createChart(temperatureRef.current, '온도 (°C)', 'orange');
    const humChart = createChart(humidityRef.current, '습도 (%)', 'blue');
    const soilChart = createChart(soilRef.current, '토양 습도 (%)', 'green');

    chartsRef.current = {
      temperature: tempChart,
      humidity: humChart,
      soilMoisture: soilChart
    };

    connectSSE('temperature', tempChart, 'temperature_data');
    connectSSE('humidity', humChart, 'humidity_data');
    connectSSE('soilMoisture', soilChart, 'soilMoisture_data');

    return () => {
      // ✅ 차트 파괴
      Object.values(chartsRef.current).forEach(chart => chart?.destroy());

      // ✅ SSE 연결 해제
      Object.values(eventSourcesRef.current).forEach(es => es?.close());

      chartsRef.current = {};
      eventSourcesRef.current = {};
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>🌱 스마트팜 실시간 데이터 그래프</h1>

      <h2>🌡️ 온도</h2>
      <canvas ref={temperatureRef} height="100" style={canvasStyle} />

      <h2>💧 습도</h2>
      <canvas ref={humidityRef} height="100" style={canvasStyle} />

      <h2>🌾 토양 습도</h2>
      <canvas ref={soilRef} height="100" style={canvasStyle} />
    </div>
  );
};

const canvasStyle = {
  maxWidth: '100%',
  background: '#fafafa',
  borderRadius: '8px',
  padding: '10px',
  marginBottom: '30px'
};

export default SmartFarmDashboard;
