import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const containerStyle = {
    maxHeight: '400px',
    overflowY: 'auto',
    background: '#fafafa',
    padding: '10px',
    borderRadius: '8px'
};

const entryStyle = {
    marginBottom: '5px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '5px'
};

const AlertLogViewer = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const eventSource = new EventSource(`${API_BASE_URL}/alert/stream`);

        eventSource.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                setLogs(prev => [data, ...prev]);
            } catch (err) {
                console.error('Invalid alert data', err);
            }
        };

        eventSource.onerror = err => {
            console.error('SSE connection error', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div style={containerStyle}>
            <h2>🚨 실시간 IDS 로그</h2>
            {logs.map((log, idx) => (
                <div key={idx} style={entryStyle}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {`[${log.timestamp}] Type: ${log.type}, Details: ${JSON.stringify(log.details)}`}
          </pre>
                </div>
            ))}
        </div>
    );
};

export default AlertLogViewer;