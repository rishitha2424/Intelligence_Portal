import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function CustomerServiceTickets({ ticketData, isLoading }) {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isLoading || !ticketData || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark-theme');
    
    const gridColor = isDark ? '#1e3054' : '#cbd5e1';
    const labelColor = isDark ? '#8ba3c7' : '#475569';

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ticketData.trend_12_months.map(d => d.month),
        datasets: [{
          label: 'Service Tickets Raised',
          data: ticketData.trend_12_months.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 8,
            cornerRadius: 6,
            titleFont: { size: 11, family: 'Inter' },
            bodyFont: { size: 10, family: 'Inter' }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: { size: 9 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: labelColor, font: { size: 9 } }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [ticketData, isLoading]);

  if (isLoading) {
    return (
      <div className="chart-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading tickets data...</span>
      </div>
    );
  }

  if (!ticketData) return null;

  return (
    <div className="chart-wrap ticket-dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="section-title">
        🎟️ Customer Service Tickets (Past 12 Months)<span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--yellow)', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', padding: '2px 7px', borderRadius: '20px', marginLeft: '8px' }}>⚠ Illustrative sample — not real figures</span>
      </div>
      <div className="ticket-details-wrap">
        <div style={{ flex: 1.6, minWidth: '220px', height: '100%', position: 'relative' }}>
          <canvas ref={canvasRef}></canvas>
        </div>
        <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Unit Breakdown
          </div>
          {ticketData.business_units.map(bu => (
            <div key={bu.unit} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{bu.unit}</span>
                <span style={{ color: bu.color, fontWeight: '700' }}>{bu.tickets}</span>
              </div>
              <div className="score-bar-bg" style={{ height: '4px', background: 'var(--border)' }}>
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(bu.tickets / ticketData.total_tickets) * 100}%`,
                    background: bu.color,
                    height: '100%'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
