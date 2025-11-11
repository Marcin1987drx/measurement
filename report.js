// ════════════════════════════════════════════════════════════════════════════
// REPORT STUDIO - Main JavaScript
// ════════════════════════════════════════════════════════════════════════════

const reportState = {
    project: {
        rootHandle: null,
        name: 'No Project Selected',
        maps: [],
        records: [],
        currentRecordIndex: 0  // Track current record
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

// Translation data
const translations = {
    en: {
        backToMain: 'Back to Main',
        components: 'Components',
        staticElements: 'Static Elements',
        textBlock: 'Text Block',
        title: 'Title',
        image: 'Image',
        line: 'Line',
        rectangle: 'Rectangle',
        pageNumber: 'Page Number',
        dynamicFields: 'Dynamic Fields',
        currentDate: 'Current Date',
        currentTime: 'Current Time',
        user: 'User/Inspector',
        schemaName: 'Schema Name',
        schemaVersion: 'Schema Version',
        qrCode: 'QR Code',
        overallStatus: 'Overall Status',
        dataComponents: 'Data Components',
        measurementTable: 'Measurement Table',
        chart: 'Chart',
        singleField: 'Single Field',
        visualization: 'Visualization',
        overviewImage: 'Overview Image',
        zoomImages: 'Zoom Images',
        autoVisualization: 'Auto (Overview + Zooms)',
        new: 'New',
        open: 'Open',
        save: 'Save',
        preview: 'Preview',
        generatePDF: 'Generate PDF',
        zoom: 'Zoom',
        grid: 'Grid',
        snap: 'Snap',
        rulers: 'Rulers',
        designer: 'Designer',
        generator: 'Generator',
        addPage: 'Add Page',
        properties: 'Properties',
        selectElement: 'Select an element to edit properties'
    },
    pl: {
        backToMain: 'Powrót do głównej',
        components: 'Komponenty',
        staticElements: 'Elementy statyczne',
        textBlock: 'Blok tekstu',
        title: 'Tytuł',
        image: 'Obraz',
        line: 'Linia',
        rectangle: 'Prostokąt',
        pageNumber: 'Numer strony',
        dynamicFields: 'Pola dynamiczne',
        currentDate: 'Bieżąca data',
        currentTime: 'Bieżący czas',
        user: 'Użytkownik/Inspektor',
        schemaName: 'Nazwa schematu',
        schemaVersion: 'Wersja schematu',
        qrCode: 'Kod QR',
        overallStatus: 'Status ogólny',
        dataComponents: 'Komponenty danych',
        measurementTable: 'Tabela pomiarów',
        chart: 'Wykres',
        singleField: 'Pojedyncze pole',
        visualization: 'Wizualizacja',
        overviewImage: 'Obraz poglądowy',
        zoomImages: 'Obrazy powiększone',
        autoVisualization: 'Auto (Przegląd + Powiększenia)',
        new: 'Nowy',
        open: 'Otwórz',
        save: 'Zapisz',
        preview: 'Podgląd',
        generatePDF: 'Generuj PDF',
        zoom: 'Powiększenie',
        grid: 'Siatka',
        snap: 'Przyciąganie',
        rulers: 'Linijki',
        designer: 'Projektant',
        generator: 'Generator',
        addPage: 'Dodaj stronę',
        properties: 'Właściwości',
        selectElement: 'Wybierz element, aby edytować właściwości'
    },
    de: {
        backToMain: 'Zurück zur Hauptseite',
        components: 'Komponenten',
        staticElements: 'Statische Elemente',
        textBlock: 'Textblock',
        title: 'Titel',
        image: 'Bild',
        line: 'Linie',
        rectangle: 'Rechteck',
        pageNumber: 'Seitenzahl',
        dynamicFields: 'Dynamische Felder',
        currentDate: 'Aktuelles Datum',
        currentTime: 'Aktuelle Zeit',
        user: 'Benutzer/Inspektor',
        schemaName: 'Schemaname',
        schemaVersion: 'Schemaversion',
        qrCode: 'QR-Code',
        overallStatus: 'Gesamtstatus',
        dataComponents: 'Datenkomponenten',
        measurementTable: 'Messtabelle',
        chart: 'Diagramm',
        singleField: 'Einzelfeld',
        visualization: 'Visualisierung',
        overviewImage: 'Übersichtsbild',
        zoomImages: 'Zoom-Bilder',
        autoVisualization: 'Auto (Übersicht + Zooms)',
        new: 'Neu',
        open: 'Öffnen',
        save: 'Speichern',
        preview: 'Vorschau',
        generatePDF: 'PDF generieren',
        zoom: 'Zoom',
        grid: 'Raster',
        snap: 'Einrasten',
        rulers: 'Lineale',
        designer: 'Designer',
        generator: 'Generator',
        addPage: 'Seite hinzufügen',
        properties: 'Eigenschaften',
        selectElement: 'Wählen Sie ein Element zum Bearbeiten der Eigenschaften'
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
    
    // Propagate theme change across the app
    const event = new CustomEvent('themeChanged', { detail: { theme: reportState.ui.theme } });
    window.dispatchEvent(event);
    console.log(`🎨 Theme toggled to: ${reportState.ui.theme}`);
}

function initializeLanguage() {
    // ✅ Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
        reportState.ui.language = savedLanguage;
        console.log(`🌐 Loaded saved language: ${savedLanguage}`);
    }
    
    const langSelect = document.getElementById('language-toggle');
    if (langSelect) langSelect.value = reportState.ui.language;
    document.body.setAttribute('lang', reportState.ui.language);
    
    // Apply translations to all i18n elements
    changeLanguage(reportState.ui.language);
}

function changeLanguage(lang) {
    console.log(`🌐 Language changed to: ${lang}`);
    reportState.ui.language = lang;
    localStorage.setItem('language', lang);
    document.body.setAttribute('lang', lang);
    
    // Update all i18n elements with translations
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Update placeholder texts
    const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
    i18nPlaceholders.forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    
    console.log(`✅ Updated ${i18nElements.length} UI elements with ${lang} translations`);
}

function loadProjectData() {
    try {
        // Changed from sessionStorage to localStorage
        const projectDataStr = localStorage.getItem('measurementProject');
        if (projectDataStr) {
            const projectData = JSON.parse(projectDataStr);
            reportState.project.name = projectData.name || 'Unknown Project';
            reportState.project.maps = projectData.maps || [];
            reportState.project.records = projectData.records || [];
            updateProjectDisplay();
            console.log(`📊 Data Manager: Loaded ${reportState.project.records.length} records from "${reportState.project.name}"`);
            console.log('📋 Sample record:', reportState.project.records[0]);
        } else {
            console.warn('⚠️ No project data found in localStorage. Please select a project in the main app first.');
            reportState.project.records = [];
        }
    } catch (error) {
        console.error('❌ Error loading project data:', error);
        reportState.project.records = [];
    }
}

function updateProjectDisplay() {
    const el = document.getElementById('project-folder-name');
    if (el) el.textContent = reportState.project.name;
}

// ════════════════════════════════════════════════════════════════════════════
// DATA MANAGER - Record Navigation
// ════════════════════════════════════════════════════════════════════════════

function setCurrentRecord(index) {
    if (index < 0 || index >= reportState.project.records.length) {
        console.warn('⚠️ Invalid record index:', index);
        return;
    }
    
    reportState.project.currentRecordIndex = index;
    updateRecordCounter();
    updateRecordSelector();
    refreshAllDynamicElements();
    
    console.log(`📊 Switched to record ${index + 1}/${reportState.project.records.length}`);
}

function populateRecordSelector() {
    const selector = document.getElementById('record-selector');
    if (!selector) return;
    
    const records = reportState.project.records;
    if (!records || records.length === 0) {
        selector.innerHTML = '<option value="">-- No records loaded --</option>';
        return;
    }
    
    // Clear existing options
    selector.innerHTML = '';
    
    // Add options for each record
    records.forEach((record, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        // Format: "✅ QR: 1234 | 2025-10-13 | OK | 4 MPs"
        const statusIcon = record.overallStatus === 'OK' ? '✅' : '❌';
        const qr = record.qrCode || 'N/A';
        const date = record.measurementDate || 'N/A';
        const status = record.overallStatus || 'N/A';
        const mpCount = record.measurements ? record.measurements.filter(m => m.Value).length : 0;
        
        option.textContent = `${statusIcon} QR: ${qr} | ${date} | ${status} | ${mpCount} MPs`;
        selector.appendChild(option);
    });
    
    // Select current record
    selector.value = reportState.project.currentRecordIndex;
    
    console.log(`📋 Populated selector with ${records.length} records`);
}

function updateRecordSelector() {
    const selector = document.getElementById('record-selector');
    if (selector) {
        selector.value = reportState.project.currentRecordIndex;
    }
}

function updateRecordCounter() {
    const counter = document.getElementById('record-counter');
    if (!counter) return;
    
    const records = reportState.project.records;
    const current = reportState.project.currentRecordIndex + 1;
    const total = records.length;
    
    counter.textContent = `${current} / ${total}`;
}

function setupRecordSelector() {
    const selector = document.getElementById('record-selector');
    const btnPrev = document.getElementById('btn-prev-record');
    const btnNext = document.getElementById('btn-next-record');
    
    if (!selector || !btnPrev || !btnNext) {
        console.warn('⚠️ Record selector elements not found');
        return;
    }
    
    // Dropdown change handler
    selector.addEventListener('change', (e) => {
        const index = parseInt(e.target.value);
        if (!isNaN(index)) {
            setCurrentRecord(index);
        }
    });
    
    // Previous button
    btnPrev.addEventListener('click', () => {
        const newIndex = reportState.project.currentRecordIndex - 1;
        if (newIndex >= 0) {
            setCurrentRecord(newIndex);
        }
    });
    
    // Next button
    btnNext.addEventListener('click', () => {
        const newIndex = reportState.project.currentRecordIndex + 1;
        if (newIndex < reportState.project.records.length) {
            setCurrentRecord(newIndex);
        }
    });
    
    // Initialize
    populateRecordSelector();
    updateRecordCounter();
    
    console.log('✅ Record selector initialized');
}

function refreshAllDynamicElements() {
    // Refresh all elements on the canvas that use dynamic data
    document.querySelectorAll('.canvas-element').forEach(element => {
        const type = element.dataset.type;
        if (['date', 'time', 'user', 'schemaName', 'schemaVersion', 'qrCode', 'status', 'table', 'chart'].includes(type)) {
            element.innerHTML = getElementContent(type);
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT SEARCH
// ════════════════════════════════════════════════════════════════════════════

function setupComponentSearch() {
    const searchInput = document.getElementById('component-search');
    if (!searchInput) {
        console.warn('⚠️ Component search input not found');
        return;
    }
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const componentItems = document.querySelectorAll('.component-item');
        
        componentItems.forEach(item => {
            const componentName = item.querySelector('.component-name');
            if (componentName) {
                const name = componentName.textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
        
        // Show/hide category headers based on visible items
        document.querySelectorAll('.component-category').forEach(category => {
            const visibleItems = category.querySelectorAll('.component-item[style*="display: flex"]');
            const categoryHeader = category.querySelector('.category-header');
            if (visibleItems.length === 0 && searchTerm !== '') {
                if (categoryHeader) categoryHeader.style.display = 'none';
            } else {
                if (categoryHeader) categoryHeader.style.display = 'flex';
            }
        });
    });
    
    console.log('✅ Component search initialized');
}

function setupEventListeners() {
    document.getElementById('btn-back-to-main')?.addEventListener('click', () => window.location.href = 'index.html');
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    document.getElementById('language-toggle')?.addEventListener('change', (e) => changeLanguage(e.target.value));
    
    document.getElementById('btn-new-template')?.addEventListener('click', () => {
        console.log('📄 New Template clicked');
        newTemplate();
    });
    document.getElementById('btn-open-template')?.addEventListener('click', () => {
        console.log('📂 Load Template clicked');
        openTemplate();
    });
    document.getElementById('btn-save-template')?.addEventListener('click', () => {
        console.log('💾 Save Template clicked');
        saveTemplate();
    });
    document.getElementById('btn-preview')?.addEventListener('click', () => {
        console.log('👁️ Preview clicked');
        showPreview();
    });
    document.getElementById('btn-generate-pdf')?.addEventListener('click', () => {
        console.log('📄 Generate PDF clicked');
        generatePDF();
    });
    
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => adjustZoom(25));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => adjustZoom(-25));
    
    document.getElementById('toggle-grid')?.addEventListener('change', (e) => {
        reportState.ui.gridEnabled = e.target.checked;
        document.querySelectorAll('.canvas-page').forEach(p => p.classList.toggle('hide-grid', !e.target.checked));
        console.log('Grid toggled:', e.target.checked ? 'visible' : 'hidden');
    });
    
    document.getElementById('btn-add-page')?.addEventListener('click', addPage);
    
    document.getElementById('toggle-snap')?.addEventListener('change', (e) => {
        reportState.ui.snapEnabled = e.target.checked;
    });
    
    setupDragAndDrop();
    setupKeyboardShortcuts();
    setupCanvasClickHandler();
    setupRecordSelector();
    setupComponentSearch();
    
    console.log('✅ All toolbar button event listeners connected');
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
    console.log('📂 Loading template...');
    
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) {
                console.log('No file selected');
                return;
            }
            
            const text = await file.text();
            const template = JSON.parse(text);
            
            console.log(`Loading template: ${template.meta?.name || 'Untitled'}`);
            console.log(`Pages to load: ${template.pages?.length || 0}`);
            
            // Load the template
            loadTemplateData(template);
            
        } catch (error) {
            console.error('❌ Error loading template:', error);
            alert('❌ Error loading template: ' + error.message);
        }
    };
    
    input.click();
}

function saveTemplate() {
    console.log('💾 Starting template save...');
    
    const name = prompt('Template name:', reportState.template.meta.name);
    if (!name) {
        console.log('Template save cancelled');
        return;
    }
    
    // Capture current canvas state
    const templateData = {
        meta: {
            name: name,
            paper: reportState.template.meta.paper,
            orientation: reportState.template.meta.orientation,
            savedAt: new Date().toISOString()
        },
        pages: []
    };
    
    // Collect all pages and their elements
    document.querySelectorAll('.canvas-page').forEach((page, pageIndex) => {
        const pageData = {
            id: pageIndex + 1,
            components: []
        };
        
        const pageContent = page.querySelector('.page-content');
        pageContent.querySelectorAll('.canvas-element').forEach(element => {
            const component = {
                id: element.dataset.id,
                type: element.dataset.type,
                position: {
                    x: parseInt(element.style.left) || 0,
                    y: parseInt(element.style.top) || 0
                },
                size: {
                    width: parseInt(element.style.width) || 200,
                    height: parseInt(element.style.height) || 50
                },
                style: {
                    zIndex: element.style.zIndex || '1',
                    border: element.style.border || '2px solid var(--accent-color)',
                    background: element.style.background || 'var(--bg-secondary)',
                    padding: element.style.padding || '8px'
                }
            };
            
            // Capture text content for text/title elements
            const textEl = element.querySelector('.element-text, .element-title');
            if (textEl) {
                component.content = textEl.textContent;
                component.textStyle = {
                    fontFamily: textEl.style.fontFamily || 'Arial',
                    fontSize: textEl.style.fontSize || '14px',
                    fontWeight: textEl.style.fontWeight || 'normal',
                    color: textEl.style.color || '#000000',
                    textAlign: textEl.style.textAlign || 'left'
                };
            }
            
            // ✅ Priority 3: Capture image data for image elements
            if (element.dataset.type === 'image' && element.dataset.imageData) {
                component.imageData = element.dataset.imageData;
                console.log('💾 Saving image data in template');
            }
            
            pageData.components.push(component);
        });
        
        templateData.pages.push(pageData);
    });
    
    // Count total elements
    const totalElements = templateData.pages.reduce((sum, page) => sum + page.components.length, 0);
    console.log(`Template has ${templateData.pages.length} page(s) with ${totalElements} element(s)`);
    
    // Save to localStorage template library
    try {
        let templates = JSON.parse(localStorage.getItem('reportTemplates') || '{}');
        templates[name] = templateData;
        localStorage.setItem('reportTemplates', JSON.stringify(templates));
        
        reportState.template.meta.name = name;
        
        // Download as JSON file
        const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`💾 Template saved and downloaded: ${name}`);
        alert(`✅ Template "${name}" saved and downloaded!`);
    } catch (error) {
        console.error('❌ Error saving template:', error);
        alert('❌ Failed to save template. Please try again.');
    }
}

function adjustZoom(delta) {
    reportState.ui.zoom = Math.max(50, Math.min(200, reportState.ui.zoom + delta));
    const el = document.getElementById('zoom-level');
    if (el) el.textContent = `${reportState.ui.zoom}%`;
    const container = document.getElementById('canvas-container');
    if (container) {
        container.style.transform = `scale(${reportState.ui.zoom / 100})`;
        container.style.transformOrigin = 'top left';
    }
    console.log(`🔍 Zoom adjusted to ${reportState.ui.zoom}%`);
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
    // Get current record data based on currentRecordIndex
    const currentRecord = reportState.project.records && reportState.project.records.length > 0 
        ? reportState.project.records[reportState.project.currentRecordIndex] 
        : null;
    
    const templates = {
        text: '<div class="element-text">Text Block</div>',
        title: '<div class="element-title">Title</div>',
        image: '<div class="element-image">🖼️ Image</div>',
        line: '<div class="element-line" style="height: 2px; background: #000; width: 100%;"></div>',
        rectangle: '<div style="width: 100%; height: 100%; border: 2px solid #000;"></div>',
        date: `<div class="element-field"><strong>Date:</strong> ${currentRecord ? currentRecord.measurementDate : '2025-11-10'}</div>`,
        time: `<div class="element-field"><strong>Time:</strong> ${currentRecord ? currentRecord.measurementTime : '09:55'}</div>`,
        user: `<div class="element-field"><strong>User:</strong> ${localStorage.getItem('username') || 'Marcin1987drx'}</div>`,
        schemaName: `<div class="element-field"><strong>Schema:</strong> ${currentRecord ? currentRecord.schemaName : 'Test Schema'}</div>`,
        schemaVersion: `<div class="element-field"><strong>Version:</strong> ${currentRecord ? currentRecord.schemaVersion : '1.0'}</div>`,
        qrCode: `<div class="element-field">🔲 ${currentRecord ? currentRecord.qrCode : 'QR Code'}</div>`,
        status: `<div class="element-field">${currentRecord && currentRecord.overallStatus === 'OK' ? '✅' : '❌'} Status: ${currentRecord ? currentRecord.overallStatus : 'OK'}</div>`,
        table: currentRecord && currentRecord.measurements && currentRecord.measurements.length > 0 
            ? renderMeasurementTable(currentRecord.measurements)
            : '<div class="element-field">📋 Measurement Table</div>',
        chart: currentRecord && currentRecord.measurements && currentRecord.measurements.length > 0 
            ? renderMeasurementChart(currentRecord.measurements)
            : '<div class="element-field">📈 Chart</div>',
        field: '<div class="element-field">🔍 Field Value</div>',
        vizOverview: currentRecord ? renderOverviewImage(currentRecord) : '<div class="element-field">🌅 Overview Image</div>',
        vizZooms: currentRecord ? renderZoomImages(currentRecord) : '<div class="element-field">🔎 Zoom Images</div>',
        vizAuto: currentRecord ? renderAutoVisualization(currentRecord) : '<div class="element-field">🤖 Auto Visualization</div>',
        pageNumber: '<div class="element-field">Page {page}</div>'
    };
    // Only return content if type is in the allowed templates (prevents XSS)
    return templates[type] || '<div class="element-field">Unknown Element</div>';
}

// Auto-Adaptive Render measurement table
function renderMeasurementTable(measurements) {
    if (!measurements || measurements.length === 0) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📋 No measurements available</div>';
    }
    
    // Filter out empty measurements (skip if no Value)
    const validMeasurements = measurements.filter(m => m.Value !== null && m.Value !== undefined && m.Value !== '');
    
    if (validMeasurements.length === 0) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📋 No valid measurements</div>';
    }
    
    // Count OK and NOK
    let okCount = 0;
    let nokCount = 0;
    validMeasurements.forEach(m => {
        if (m.Status === 'OK') okCount++;
        else nokCount++;
    });
    
    let html = '<div style="overflow:auto;max-height:100%;"><table style="width:100%;border-collapse:collapse;font-size:11px;">';
    html += '<thead><tr style="background:var(--bg-tertiary);font-weight:bold;position:sticky;top:0;">';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:left;min-width:60px;">MP ID</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:left;min-width:100px;">Name</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:right;min-width:60px;">Value</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:center;min-width:40px;">Unit</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:right;min-width:60px;">Nominal</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:right;min-width:50px;">Min</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:right;min-width:50px;">Max</th>';
    html += '<th style="border:1px solid var(--border-color);padding:6px;text-align:center;min-width:70px;">Status</th>';
    html += '</tr></thead><tbody>';
    
    // Render only valid measurements with alternating row colors
    validMeasurements.forEach((m, index) => {
        const statusIcon = m.Status === 'OK' ? '✅' : '❌';
        const statusColor = m.Status === 'OK' ? '#34c759' : '#ff3b30';
        const rowBg = index % 2 === 0 ? 'var(--bg-secondary)' : 'transparent';
        
        html += `<tr style="background:${rowBg};">`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;font-family:monospace;font-weight:600;">${m.MP_ID}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;">${m.Name || m.MP_ID}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:right;font-weight:bold;color:var(--text-primary);">${m.Value}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:center;font-size:10px;color:var(--text-secondary);">${m.Unit}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:right;color:var(--text-secondary);">${m.Nominal}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:right;color:#ff9500;">${m.Min}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:right;color:#ff3b30;">${m.Max}</td>`;
        html += `<td style="border:1px solid var(--border-color);padding:6px;text-align:center;color:${statusColor};font-weight:bold;font-size:12px;">${statusIcon} ${m.Status}</td>`;
        html += '</tr>';
    });
    
    // Add summary footer
    html += '</tbody><tfoot>';
    html += '<tr style="background:var(--bg-tertiary);font-weight:bold;border-top:2px solid var(--border-color);">';
    html += `<td colspan="8" style="border:1px solid var(--border-color);padding:8px;text-align:left;">`;
    html += `<strong>Total: ${validMeasurements.length} MPs</strong> | `;
    html += `<span style="color:#34c759;">✅ ${okCount}</span> | `;
    html += `<span style="color:#ff3b30;">❌ ${nokCount}</span>`;
    html += '</td>';
    html += '</tr>';
    html += '</tfoot></table></div>';
    return html;
}

// Render measurement chart using Canvas API
function renderMeasurementChart(measurements) {
    if (!measurements || measurements.length === 0) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📈 No measurements available</div>';
    }
    
    // Filter valid measurements
    const validMeasurements = measurements.filter(m => m.Value !== null && m.Value !== undefined && m.Value !== '');
    
    if (validMeasurements.length === 0) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📈 No valid measurements</div>';
    }
    
    // Create a unique ID for the canvas
    const chartId = 'chart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create canvas element
    const html = `<canvas id="${chartId}" style="width:100%;height:100%;"></canvas>`;
    
    // Schedule chart rendering after DOM update
    setTimeout(() => {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Set canvas size
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = canvas.offsetHeight || 300;
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Extract data
        const labels = validMeasurements.map(m => m.MP_ID);
        const values = validMeasurements.map(m => parseFloat(m.Value) || 0);
        const nominals = validMeasurements.map(m => parseFloat(m.Nominal) || 0);
        const statuses = validMeasurements.map(m => m.Status === 'OK');
        
        // Find min and max for scaling
        const allValues = [...values, ...nominals];
        const minVal = Math.min(...allValues) * 0.9;
        const maxVal = Math.max(...allValues) * 1.1;
        const range = maxVal - minVal;
        
        // Helper function to scale Y values
        const scaleY = (val) => {
            return height - padding - ((val - minVal) / range) * chartHeight;
        };
        
        // Helper function to scale X values
        const scaleX = (index) => {
            return padding + (index / (validMeasurements.length - 1)) * chartWidth;
        };
        
        // Draw axes
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw grid lines
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        const numGridLines = 5;
        for (let i = 0; i <= numGridLines; i++) {
            const y = padding + (i / numGridLines) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw nominal line
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < validMeasurements.length; i++) {
            const x = scaleX(i);
            const y = scaleY(nominals[i]);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw measurement line
        ctx.strokeStyle = '#007aff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < validMeasurements.length; i++) {
            const x = scaleX(i);
            const y = scaleY(values[i]);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw data points
        for (let i = 0; i < validMeasurements.length; i++) {
            const x = scaleX(i);
            const y = scaleY(values[i]);
            
            // Draw point
            ctx.fillStyle = statuses[i] ? '#34c759' : '#ff3b30';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i < validMeasurements.length; i++) {
            const x = scaleX(i);
            const label = labels[i];
            ctx.fillText(label, x, height - padding + 15);
        }
        
        // Draw Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= numGridLines; i++) {
            const val = minVal + (i / numGridLines) * range;
            const y = padding + ((numGridLines - i) / numGridLines) * chartHeight;
            ctx.fillText(val.toFixed(1), padding - 5, y + 3);
        }
        
        // Draw legend
        const legendY = padding - 20;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#007aff';
        ctx.fillRect(padding, legendY, 15, 3);
        ctx.fillStyle = '#666';
        ctx.fillText('Measured', padding + 20, legendY + 3);
        
        ctx.fillStyle = '#ffa500';
        ctx.fillRect(padding + 100, legendY, 15, 3);
        ctx.fillStyle = '#666';
        ctx.fillText('Nominal', padding + 120, legendY + 3);
        
    }, 100);
    
    return html;
}

// Render overview image from project folder
function renderOverviewImage(record) {
    if (!record || !record.qrCode) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📷 No record data</div>';
    }
    
    try {
        const projectDataStr = localStorage.getItem('measurementProject');
        if (!projectDataStr) {
            return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📷 No project loaded</div>';
        }
        
        const projectData = JSON.parse(projectDataStr);
        const projectName = projectData.name || 'Unknown';
        const overviewPath = `${projectName}/${record.qrCode}/overview.png`;
        
        const id = `img-${Date.now()}`;
        setTimeout(async () => {
            try {
                const fs = window.fileSystemAdapter;
                const url = await fs.getImageURL(overviewPath);
                const imgEl = document.getElementById(id);
                if (imgEl) {
                    imgEl.innerHTML = `<img src="${url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="Overview">`;
                }
            } catch (e) {
                console.warn('📷 Overview image not found:', overviewPath, e);
                const imgEl = document.getElementById(id);
                if (imgEl) {
                    imgEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-secondary);">📷 Image not found</div>';
                }
            }
        }, 50);
        return `<div id="${id}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">⏳ Loading...</div>`;
    } catch (error) {
        console.error('Error rendering overview image:', error);
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">📷 Error loading image</div>';
    }
}

// Render zoom images from project folder
function renderZoomImages(record) {
    if (!record || !record.qrCode) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🔍 No record</div>';
    }
    
    const measurements = (record.measurements || []).filter(m => m.Value);
    if (measurements.length === 0) {
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🔍 No measurements</div>';
    }
    
    try {
        const projectDataStr = localStorage.getItem('measurementProject');
        if (!projectDataStr) {
            return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🔍 No project loaded</div>';
        }
        
        const projectData = JSON.parse(projectDataStr);
        const projectName = projectData.name || 'Unknown';
        
        const containerId = `zoom-container-${Date.now()}`;
        const baseImgId = `zoom-img-${Date.now()}`;
        
        let html = `<div id="${containerId}" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;padding:8px;overflow:auto;height:100%;">`;
        
        measurements.forEach((m, idx) => {
            const imgId = `${baseImgId}-${idx}`;
            html += `
                <div style="border:1px solid var(--border-color);padding:4px;text-align:center;">
                    <div style="font-size:10px;font-weight:bold;margin-bottom:4px;">${m.MP_ID}</div>
                    <div id="${imgId}" style="min-height:80px;display:flex;align-items:center;justify-content:center;">⏳</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        setTimeout(async () => {
            const fs = window.fileSystemAdapter;
            for (let idx = 0; idx < measurements.length; idx++) {
                const m = measurements[idx];
                const imgId = `${baseImgId}-${idx}`;
                const imgEl = document.getElementById(imgId);
                if (imgEl) {
                    try {
                        const zoomPath = `${projectName}/${record.qrCode}/zooms/${m.MP_ID}.png`;
                        const url = await fs.getImageURL(zoomPath);
                        imgEl.innerHTML = `<img src="${url}" alt="${m.MP_ID}" style="width:100%;height:auto;">`;
                    } catch (e) {
                        console.warn(`🔍 Zoom image not found for ${m.MP_ID}:`, e);
                        imgEl.innerHTML = '<div style="padding:20px;font-size:10px;color:var(--text-secondary);">🔍 Not available</div>';
                    }
                }
            }
        }, 50);
        
        return html;
    } catch (error) {
        console.error('Error rendering zoom images:', error);
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🔍 Error loading images</div>';
    }
}

// Render auto visualization (overview + zooms)
function renderAutoVisualization(record) {
    try {
        const projectDataStr = localStorage.getItem('measurementProject');
        if (!projectDataStr) {
            return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🤖 No project loaded</div>';
        }
        
        const projectData = JSON.parse(projectDataStr);
        const projectName = projectData.name || 'Unknown';
        
        if (!record || !record.qrCode) {
            return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🤖 No record data</div>';
        }
        
        const measurements = record.measurements || [];
        const validMeasurements = measurements.filter(m => m.Value !== null && m.Value !== undefined && m.Value !== '');
        
        const overviewId = `auto-overview-${Date.now()}`;
        const zoomsContainerId = `auto-zooms-${Date.now()}`;
        
        let html = '<div style="display:flex;flex-direction:column;gap:8px;padding:8px;width:100%;height:100%;overflow:auto;">';
        
        // Overview section
        html += `<div style="border:1px solid var(--border-color);padding:8px;">
            <div style="font-weight:bold;margin-bottom:4px;">Overview</div>
            <div id="${overviewId}" style="min-height:100px;display:flex;align-items:center;justify-content:center;">⏳ Loading...</div>
        </div>`;
        
        // Zooms section
        html += `<div style="border:1px solid var(--border-color);padding:8px;">
            <div style="font-weight:bold;margin-bottom:4px;">Measurement Zooms</div>
            <div id="${zoomsContainerId}" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:4px;">`;
        
        validMeasurements.forEach((m, idx) => {
            const zoomImgId = `auto-zoom-${Date.now()}-${idx}`;
            html += `<div style="border:1px solid var(--border-color);padding:2px;text-align:center;">
                <div style="font-size:9px;font-weight:bold;">${m.MP_ID}</div>
                <div id="${zoomImgId}" style="min-height:60px;display:flex;align-items:center;justify-content:center;">⏳</div>
            </div>`;
        });
        
        html += '</div></div></div>';
        
        // Load images asynchronously
        setTimeout(async () => {
            const fs = window.fileSystemAdapter;
            
            // Load overview
            try {
                const overviewPath = `${projectName}/${record.qrCode}/overview.png`;
                const overviewUrl = await fs.getImageURL(overviewPath);
                const overviewEl = document.getElementById(overviewId);
                if (overviewEl) {
                    overviewEl.innerHTML = `<img src="${overviewUrl}" alt="Overview" style="width:100%;height:auto;object-fit:contain;">`;
                }
            } catch (e) {
                console.warn('🌅 Overview image not found:', e);
                const overviewEl = document.getElementById(overviewId);
                if (overviewEl) {
                    overviewEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">🌅 Not available</div>';
                }
            }
            
            // Load zoom images
            for (let idx = 0; idx < validMeasurements.length; idx++) {
                const m = validMeasurements[idx];
                const zoomImgId = `auto-zoom-${Date.now()}-${idx}`;
                const zoomEl = document.getElementById(zoomImgId);
                if (zoomEl) {
                    try {
                        const zoomPath = `${projectName}/${record.qrCode}/zooms/${m.MP_ID}.png`;
                        const zoomUrl = await fs.getImageURL(zoomPath);
                        zoomEl.innerHTML = `<img src="${zoomUrl}" alt="${m.MP_ID}" style="width:100%;height:auto;">`;
                    } catch (e) {
                        console.warn(`🔍 Zoom image not found for ${m.MP_ID}:`, e);
                        zoomEl.innerHTML = '<div style="font-size:9px;color:var(--text-secondary);">N/A</div>';
                    }
                }
            }
        }, 50);
        
        return html;
    } catch (error) {
        console.error('Error rendering auto visualization:', error);
        return '<div class="element-field" style="padding:16px;text-align:center;color:var(--text-secondary);">🤖 Error loading visualization</div>';
    }
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
    
    // ✅ Priority 3: Add click handler for image upload (in addition to double-click)
    if (type === 'image') {
        element.style.cursor = 'pointer';
        element.title = '📷 Click to upload image';
    }
    
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
    
    // Double-click to edit text or upload image
    element.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        
        // ✅ Priority 3: Handle image upload
        if (element.dataset.type === 'image') {
            console.log('📷 Image upload triggered');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const fileSizeKB = Math.round(file.size / 1024);
                    console.log(`📷 Image selected: ${file.name}, ${fileSizeKB}KB`);
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const imageEl = element.querySelector('.element-image');
                        if (imageEl) {
                            imageEl.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
                            element.dataset.imageData = event.target.result;
                            console.log(`✅ Image uploaded: ${fileSizeKB}KB`);
                            console.log('✅ Image data stored in element');
                        }
                    };
                    reader.onerror = (error) => {
                        console.error('❌ Error reading image file:', error);
                        alert('❌ Failed to load image. Please try again.');
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
            return;
        }
        
        // Handle text editing
        const textEl = element.querySelector('.element-text, .element-title');
        if (textEl) {
            textEl.contentEditable = 'true';
            textEl.style.pointerEvents = 'auto';
            textEl.focus();
            
            // Select all text
            const range = document.createRange();
            range.selectNodeContents(textEl);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Disable editing on blur
            const onBlur = () => {
                textEl.contentEditable = 'false';
                textEl.style.pointerEvents = 'none';
                textEl.removeEventListener('blur', onBlur);
            };
            textEl.addEventListener('blur', onBlur);
        }
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
    
    // Page Number section for pageNumber elements
    if (type === 'pageNumber') {
        const pageNum = element.dataset.pageNumber || '1';
        html += `
            <div class="property-section">
                <div class="property-section-title">Page Number Settings</div>
                <div class="property-row full">
                    <div class="property-field">
                        <label class="property-label">Page Number</label>
                        <input type="number" class="property-input" id="prop-page-number" value="${pageNum}" min="1">
                    </div>
                </div>
                <div class="property-row full">
                    <div class="property-field">
                        <label class="property-label">Format</label>
                        <select class="property-select" id="prop-page-format">
                            <option value="Page {page}">Page {page}</option>
                            <option value="{page}">{page}</option>
                            <option value="Page {page} of {total}">Page {page} of {total}</option>
                            <option value="{page} / {total}">{page} / {total}</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
    
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
    
    // Image Upload section for image elements
    if (type === 'image') {
        html += `
            <div class="property-section">
                <div class="property-section-title">Image Upload</div>
                <button id="btn-properties-upload" class="btn btn-primary" style="width:100%;margin-top:8px;">
                    📷 Upload Photo
                </button>
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
    
    // Page Number properties
    if (element.dataset.type === 'pageNumber') {
        document.getElementById('prop-page-number')?.addEventListener('input', (e) => {
            element.dataset.pageNumber = parseInt(e.target.value) || 1;
            const format = element.dataset.pageFormat || 'Page {page}';
            const fieldEl = element.querySelector('.element-field');
            if (fieldEl) {
                fieldEl.textContent = format.replace('{page}', element.dataset.pageNumber).replace('{total}', '1');
            }
        });
        
        document.getElementById('prop-page-format')?.addEventListener('change', (e) => {
            element.dataset.pageFormat = e.target.value;
            const pageNum = element.dataset.pageNumber || '1';
            const fieldEl = element.querySelector('.element-field');
            if (fieldEl) {
                fieldEl.textContent = e.target.value.replace('{page}', pageNum).replace('{total}', '1');
            }
        });
    }
    
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
    
    // Image upload button
    if (element.dataset.type === 'image') {
        setTimeout(() => {
            const uploadBtn = document.getElementById('btn-properties-upload');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    // Trigger same file picker as double-click
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const imageEl = element.querySelector('.element-image');
                            if (imageEl) {
                                imageEl.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
                                element.dataset.imageData = event.target.result;
                                console.log('✅ Image uploaded via Properties button');
                            }
                        };
                        reader.readAsDataURL(file);
                    };
                    input.click();
                });
            }
        }, 50);
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
    console.log(`✅ Brought to front: z-index = ${element.style.zIndex}`);
    updatePropertiesPanel(element);
}

function sendToBack(element) {
    const minZ = Math.min(...Array.from(element.parentElement.children)
        .map(el => parseInt(el.style.zIndex) || 1));
    element.style.zIndex = Math.max(1, minZ - 1);
    console.log(`✅ Sent to back: z-index = ${element.style.zIndex}`);
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
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        
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

// ════════════════════════════════════════════════════════════════════════════
// TEMPLATE LOADING
// ════════════════════════════════════════════════════════════════════════════

function loadTemplateData(templateData) {
    try {
        // Clear existing canvas
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.error('❌ Canvas container not found');
            return;
        }
        
        // Remove all existing pages
        container.innerHTML = '';
        
        // Update template metadata
        reportState.template.meta = templateData.meta;
        reportState.template.pages = [];
        
        // Recreate pages from template
        templateData.pages.forEach((pageData, pageIndex) => {
            // Create page element
            const page = document.createElement('div');
            page.className = 'canvas-page';
            page.dataset.page = pageData.id;
            
            const pageHeader = document.createElement('div');
            pageHeader.className = 'page-header';
            pageHeader.innerHTML = `<span class="page-number">Page ${pageData.id}</span>`;
            
            const pageContent = document.createElement('div');
            pageContent.className = 'page-content';
            pageContent.id = `page-content-${pageData.id}`;
            
            page.appendChild(pageHeader);
            page.appendChild(pageContent);
            container.appendChild(page);
            
            // Recreate components on this page
            pageData.components.forEach(comp => {
                const element = document.createElement('div');
                element.className = 'canvas-element';
                element.dataset.type = comp.type;
                element.dataset.id = comp.id;
                
                // Set position and size
                element.style.position = 'absolute';
                element.style.left = comp.position.x + 'px';
                element.style.top = comp.position.y + 'px';
                element.style.width = comp.size.width + 'px';
                element.style.height = comp.size.height + 'px';
                
                // Set style
                element.style.zIndex = comp.style.zIndex;
                element.style.border = comp.style.border;
                element.style.background = comp.style.background;
                element.style.padding = comp.style.padding;
                
                // Set content
                if (comp.content && comp.textStyle) {
                    // Text/title element
                    const textEl = document.createElement('div');
                    textEl.className = comp.type === 'title' ? 'element-title' : 'element-text';
                    textEl.textContent = comp.content;
                    textEl.style.fontFamily = comp.textStyle.fontFamily;
                    textEl.style.fontSize = comp.textStyle.fontSize;
                    textEl.style.fontWeight = comp.textStyle.fontWeight;
                    textEl.style.color = comp.textStyle.color;
                    textEl.style.textAlign = comp.textStyle.textAlign;
                    element.appendChild(textEl);
                } else if (comp.type === 'image' && comp.imageData) {
                    // ✅ Priority 3: Restore image element with saved data
                    const imageEl = document.createElement('div');
                    imageEl.className = 'element-image';
                    imageEl.innerHTML = `<img src="${comp.imageData}" style="width: 100%; height: 100%; object-fit: contain;">`;
                    element.appendChild(imageEl);
                    element.dataset.imageData = comp.imageData;
                    element.style.cursor = 'pointer';
                    element.title = '📷 Click to upload image';
                    console.log('📂 Restored image from template');
                } else {
                    // Dynamic element - get fresh content
                    element.innerHTML = getElementContent(comp.type);
                    if (comp.type === 'image') {
                        element.style.cursor = 'pointer';
                        element.title = '📷 Click to upload image';
                    }
                }
                
                // Make interactive
                makeElementInteractive(element);
                
                // Add to page
                pageContent.appendChild(element);
            });
            
            reportState.template.pages.push(pageData);
        });
        
        alert(`✅ Template "${templateData.meta.name}" loaded successfully!`);
        console.log('📂 Template loaded:', templateData.meta.name);
        
    } catch (error) {
        console.error('❌ Error loading template:', error);
        alert('❌ Failed to load template.');
    }
}

// ════════════════════════════════════════════════════════════════════════════
// PREVIEW FUNCTION
// ════════════════════════════════════════════════════════════════════════════

function showPreview() {
    console.log('👁️ Showing preview...');
    
    const canvasPages = document.querySelectorAll('.canvas-page');
    if (canvasPages.length === 0) {
        alert('No pages to preview. Add elements to the canvas first.');
        return;
    }
    
    // Build preview HTML
    let pagesHTML = '';
    canvasPages.forEach((page, index) => {
        const pageContent = page.querySelector('.page-content');
        if (pageContent) {
            pagesHTML += `
                <div class="preview-page" style="
                    width: 794px;
                    height: 1123px;
                    margin: 20px auto;
                    background: white;
                    border: 1px solid #ccc;
                    position: relative;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    page-break-after: always;
                ">
                    ${pageContent.innerHTML.replace(/canvas-element/g, 'preview-element')}
                </div>
            `;
        }
    });
    
    const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Preview</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background: #f0f0f0;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .preview-element {
                    position: absolute;
                    border: none !important;
                    outline: none !important;
                }
                .preview-element:hover {
                    box-shadow: none !important;
                }
                .resize-handle {
                    display: none !important;
                }
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    .preview-page {
                        margin: 0;
                        border: none;
                        box-shadow: none;
                        page-break-after: always;
                    }
                }
            </style>
        </head>
        <body>
            <h2>Report Preview</h2>
            ${pagesHTML}
        </body>
        </html>
    `;
    
    const previewWindow = window.open('', 'Preview', 'width=900,height=1200,scrollbars=yes');
    if (previewWindow) {
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
        console.log('✅ Preview window opened');
    } else {
        alert('Failed to open preview window. Please allow pop-ups for this site.');
    }
}

// ════════════════════════════════════════════════════════════════════════════
// PDF GENERATION
// ════════════════════════════════════════════════════════════════════════════

function generatePDF() {
    console.log('📄 Starting PDF generation...');
    
    try {
        // Check if jsPDF is loaded
        if (typeof window.jspdf === 'undefined') {
            alert('❌ jsPDF library not loaded. Please refresh the page.');
            console.error('❌ jsPDF not available');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: reportState.template.meta.orientation || 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Get all pages
        const pages = document.querySelectorAll('.canvas-page');
        
        if (pages.length === 0) {
            alert('No pages to export. Add elements to the canvas first.');
            return;
        }
        
        // Process each page
        pages.forEach((page, pageIndex) => {
            if (pageIndex > 0) {
                doc.addPage();
            }
            
            const pageContent = page.querySelector('.page-content');
            const elements = pageContent.querySelectorAll('.canvas-element');
            
            // Render each element
            elements.forEach(element => {
                const type = element.dataset.type;
                const x = parseInt(element.style.left) || 0;
                const y = parseInt(element.style.top) || 0;
                const width = parseInt(element.style.width) || 200;
                const height = parseInt(element.style.height) || 50;
                
                // Convert pixel coordinates to mm (rough conversion: 1px ≈ 0.26mm)
                const pxToMm = 0.26;
                const xMm = x * pxToMm;
                const yMm = y * pxToMm;
                const widthMm = width * pxToMm;
                const heightMm = height * pxToMm;
                
                // Render based on element type
                if (['text', 'title'].includes(type)) {
                    const textEl = element.querySelector('.element-text, .element-title');
                    if (textEl) {
                        const text = textEl.textContent;
                        const fontSize = parseInt(window.getComputedStyle(textEl).fontSize) || 14;
                        const fontWeight = window.getComputedStyle(textEl).fontWeight;
                        
                        doc.setFontSize(fontSize * 0.75); // Convert px to pt
                        doc.setFont('helvetica', fontWeight === 'bold' || fontWeight >= 600 ? 'bold' : 'normal');
                        doc.text(text, xMm, yMm + 5);
                    }
                } else if (type === 'line') {
                    doc.setLineWidth(0.5);
                    doc.line(xMm, yMm, xMm + widthMm, yMm);
                } else if (type === 'rectangle') {
                    doc.setLineWidth(0.5);
                    doc.rect(xMm, yMm, widthMm, heightMm);
                } else if (['date', 'time', 'user', 'schemaName', 'schemaVersion', 'qrCode', 'status', 'field'].includes(type)) {
                    // Dynamic fields - extract text content
                    const fieldEl = element.querySelector('.element-field');
                    if (fieldEl) {
                        const text = fieldEl.textContent;
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.text(text, xMm, yMm + 5);
                    }
                } else if (type === 'table') {
                    // Render table - simplified version
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.text('📋 Measurement Table', xMm, yMm + 5);
                    
                    // Get current record
                    const currentRecord = reportState.project.records && reportState.project.records.length > 0 
                        ? reportState.project.records[reportState.project.currentRecordIndex] 
                        : null;
                    
                    if (currentRecord && currentRecord.measurements) {
                        const validMeasurements = currentRecord.measurements.filter(m => m.Value !== null && m.Value !== undefined && m.Value !== '');
                        
                        let tableY = yMm + 10;
                        const lineHeight = 4;
                        
                        // Table headers
                        doc.setFont('helvetica', 'bold');
                        doc.text('MP ID', xMm + 2, tableY);
                        doc.text('Value', xMm + 20, tableY);
                        doc.text('Status', xMm + 35, tableY);
                        tableY += lineHeight;
                        
                        doc.setFont('helvetica', 'normal');
                        
                        // Table rows (limited to fit in height)
                        const maxRows = Math.floor((heightMm - 15) / lineHeight);
                        validMeasurements.slice(0, maxRows).forEach(m => {
                            doc.text(m.MP_ID || '', xMm + 2, tableY);
                            doc.text(String(m.Value), xMm + 20, tableY);
                            doc.text(m.Status || '', xMm + 35, tableY);
                            tableY += lineHeight;
                        });
                    }
                } else {
                    // Other elements - render as text placeholder
                    doc.setFontSize(10);
                    doc.text(`[${type}]`, xMm, yMm + 5);
                }
            });
            
            // Add page number
            doc.setFontSize(8);
            doc.text(`Page ${pageIndex + 1} of ${pages.length}`, pageWidth - 30, pageHeight - 10);
        });
        
        // Generate filename
        const templateName = reportState.template.meta.name || 'report';
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${templateName}_${timestamp}.pdf`;
        
        // Download PDF
        doc.save(filename);
        
        console.log('✅ PDF generated:', filename);
        alert(`✅ PDF "${filename}" generated successfully!`);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('❌ Failed to generate PDF. Please check the console for details.');
    }
}

console.log('📄 report.js loaded');