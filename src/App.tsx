import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Directly import your model output json from public/model_output.json
import modelData from './model_output.json';

// Fix default marker icon issue in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Dam Icon (Blue)
const damIcon = L.divIcon({
  className: 'custom-dam-marker',
  html: `<svg viewBox="0 0 24 36" width="24" height="36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 12 24 12 24s12-16.5 12-24C24 5.37 18.63 0 12 0z" fill="#0284c7"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

// Custom Zone Icon (Green)
const zoneIcon = L.divIcon({
  className: 'custom-zone-marker',
  html: `<svg viewBox="0 0 24 36" width="24" height="36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 7.5 12 24 12 24s12-16.5 12-24C24 5.37 18.63 0 12 0z" fill="#10b981"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'forecast' | 'dams' | 'leaks'>('map');
  const [forecastTimeframe, setForecastTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  const zones = modelData.zones || [];
  const dams = modelData.dams || [];
  const waterHistory = modelData.history || [];

  // Compute totals for sidebar summary
  const totalZoneCurrent = zones.reduce((acc: number, z: any) => acc + (z.currentYearVal || 0), 0);
  const totalZoneLast = zones.reduce((acc: number, z: any) => acc + (z.lastYearVal || 0), 0);
  const totalZoneDiff = Number((totalZoneCurrent - totalZoneLast).toFixed(2));
  const zoneDiffPct = totalZoneLast > 0 ? ((totalZoneDiff / totalZoneLast) * 100).toFixed(1) : '0';

  const totalDamCurrent = dams.reduce((acc: number, d: any) => acc + (d.currentYearVal || 0), 0);
  const totalDamLast = dams.reduce((acc: number, d: any) => acc + (d.lastYearVal || 0), 0);
  const totalDamDiff = Number((totalDamCurrent - totalDamLast).toFixed(2));
  const damDiffPct = totalDamLast > 0 ? ((totalDamDiff / totalDamLast) * 100).toFixed(1) : '0';

  const getStatusColor = (status: string) => {
    if (!status) return '#10b981';
    if (status.includes('Optimal')) return '#10b981';
    if (status.includes('Low')) return '#0ea5e9';
    if (status.includes('Medium')) return '#f59e0b';
    if (status.includes('High')) return '#ea580c';
    if (status.includes('Extreme')) return '#dc2626';
    return '#10b981';
  };

  // Timeframe datasets for Macro Forecast comparison (Last Year vs Forecast)
  const forecastDataMap = {
    daily: [
      { label: 'Mon', lastYear: 38.2, forecast: 39.5 },
      { label: 'Tue', lastYear: 37.9, forecast: 39.1 },
      { label: 'Wed', lastYear: 38.5, forecast: 40.0 },
      { label: 'Thu', lastYear: 39.0, forecast: 40.8 },
      { label: 'Fri', lastYear: 39.8, forecast: 41.5 },
      { label: 'Sat', lastYear: 41.0, forecast: 43.2 },
      { label: 'Sun', lastYear: 40.5, forecast: 42.4 }
    ],
    weekly: [
      { label: 'Week 1', lastYear: 270, forecast: 285 },
      { label: 'Week 2', lastYear: 275, forecast: 290 },
      { label: 'Week 3', lastYear: 282, forecast: 298 },
      { label: 'Week 4', lastYear: 288, forecast: 310 }
    ],
    monthly: [
      { label: 'Jan', lastYear: 1.1, forecast: 1.2 },
      { label: 'Feb', lastYear: 1.2, forecast: 1.3 },
      { label: 'Mar', lastYear: 1.3, forecast: 1.4 },
      { label: 'Apr', lastYear: 1.5, forecast: 1.6 },
      { label: 'May', lastYear: 1.8, forecast: 1.9 },
      { label: 'Jun', lastYear: 2.1, forecast: 2.3 },
      { label: 'Jul', lastYear: 2.2, forecast: 2.4 },
      { label: 'Aug', lastYear: 2.0, forecast: 2.2 },
      { label: 'Sep', lastYear: 1.7, forecast: 1.8 },
      { label: 'Oct', lastYear: 1.4, forecast: 1.5 },
      { label: 'Nov', lastYear: 1.2, forecast: 1.3 },
      { label: 'Dec', lastYear: 1.1, forecast: 1.2 }
    ]
  };

  const currentForecastDataset = forecastDataMap[forecastTimeframe];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
      
      {/* SIDE NAVBAR */}
      <nav style={{ width: '280px', background: '#ffffff', color: '#1e293b', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', zIndex: 1000, borderRight: '1px solid #e2e8f0', boxShadow: '4px 0 10px rgba(0,0,0,0.03)', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem', textAlign: 'center', color: '#1e3a8a' }}>Paphos Water Intel</h2>
        <p style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginBottom: '1.2rem' }}>Multi-Area Telemetry & Forecasts</p>
        
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#475569', margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            Combined Regional Summary
          </p>

          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Total Zone Demand:</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', margin: '2px 0 4px' }}>
              {totalZoneCurrent.toFixed(1)}M m³
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ 
                background: totalZoneDiff >= 0 ? '#dcfce7' : '#fee2e2', 
                color: totalZoneDiff >= 0 ? '#166534' : '#991b1b', 
                padding: '1px 4px', 
                borderRadius: '3px', 
                fontSize: '0.65rem', 
                fontWeight: 'bold' 
              }}>
                {totalZoneDiff >= 0 ? `▲ +${totalZoneDiff}M` : `▼ ${totalZoneDiff}M`}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                ({totalZoneDiff >= 0 ? `+${zoneDiffPct}%` : `${zoneDiffPct}%`} vs last yr)
              </span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Total Dam Storage:</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', margin: '2px 0 4px' }}>
              {totalDamCurrent.toFixed(1)}M m³
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ 
                background: totalDamDiff >= 0 ? '#dcfce7' : '#fee2e2', 
                color: totalDamDiff >= 0 ? '#166534' : '#991b1b', 
                padding: '1px 4px', 
                borderRadius: '3px', 
                fontSize: '0.65rem', 
                fontWeight: 'bold' 
              }}>
                {totalDamDiff >= 0 ? `▲ +${totalDamDiff}M` : `▼ ${totalDamDiff}M`}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                ({totalDamDiff >= 0 ? `+${damDiffPct}%` : `${damDiffPct}%`} vs last yr)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button onClick={() => setActiveTab('map')} style={navBtnStyle(activeTab === 'map')}>Interactive Map</button>
          <button onClick={() => setActiveTab('forecast')} style={navBtnStyle(activeTab === 'forecast')}>Macro Forecasts</button>
          <button onClick={() => setActiveTab('dams')} style={navBtnStyle(activeTab === 'dams')}>Dam Reserves</button>
          <button onClick={() => setActiveTab('leaks')} style={navBtnStyle(activeTab === 'leaks')}>Variance Monitor</button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {activeTab === 'map' && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <MapContainer center={[34.8500, 32.4500]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer 
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />

              {zones.map((zone: any) => (
                <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={zoneIcon}>
                  <Popup>
                    <div style={{ width: '220px', fontFamily: 'Arial, sans-serif' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        District Zone
                      </span>
                      <h4 style={{ margin: '6px 0 4px', color: '#1e3a8a', fontSize: '0.95rem' }}>{zone.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 6px' }}>Population: <strong>{zone.basePop?.toLocaleString()}</strong></p>
                      <p style={{ fontSize: '0.75rem', margin: '0 0 4px' }}>Demand: <strong>{zone.currentYearVal}M m³</strong></p>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>Status: <span style={{ color: getStatusColor(zone.status), fontWeight: 'bold' }}>{zone.status}</span></p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {dams.map((dam: any) => (
                <Marker key={dam.id} position={[dam.lat, dam.lng]} icon={damIcon}>
                  <Popup>
                    <div style={{ width: '220px', fontFamily: 'Arial, sans-serif' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Water Reservoir
                      </span>
                      <h4 style={{ margin: '6px 0 4px', color: '#1e3a8a', fontSize: '0.95rem' }}>{dam.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 6px' }}>Capacity: <strong>{dam.capacity}</strong></p>
                      <p style={{ fontSize: '0.75rem', margin: '0 0 6px' }}>Storage: <strong style={{ color: '#0284c7' }}>{dam.storage} ({dam.percentage}%)</strong></p>
                      <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '6px', width: '100%', marginBottom: '4px' }}>
                        <div style={{ background: '#0284c7', width: `${dam.percentage}%`, height: '100%', borderRadius: '4px' }}></div>
                      </div>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>Status: <span style={{ color: getStatusColor(dam.status), fontWeight: 'bold' }}>{dam.status}</span></p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2>Macro Water Demand Forecast</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>Compare last year's actuals against forecasted consumption trends.</p>
              </div>

              {/* TIMEFRAME TOGGLE BUTTONS */}
              <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '6px', gap: '4px' }}>
                <button 
                  onClick={() => setForecastTimeframe('daily')} 
                  style={timeframeBtnStyle(forecastTimeframe === 'daily')}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setForecastTimeframe('weekly')} 
                  style={timeframeBtnStyle(forecastTimeframe === 'weekly')}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setForecastTimeframe('monthly')} 
                  style={timeframeBtnStyle(forecastTimeframe === 'monthly')}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#1e293b', textTransform: 'capitalize' }}>{forecastTimeframe} Trend Comparison</h4>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={currentForecastDataset}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value: any) => [`${value}M m³`, 'Demand']} />
                    <Legend />
                    <Line type="monotone" dataKey="lastYear" name="Last Year Actual" stroke="#0284c7" strokeWidth={2} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="forecast" name="Forecasted Next" stroke="#059669" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dams' && (
          <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', background: '#f8fafc' }}>
            <h2>Paphos Region Dam Reserves & Supply</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem' }}>
              {dams.map((dam: any) => (
                <div key={dam.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Reservoir</span>
                  <h3 style={{ margin: '8px 0 4px', color: '#1e3a8a' }}>{dam.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px' }}>Capacity: <strong>{dam.capacity}</strong></p>
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Storage:</span>
                      <strong>{dam.storage} ({dam.percentage}%)</strong>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', width: '100%' }}>
                      <div style={{ background: '#0284c7', width: `${dam.percentage}%`, height: '100%', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', margin: '0 0 4px' }}>Status: <span style={{ color: getStatusColor(dam.status), fontWeight: 'bold' }}>{dam.status}</span></p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{dam.diffText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

       {activeTab === 'leaks' && (
          <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2>District Variance & Leak Monitor</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>Detects anomalous consumption spikes and assesses potential pipeline leak risks.</p>
              </div>
              <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                ⚠️ 1 High-Risk Leak Alert Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {zones.map((zone: any) => {
                const isHighVariance = zone.isHigher && parseFloat(zone.diffText) > 10.0;
                const isMediumVariance = zone.isHigher && parseFloat(zone.diffText) <= 10.0 && parseFloat(zone.diffText) > 5.0;

                return (
                  <div key={zone.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Zone</span>
                        {isHighVariance ? (
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🚨 Potential Major Leak / Burst
                          </span>
                        ) : isMediumVariance ? (
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            ⚡ Minor Flow Anomaly
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            Normal Variance
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '4px 0 2px', color: '#1e3a8a' }}>{zone.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 6px' }}>Population: {zone.basePop?.toLocaleString()} | Current Demand: <strong>{zone.currentYearVal}M m³</strong></p>
                      
                      {isHighVariance && (
                        <p style={{ fontSize: '0.75rem', color: '#991b1b', margin: 0, background: '#fff5f5', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #dc2626' }}>
                          <strong>Action Recommended:</strong> Unexplained +12% consumption spike relative to baseline population. Inspect main feeder line meters for continuous nocturnal flow.
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: zone.isHigher ? '#166534' : '#991b1b', margin: 0 }}>
                        {zone.diffText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navBtnStyle = (active: boolean) => ({
  background: active ? '#1e3a8a' : 'transparent',
  color: active ? '#ffffff' : '#475569',
  border: active ? 'none' : '1px solid #cbd5e1',
  padding: '0.7rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'left' as const,
  fontWeight: 'bold' as const,
  fontSize: '0.85rem',
  transition: 'all 0.2s'
});

const timeframeBtnStyle = (active: boolean) => ({
  background: active ? '#1e3a8a' : 'transparent',
  color: active ? '#ffffff' : '#475569',
  border: 'none',
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 'bold' as const,
  transition: 'all 0.2s'
});