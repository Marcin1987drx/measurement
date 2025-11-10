// ════════════════════════════════════════════════════════════════════════════
// REPORT STUDIO - Main JavaScript
// ════════════════════════════════════════════════════════════════════════════

const reportState = {
    project: {
        rootHandle: null,
        name: 'No Project Selected',
        maps: [],
        records: []
    },
    ui: {
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'en',
        zoom: 100,
        gridEnabled: true,
        snapEnabled: true,
        rulersEnabled: false,
        mode: 'designer'
    },
    template: {
        meta: { name: 'Untitled Report', paper: 'A4', orientation: 'portrait' },
        pages: [{ id: 1, components: [] }],
        currentPage: 1
    },
    selection: {
        elementId: null,
        elementType: null,
        element: null
    },
    drag: {
        active: false,
        startX: 0,
        startY: 0,
        elementStartX: 0,
        elementStartY: 0
    },
    resize: {
        active: false,
        handle: null,
        startX: 0,
        startY: 0,
        elementStartX: 0,
        elementStartY: 0,
        elementStartWidth: 0,
        elementStartHeight: 0
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Report Studio initializing...');
    
    initializeTheme();
    initializeLanguage();
    loadProjectData();
    setupEventListeners();
    
    console.log('✅ Report Studio ready!');
});

function initializeTheme() {
    const isDark = reportState.ui.theme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    console.log(`🎨 Theme: ${reportState.ui.theme}`);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    reportState.ui.theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', reportState.ui.theme);
}

function initializeLanguage() {
    const langSelect = document.getElementById('language-toggle');
    if (langSelect) langSelect.value = reportState.ui.language;
    document.body.setAttribute('lang', reportState.ui.language);
}

function changeLanguage(lang) {
    reportState.ui.language = lang;
    localStorage.setItem('language', lang);
    document.body.setAttribute('lang', lang);
}

function loadProjectData() {
    try {
        const projectDataStr = sessionStorage.getItem('measurementProject');
        if (projectDataStr) {
            const projectData = JSON.parse(projectDataStr);
            reportState.project.name = projectData.name || 'Unknown Project';
            reportState.project.maps = projectData.maps || [];
            reportState.project.records = projectData.records || [];
            updateProjectDisplay();
            console.log(`📁 Project: ${reportState.project.name}`);
        }
    } catch (error) {
        console.error('❌ Error loading project:', error);
    }
}

function updateProjectDisplay() {
    const el = document.getElementById('project-folder-name');
    if (el) el.textContent = reportState.project.name;
}

function setupEventListeners() {
    document.getElementById('btn-back-to-main')?.addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('language-toggle')?.addEventListener('change', (e) => changeLanguage(e.target.value));
    
    document.getElementById('btn-new-template')?.addEventListener('click', newTemplate);
    document.getElementById('btn-open-template')?.addEventListener('click', openTemplate);
    document.getElementById('btn-save-template')?.addEventListener('click', saveTemplate);
    document.getElementById('btn-preview')?.addEventListener('click', () => console.log('👁️ Preview'));
    document.getElementById('btn-generate-pdf')?.addEventListener('click', () => console.log('📄 Generate PDF'));
    
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => adjustZoom(25));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => adjustZoom(-25));
    
    document.getElementById('toggle-grid')?.addEventListener('change', (e) => {
        reportState.ui.gridEnabled = e.target.checked;
        document.querySelectorAll('.canvas-page').forEach(p => p.classList.toggle('no-grid', !e.target.checked));
    });
    
    document.getElementById('btn-add-page')?.addEventListener('click', addPage);
    
    document.getElementById('toggle-snap')?.addEventListener('change', (e) => {
        reportState.ui.snapEnabled = e.target.checked;
    });
    
    setupDragAndDrop();
    setupKeyboardShortcuts();
    setupCanvasClickHandler();
}

function newTemplate() {
    if (confirm('Create new template?')) {
        reportState.template = {
            meta: { name: 'Untitled', paper: 'A4', orientation: 'portrait' },
            pages: [{ id: 1, components: [] }],
            currentPage: 1
        };
        console.log('📄 New template');
    }
}

function openTemplate() {
    document.getElementById('open-template-modal')?.classList.add('open');
}

function saveTemplate() {
    const name = prompt('Template name:', reportState.template.meta.name);
    if (name) {
        reportState.template.meta.name = name;
        console.log('💾 Saved:', name);
    }
}

function adjustZoom(delta) {
    reportState.ui.zoom = Math.max(50, Math.min(200, reportState.ui.zoom + delta));
    const el = document.getElementById('zoom-level');
    if (el) el.textContent = `${reportState.ui.zoom}%`;
    const container = document.getElementById('canvas-container');
    if (container) container.className = `canvas-container zoom-${reportState.ui.zoom}`;
}

function addPage() {
    const id = reportState.template.pages.length + 1;
    reportState.template.pages.push({ id, components: [] });
    
    const page = document.createElement('div');
    page.className = 'canvas-page';
    page.innerHTML = `<div class="page-header"><span class="page-number">Page ${id}</span></div><div class="page-content" id="page-content-${id}"></div>`;
    document.getElementById('canvas-container')?.appendChild(page);
    
    console.log(`📄 Page ${id} added`);
}

function setupDragAndDrop() {
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('componentType', e.target.dataset.type);
            e.target.style.opacity = '0.5';
        });
        item.addEventListener('dragend', (e) => e.target.style.opacity = '1');
    });
    
    document.querySelectorAll('.page-content').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('componentType');
            if (type) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                createCanvasElement(type, x, y, e.currentTarget);
                console.log(`➕ ${type} at (${x}, ${y})`);
            }
        });
    });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function snapToGrid(value) {
    if (!reportState.ui.snapEnabled) return value;
    const gridSize = 8;
    return Math.round(value / gridSize) * gridSize;
}

function generateUniqueId() {
    return 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getElementContent(type) {
    const templates = {
        text: '<div class="element-text" contenteditable="true">Text Block</div>',
        title: '<div class="element-title" contenteditable="true">Title</div>',
        image: '<div class="element-image">🖼️ Image</div>',
        line: '<div class="element-line" style="height: 2px; background: #000; width: 100%;"></div>',
        rectangle: '<div style="width: 100%; height: 100%; border: 2px solid #000;"></div>',
        date: '<div class="element-field"><strong>Date:</strong> 2025-11-10</div>',
        time: '<div class="element-field"><strong>Time:</strong> 09:55</div>',
        user: '<div class="element-field"><strong>User:</strong> Inspector</div>',
        schemaName: '<div class="element-field"><strong>Schema:</strong> Test Schema</div>',
        schemaVersion: '<div class="element-field"><strong>Version:</strong> 1.0</div>',
        qrCode: '<div class="element-field">🔲 QR Code</div>',
        status: '<div class="element-field">✅ Status: OK</div>',
        table: '<div class="element-field">📋 Measurement Table</div>',
        chart: '<div class="element-field">📈 Chart</div>',
        field: '<div class="element-field">🔍 Field Value</div>',
        vizOverview: '<div class="element-field">🌅 Overview Image</div>',
        vizZooms: '<div class="element-field">🔎 Zoom Images</div>',
        vizAuto: '<div class="element-field">🤖 Auto Visualization</div>',
        pageNumber: '<div class="element-field">Page {page}</div>'
    };
    return templates[type] || `<div>[${type}]</div>`;
}

function getSelectedElement() {
    return reportState.selection.element;
}

// ════════════════════════════════════════════════════════════════════════════
// ELEMENT CREATION
// ════════════════════════════════════════════════════════════════════════════

function createCanvasElement(type, x, y, container) {
    const element = document.createElement('div');
    element.className = 'canvas-element';
    element.dataset.type = type;
    element.dataset.id = generateUniqueId();
    
    // Position and size
    element.style.position = 'absolute';
    element.style.left = snapToGrid(x) + 'px';
    element.style.top = snapToGrid(y) + 'px';
    element.style.width = '200px';
    element.style.height = '50px';
    element.style.border = '2px solid var(--accent-color)';
    element.style.padding = '8px';
    element.style.background = 'var(--bg-secondary)';
    element.style.zIndex = '1';
    
    // Content based on type
    element.innerHTML = getElementContent(type);
    
    // Make it interactive
    makeElementInteractive(element);
    
    // Add to container
    container.appendChild(element);
    
    // Select it
    selectElement(element);
    
    return element;
}

function makeElementInteractive(element) {
    // Mouse down for dragging
    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) return;
        e.stopPropagation();
        selectElement(element);
        startDrag(e, element);
    });
}

// ════════════════════════════════════════════════════════════════════════════
// SELECTION SYSTEM
// ════════════════════════════════════════════════════════════════════════════

function selectElement(element) {
    // Deselect previous
    const prev = getSelectedElement();
    if (prev) {
        prev.classList.remove('selected');
        removeResizeHandles(prev);
    }
    
    // Select new
    element.classList.add('selected');
    reportState.selection.element = element;
    reportState.selection.elementId = element.dataset.id;
    reportState.selection.elementType = element.dataset.type;
    
    // Add resize handles
    addResizeHandles(element);
    
    // Update properties panel
    updatePropertiesPanel(element);
}

function deselectAll() {
    const selected = getSelectedElement();
    if (selected) {
        selected.classList.remove('selected');
        removeResizeHandles(selected);
    }
    reportState.selection.element = null;
    reportState.selection.elementId = null;
    reportState.selection.elementType = null;
    
    // Show placeholder in properties panel
    showPropertiesPlaceholder();
}

function setupCanvasClickHandler() {
    document.querySelectorAll('.page-content').forEach(zone => {
        zone.addEventListener('mousedown', (e) => {
            if (e.target === zone) {
                deselectAll();
            }
        });
    });
}

// ════════════════════════════════════════════════════════════════════════════
// RESIZE HANDLES
// ════════════════════════════════════════════════════════════════════════════

function addResizeHandles(element) {
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${position}`;
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            startResize(e, element, position);
        });
        element.appendChild(handle);
    });
}

function removeResizeHandles(element) {
    const handles = element.querySelectorAll('.resize-handle');
    handles.forEach(h => h.remove());
}

// ════════════════════════════════════════════════════════════════════════════
// DRAG FUNCTIONALITY
// ════════════════════════════════════════════════════════════════════════════

function startDrag(e, element) {
    reportState.drag.active = true;
    reportState.drag.startX = e.clientX;
    reportState.drag.startY = e.clientY;
    reportState.drag.elementStartX = parseInt(element.style.left) || 0;
    reportState.drag.elementStartY = parseInt(element.style.top) || 0;
    
    element.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
    
    const onMouseMove = (e) => {
        if (!reportState.drag.active) return;
        
        const dx = e.clientX - reportState.drag.startX;
        const dy = e.clientY - reportState.drag.startY;
        
        let newX = reportState.drag.elementStartX + dx;
        let newY = reportState.drag.elementStartY + dy;
        
        // Keep within canvas boundaries
        const container = element.parentElement;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        newX = Math.max(0, Math.min(newX, containerRect.width - elementRect.width));
        newY = Math.max(0, Math.min(newY, containerRect.height - elementRect.height));
        
        // Apply snap
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
        
        // Update properties panel
        updatePropertiesPanel(element);
    };
    
    const onMouseUp = () => {
        reportState.drag.active = false;
        element.classList.remove('dragging');
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// ════════════════════════════════════════════════════════════════════════════
// RESIZE FUNCTIONALITY
// ════════════════════════════════════════════════════════════════════════════

function startResize(e, element, handle) {
    reportState.resize.active = true;
    reportState.resize.handle = handle;
    reportState.resize.startX = e.clientX;
    reportState.resize.startY = e.clientY;
    reportState.resize.elementStartX = parseInt(element.style.left) || 0;
    reportState.resize.elementStartY = parseInt(element.style.top) || 0;
    reportState.resize.elementStartWidth = element.offsetWidth;
    reportState.resize.elementStartHeight = element.offsetHeight;
    
    const onMouseMove = (e) => {
        if (!reportState.resize.active) return;
        
        const dx = e.clientX - reportState.resize.startX;
        const dy = e.clientY - reportState.resize.startY;
        
        const minSize = 20;
        let newX = reportState.resize.elementStartX;
        let newY = reportState.resize.elementStartY;
        let newWidth = reportState.resize.elementStartWidth;
        let newHeight = reportState.resize.elementStartHeight;
        
        // Handle each direction
        if (handle.includes('n')) {
            newY = reportState.resize.elementStartY + dy;
            newHeight = reportState.resize.elementStartHeight - dy;
        }
        if (handle.includes('s')) {
            newHeight = reportState.resize.elementStartHeight + dy;
        }
        if (handle.includes('w')) {
            newX = reportState.resize.elementStartX + dx;
            newWidth = reportState.resize.elementStartWidth - dx;
        }
        if (handle.includes('e')) {
            newWidth = reportState.resize.elementStartWidth + dx;
        }
        
        // Apply minimum size
        if (newWidth < minSize) {
            if (handle.includes('w')) newX = reportState.resize.elementStartX + reportState.resize.elementStartWidth - minSize;
            newWidth = minSize;
        }
        if (newHeight < minSize) {
            if (handle.includes('n')) newY = reportState.resize.elementStartY + reportState.resize.elementStartHeight - minSize;
            newHeight = minSize;
        }
        
        // Apply snap
        newX = snapToGrid(newX);
        newY = snapToGrid(newY);
        newWidth = snapToGrid(newWidth);
        newHeight = snapToGrid(newHeight);
        
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
        element.style.width = newWidth + 'px';
        element.style.height = newHeight + 'px';
        
        // Update properties panel
        updatePropertiesPanel(element);
    };
    
    const onMouseUp = () => {
        reportState.resize.active = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// ════════════════════════════════════════════════════════════════════════════
// PROPERTIES PANEL
// ════════════════════════════════════════════════════════════════════════════

function showPropertiesPlaceholder() {
    const container = document.getElementById('properties-content');
    container.innerHTML = `
        <div class="placeholder-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 48px; height: 48px; opacity: 0.3;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p data-i18n="selectElement">Select an element to edit properties</p>
        </div>
    `;
}

function updatePropertiesPanel(element) {
    const container = document.getElementById('properties-content');
    const type = element.dataset.type;
    const isText = ['text', 'title'].includes(type);
    
    const x = parseInt(element.style.left) || 0;
    const y = parseInt(element.style.top) || 0;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const zIndex = element.style.zIndex || 1;
    
    let html = `
        <!-- Layout Section -->
        <div class="property-section">
            <div class="property-section-title">Layout</div>
            <div class="property-row">
                <div class="property-field">
                    <label class="property-label">X Position</label>
                    <input type="number" class="property-input" id="prop-x" value="${x}">
                </div>
                <div class="property-field">
                    <label class="property-label">Y Position</label>
                    <input type="number" class="property-input" id="prop-y" value="${y}">
                </div>
            </div>
            <div class="property-row">
                <div class="property-field">
                    <label class="property-label">Width</label>
                    <input type="number" class="property-input" id="prop-width" value="${width}">
                </div>
                <div class="property-field">
                    <label class="property-label">Height</label>
                    <input type="number" class="property-input" id="prop-height" value="${height}">
                </div>
            </div>
            <div class="property-row full">
                <div class="property-field">
                    <label class="property-label">Z-Index</label>
                    <input type="number" class="property-input" id="prop-zindex" value="${zIndex}">
                </div>
            </div>
        </div>
    `;
    
    // Typography section for text elements
    if (isText) {
        const textEl = element.querySelector('.element-text, .element-title');
        const fontSize = textEl ? window.getComputedStyle(textEl).fontSize : '14px';
        const fontWeight = textEl ? window.getComputedStyle(textEl).fontWeight : 'normal';
        const color = textEl ? window.getComputedStyle(textEl).color : '#000000';
        const textAlign = textEl ? window.getComputedStyle(textEl).textAlign : 'left';
        
        html += `
            <div class="property-section">
                <div class="property-section-title">Typography</div>
                <div class="property-row full">
                    <div class="property-field">
                        <label class="property-label">Font Family</label>
                        <select class="property-select" id="prop-font-family">
                            <option>Arial</option>
                            <option>Helvetica</option>
                            <option>Times New Roman</option>
                            <option>Georgia</option>
                            <option>Verdana</option>
                        </select>
                    </div>
                </div>
                <div class="property-row">
                    <div class="property-field">
                        <label class="property-label">Font Size</label>
                        <input type="number" class="property-input" id="prop-font-size" value="${parseInt(fontSize)}">
                    </div>
                    <div class="property-field">
                        <label class="property-label">Font Weight</label>
                        <select class="property-select" id="prop-font-weight">
                            <option value="normal" ${fontWeight === 'normal' || fontWeight === '400' ? 'selected' : ''}>Normal</option>
                            <option value="bold" ${fontWeight === 'bold' || fontWeight >= 600 ? 'selected' : ''}>Bold</option>
                        </select>
                    </div>
                </div>
                <div class="property-row full">
                    <div class="property-field">
                        <label class="property-label">Text Color</label>
                        <input type="color" class="property-color" id="prop-color" value="#000000">
                    </div>
                </div>
                <div class="property-row full">
                    <div class="property-field">
                        <label class="property-label">Text Align</label>
                        <div class="align-buttons">
                            <button class="align-btn ${textAlign === 'left' ? 'active' : ''}" data-align="left">Left</button>
                            <button class="align-btn ${textAlign === 'center' ? 'active' : ''}" data-align="center">Center</button>
                            <button class="align-btn ${textAlign === 'right' ? 'active' : ''}" data-align="right">Right</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Actions section
    html += `
        <div class="property-section">
            <div class="property-section-title">Actions</div>
            <div class="property-actions">
                <button class="btn btn-secondary" id="btn-duplicate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    <span>Duplicate</span>
                </button>
                <button class="btn btn-secondary" id="btn-bring-front">Bring to Front</button>
                <button class="btn btn-secondary" id="btn-send-back">Send to Back</button>
                <button class="btn btn-delete" id="btn-delete">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                    <span>Delete</span>
                </button>
            </div>
        </div>
        
        <div class="property-section">
            <div class="property-section-title">Data Binding (Coming Soon)</div>
            <p style="font-size: 0.85em; color: var(--text-secondary);">Dynamic data binding will be available in a future update.</p>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach event listeners for property changes
    attachPropertyListeners(element);
}

function attachPropertyListeners(element) {
    // Layout properties
    document.getElementById('prop-x')?.addEventListener('input', (e) => {
        element.style.left = snapToGrid(parseInt(e.target.value) || 0) + 'px';
    });
    
    document.getElementById('prop-y')?.addEventListener('input', (e) => {
        element.style.top = snapToGrid(parseInt(e.target.value) || 0) + 'px';
    });
    
    document.getElementById('prop-width')?.addEventListener('input', (e) => {
        element.style.width = snapToGrid(parseInt(e.target.value) || 20) + 'px';
    });
    
    document.getElementById('prop-height')?.addEventListener('input', (e) => {
        element.style.height = snapToGrid(parseInt(e.target.value) || 20) + 'px';
    });
    
    document.getElementById('prop-zindex')?.addEventListener('input', (e) => {
        element.style.zIndex = parseInt(e.target.value) || 1;
    });
    
    // Typography properties
    const textEl = element.querySelector('.element-text, .element-title');
    if (textEl) {
        document.getElementById('prop-font-family')?.addEventListener('change', (e) => {
            textEl.style.fontFamily = e.target.value;
        });
        
        document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
            textEl.style.fontSize = (parseInt(e.target.value) || 14) + 'px';
        });
        
        document.getElementById('prop-font-weight')?.addEventListener('change', (e) => {
            textEl.style.fontWeight = e.target.value;
        });
        
        document.getElementById('prop-color')?.addEventListener('input', (e) => {
            textEl.style.color = e.target.value;
        });
        
        document.querySelectorAll('.align-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                textEl.style.textAlign = btn.dataset.align;
            });
        });
    }
    
    // Actions
    document.getElementById('btn-delete')?.addEventListener('click', () => deleteElement(element));
    document.getElementById('btn-duplicate')?.addEventListener('click', () => duplicateElement(element));
    document.getElementById('btn-bring-front')?.addEventListener('click', () => bringToFront(element));
    document.getElementById('btn-send-back')?.addEventListener('click', () => sendToBack(element));
}

// ════════════════════════════════════════════════════════════════════════════
// ELEMENT ACTIONS
// ════════════════════════════════════════════════════════════════════════════

function deleteElement(element) {
    if (confirm('Delete this element?')) {
        element.remove();
        deselectAll();
    }
}

function duplicateElement(element) {
    const clone = element.cloneNode(true);
    clone.dataset.id = generateUniqueId();
    
    // Offset position
    const x = parseInt(element.style.left) || 0;
    const y = parseInt(element.style.top) || 0;
    clone.style.left = (x + 20) + 'px';
    clone.style.top = (y + 20) + 'px';
    
    // Remove selected state and handles
    clone.classList.remove('selected');
    clone.querySelectorAll('.resize-handle').forEach(h => h.remove());
    
    // Make interactive
    makeElementInteractive(clone);
    
    // Add to container
    element.parentElement.appendChild(clone);
    
    // Select the clone
    selectElement(clone);
}

function bringToFront(element) {
    const maxZ = Math.max(...Array.from(element.parentElement.children)
        .map(el => parseInt(el.style.zIndex) || 1));
    element.style.zIndex = maxZ + 1;
    updatePropertiesPanel(element);
}

function sendToBack(element) {
    const minZ = Math.min(...Array.from(element.parentElement.children)
        .map(el => parseInt(el.style.zIndex) || 1));
    element.style.zIndex = Math.max(1, minZ - 1);
    updatePropertiesPanel(element);
}

function moveElement(element, dx, dy) {
    const x = parseInt(element.style.left) || 0;
    const y = parseInt(element.style.top) || 0;
    
    element.style.left = snapToGrid(x + dx) + 'px';
    element.style.top = snapToGrid(y + dy) + 'px';
    
    updatePropertiesPanel(element);
}

// ════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ════════════════════════════════════════════════════════════════════════════

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const selected = getSelectedElement();
        if (!selected) return;
        
        // Ignore if typing in input/textarea/contenteditable
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
        
        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                deleteElement(selected);
                break;
            case 'd':
            case 'D':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    duplicateElement(selected);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                moveElement(selected, 0, -(e.shiftKey ? 10 : 1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveElement(selected, 0, (e.shiftKey ? 10 : 1));
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveElement(selected, -(e.shiftKey ? 10 : 1), 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveElement(selected, (e.shiftKey ? 10 : 1), 0);
                break;
        }
    });
}

console.log('📄 report.js loaded');