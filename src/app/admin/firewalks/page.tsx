<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JMK Group - Hotel Performance Dashboard</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/umd/lucide.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 2rem;
            border-bottom: 3px solid #0ea5e9;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .logo-icon {
            width: 48px;
            height: 48px;
            background: #0ea5e9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .company-info h1 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            letter-spacing: -0.025em;
        }
        
        .company-info p {
            font-size: 0.875rem;
            opacity: 0.8;
            font-weight: 400;
        }
        
        .period-badge {
            background: rgba(14, 165, 233, 0.1);
            border: 1px solid rgba(14, 165, 233, 0.3);
            color: #0ea5e9;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            border: 1px solid #e2e8f0;
        }
        
        .section-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
        }
        
        .leaderboard-content {
            padding: 0;
        }
        
        .leaderboard-item {
            display: flex;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.2s ease;
        }
        
        .leaderboard-item:last-child {
            border-bottom: none;
        }
        
        .leaderboard-item:hover {
            background: #f8fafc;
        }
        
        .rank-badge {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1rem;
            margin-right: 1.5rem;
        }
        
        .rank-1 { background: #fef3c7; color: #d97706; }
        .rank-2 { background: #e5e7eb; color: #6b7280; }
        .rank-3 { background: #fed7aa; color: #ea580c; }
        .rank-other { background: #f1f5f9; color: #64748b; }
        
        .hotel-details {
            flex: 1;
        }
        
        .hotel-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }
        
        .task-summary {
            display: flex;
            gap: 1.5rem;
            font-size: 0.875rem;
            color: #64748b;
            align-items: center;
        }
        
        .task-stat {
            display: flex;
            align-items: center;
            gap: 0.375rem;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .status-red { background: #ef4444; }
        .status-yellow { background: #f59e0b; }
        .status-green { background: #10b981; }
        
        .completion-score {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.25rem;
        }
        
        .completion-percentage {
            font-size: 1.5rem;
            font-weight: 700;
            color: #059669;
        }
        
        .completion-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
        }
        
        .chart-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .chart-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            width: 100%;
            justify-content: center;
        }
        
        .chart-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #1e293b;
            text-align: center;
        }
        
        .chart-canvas {
            width: 200px !important;
            height: 200px !important;
        }
        
        .chart-stats {
            margin-top: 1rem;
            display: flex;
            justify-content: space-between;
            width: 100%;
            font-size: 0.75rem;
            color: #64748b;
        }
        
        .performance-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .indicator-excellent { background: #dcfce7; color: #166534; }
        .indicator-good { background: #fef3c7; color: #a16207; }
        .indicator-needs-improvement { background: #fecaca; color: #991b1b; }
        
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .task-summary {
                flex-direction: column;
                gap: 0.5rem;
                align-items: flex-start;
            }
            
            .charts-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo-icon">
                    <i data-lucide="building-2" style="color: white; width: 24px; height: 24px;"></i>
                </div>
                <div class="company-info">
                    <h1>JMK Group</h1>
                    <p>Hotel Performance Dashboard</p>
                </div>
            </div>
            <div class="period-badge">
                <i data-lucide="calendar" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i>
                May 2025
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="section">
            <div class="section-header">
                <i data-lucide="trophy" style="width: 20px; height: 20px; color: #0ea5e9;"></i>
                <h2 class="section-title">Performance Leaderboard</h2>
            </div>
            <div class="leaderboard-content">
                <div class="leaderboard-item">
                    <div class="rank-badge rank-1">1</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Holiday Inn Dublin Airport</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>0 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>0 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>145 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-excellent">
                                <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                                Excellent
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">100.0%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-2">3</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Moxy Cork</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>0 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>4 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>147 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-excellent">
                                <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i>
                                Excellent
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">97.4%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-3">4</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Seraphine</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>10 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>0 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>77 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-good">
                                <i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i>
                                Good
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">88.5%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-other">5</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Waterford Marina Hotel</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>12 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>9 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>129 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-good">
                                <i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i>
                                Good
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">86.0%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-other">6</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Holiday Inn Express</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>14 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>11 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>122 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-good">
                                <i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i>
                                Good
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">83.0%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-other">7</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Hampton by Hilton Ealing</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>19 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>0 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>71 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-needs-improvement">
                                <i data-lucide="x-circle" style="width: 12px; height: 12px;"></i>
                                Needs Focus
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">78.9%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
                
                <div class="leaderboard-item">
                    <div class="rank-badge rank-other">8</div>
                    <div class="hotel-details">
                        <div class="hotel-name">Hampton by Hilton Dublin</div>
                        <div class="task-summary">
                            <div class="task-stat">
                                <div class="status-dot status-red"></div>
                                <span>39 Critical</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-yellow"></div>
                                <span>4 Medium</span>
                            </div>
                            <div class="task-stat">
                                <div class="status-dot status-green"></div>
                                <span>107 Complete</span>
                            </div>
                            <span class="performance-indicator indicator-needs-improvement">
                                <i data-lucide="x-circle" style="width: 12px; height: 12px;"></i>
                                Needs Focus
                            </span>
                        </div>
                    </div>
                    <div class="completion-score">
                        <div class="completion-percentage">71.3%</div>
                        <div class="completion-label">Completion</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <i data-lucide="pie-chart" style="width: 20px; height: 20px; color: #0ea5e9;"></i>
                <h2 class="section-title">Individual Hotel Performance</h2>
            </div>
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Holiday Inn Dublin Airport</div>
                    </div>
                    <canvas id="chart1" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 145</span>
                        <span>100% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Seraphine</div>
                    </div>
                    <canvas id="chart2" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 87</span>
                        <span>88.5% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Moxy Cork</div>
                    </div>
                    <canvas id="chart3" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 151</span>
                        <span>97.4% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Waterford Marina Hotel</div>
                    </div>
                    <canvas id="chart4" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 150</span>
                        <span>86.0% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Holiday Inn Express</div>
                    </div>
                    <canvas id="chart5" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 147</span>
                        <span>83.0% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Hampton by Hilton Ealing</div>
                    </div>
                    <canvas id="chart6" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 90</span>
                        <span>78.9% Complete</span>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <i data-lucide="building" style="width: 16px; height: 16px; color: #64748b;"></i>
                        <div class="chart-title">Hampton by Hilton Dublin</div>
                    </div>
                    <canvas id="chart7" class="chart-canvas"></canvas>
                    <div class="chart-stats">
                        <span>Total Tasks: 150</span>
                        <span>71.3% Complete</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 0
                }
            }
        };

        const hotelData = [
            { name: 'Holiday Inn Dublin Airport', red: 0, yellow: 0, green: 145 },
            { name: 'Seraphine', red: 10, yellow: 0, green: 77 },
            { name: 'Moxy Cork', red: 0, yellow: 4, green: 147 },
            { name: 'Waterford Marina Hotel', red: 12, yellow: 9, green: 129 },
            { name: 'Holiday Inn Express', red: 14, yellow: 11, green: 122 },
            { name: 'Hampton by Hilton Ealing', red: 19, yellow: 0, green: 71 },
            { name: 'Hampton by Hilton Dublin', red: 39, yellow: 4, green: 107 }
        ];

        hotelData.forEach((hotel, index) => {
            new Chart(document.getElementById(`chart${index + 1}`), {
                type: 'doughnut',
                data: {
                    labels: ['Critical Tasks', 'Medium Priority', 'Completed'],
                    datasets: [{
                        data: [hotel.red, hotel.yellow, hotel.green],
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                        hoverBackgroundColor: ['#dc2626', '#d97706', '#059669'],
                        borderWidth: 0
                    }]
                },
                options: chartOptions
            });
        });
    </script>
</body>
</html>
