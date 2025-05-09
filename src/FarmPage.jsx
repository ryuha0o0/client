import React, { useState } from 'react';
import SmartFarmDashboard from './SmartFarmDashboard'; // 실시간 차트
import HistoricalHumidityChart from './HistoricalSensorChart'; // 과거 조회 차트

const FarmPage = () => {
  const [mode, setMode] = useState('realtime'); // 'realtime' or 'history'

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setMode('realtime')} disabled={mode === 'realtime'}>
          🌱 실시간 대시보드
        </button>
        <button onClick={() => setMode('history')} disabled={mode === 'history'} style={{ marginLeft: '10px' }}>
          📂 과거 데이터 조회
        </button>
      </div>

      {mode === 'realtime' ? <SmartFarmDashboard /> : <HistoricalHumidityChart />}
    </div>
  );
};

export default FarmPage;
