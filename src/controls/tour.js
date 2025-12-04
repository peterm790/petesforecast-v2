import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Custom styles for the tour to match app theme
const tourStyles = `
.driver-popover {
    background: rgba(20, 25, 40, 0.95);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}
.driver-popover-title {
    font-size: 16px;
    font-weight: 600;
}
.driver-popover-description {
    font-size: 14px;
    line-height: 1.5;
    color: #ddd;
}
.driver-popover-footer button {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-shadow: none;
}
.driver-popover-footer button:hover {
    background: rgba(255, 255, 255, 0.2);
}
.driver-popover-footer button.driver-popover-next-btn {
    background: linear-gradient(135deg, rgba(255,149,0,.8), rgba(255,64,129,.8));
    border: none;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = tourStyles;
document.head.appendChild(styleSheet);

export function startTour() {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        steps: [
            {
                element: '#pf-menubar-open-btn',
                popover: {
                    title: 'Weather Menu',
                    description: 'Click this cloud icon to open the weather menu. You can close it with the "X" or by clicking the map.',
                    side: 'left',
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Ensure menu is closed initially to show the button
                    const wrap = document.querySelector('.pf-menubar-wrap');
                    const openBtn = document.querySelector('#pf-menubar-open-btn');
                    if (wrap && !wrap.classList.contains('hidden')) {
                        wrap.classList.add('hidden');
                    }
                    if (openBtn) openBtn.style.display = '';
                }
            },
            {
                element: '#pf-menubar-frequency',
                popover: {
                    title: 'Forecast Frequency',
                    description: 'Select between a 5-day hourly forecast or a 16-day forecast with 3-hour intervals.',
                    side: 'right',
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Programmatically open menu
                    const wrap = document.querySelector('.pf-menubar-wrap');
                    const openBtn = document.querySelector('#pf-menubar-open-btn');
                    if (wrap && wrap.classList.contains('hidden')) {
                        wrap.classList.remove('hidden');
                    }
                    if (openBtn) openBtn.style.display = 'none';
                }
            },
            {
                element: '#pf-menubar-more-btn',
                popover: {
                    title: 'More Options',
                    description: 'Click this button to reveal advanced settings like local time, units, and colormaps.',
                    side: 'right',
                    align: 'start'
                },
                onDeselected: () => {
                     // Automatically expand when moving away from this step (e.g. clicking Next)
                     const advSection = document.getElementById('pf-advanced-section');
                     const moreBtn = document.getElementById('pf-menubar-more-btn');
                     if (advSection && advSection.style.display === 'none') {
                          if (moreBtn) moreBtn.click();
                     }
                }
            },
            {
                element: '#pf-menubar-localtime-panel',
                popover: {
                    title: 'Time Display',
                    description: 'Toggle between UTC and your Local Time for all dates and sliders.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#pf-menubar-colormap',
                popover: {
                    title: 'Colormaps',
                    description: 'Change the visual style of the weather data.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#pf-menubar-range',
                popover: {
                    title: 'Data Range',
                    description: 'Adjust the min/max values to focus on specific weather intensity ranges.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#pf-routing-open-btn',
                popover: {
                    title: 'Routing Tool',
                    description: 'Click here to open the weather routing calculator.',
                    side: 'right',
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Close weather menu
                    const wWrap = document.querySelector('.pf-menubar-wrap');
                    const wOpen = document.querySelector('#pf-menubar-open-btn');
                    if (wWrap && !wWrap.classList.contains('hidden')) {
                        wWrap.classList.add('hidden');
                    }
                    if (wOpen) wOpen.style.display = '';

                    // Ensure routing menu is closed
                    const rWrap = document.querySelector('.pf-routing-wrap');
                    const rOpen = document.querySelector('#pf-routing-open-btn');
                    if (rWrap && !rWrap.classList.contains('hidden')) {
                         rWrap.classList.add('hidden');
                    }
                    if (rOpen) rOpen.style.display = 'flex';
                }
            },
            {
                element: '#pf-routing-start-panel',
                popover: {
                    title: 'Route Points',
                    description: 'Set Start and End points by manually entering coordinates, right-clicking the map, or long-pressing.',
                    side: 'right',
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Open routing menu
                    const rWrap = document.querySelector('.pf-routing-wrap');
                    const rOpen = document.querySelector('#pf-routing-open-btn');
                    if (rWrap && rWrap.classList.contains('hidden')) {
                         rWrap.classList.remove('hidden');
                    }
                    if (rOpen) rOpen.style.display = 'none';
                }
            },
            {
                element: '#pf-routing-bbox-panel',
                popover: {
                    title: 'Bounding Box',
                    description: 'Define the search area for the route. You can drag the corner markers on the map to adjust.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#pf-routing-time-panel',
                popover: {
                    title: 'Start Time',
                    description: 'Choose when the route should start relative to the forecast initialization.',
                    side: 'right',
                    align: 'start'
                }
            }
        ]
    });

    driverObj.drive();
}

