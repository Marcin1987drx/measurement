document.addEventListener('DOMContentLoaded', () => {

    // =========================================
    // [SECTION] LIBRARY VALIDATION
    // =========================================
    const validateLibraries = () => {
        const missing = [];
        if (typeof Chart === 'undefined') missing.push('chart.min.js');
        if (typeof Chart !== 'undefined' && !Chart.register) missing.push('chart.min.js (wrong version)');
        
        if (missing.length > 0) {
            alert(`⚠️ Missing libraries in libs/ folder:\n\n${missing.join('\n')}\n\nPlease add these files to continue.`);
            return false;
        }
        return true;
    };

    if (!validateLibraries()) return;

    // =========================================
    // [SECTION] STATE & CONSTANTS
    // =========================================
    const appState = {
        projectRootHandle: null,
        fileHandles: {
            db: null,
            maps: {},
            backgrounds: {}
        },
        data: {
            db: [],
            dbHeaders: [],
            currentMap: null,
            analysisData: [],
            columnFormulas: {} 
        },
        ui: {
            language: 'en',
            logoImage: null,
            selectedMPId: null,
            dragging: null,
            isEditorOpen: false,
            isDbViewerOpen: false,
            editorState: null,
            editorIsDirty: false,
            chartInstance: null,
            analysisMode: 'trend',
            hiddenRecordIds: new Set(),
            canvasZoom: { scale: 1, offsetX: 0, offsetY: 0 },
            isZoomActive: false,
            isPanning: false,
            panStart: { x: 0, y: 0 },
            currentMPView: null,
            labelUpdateScheduled: false,
            dbHeaderContextMenu: { visible: false, target: null, x: 0, y: 0 },
            dbDraggedColumnIndex: -1,
            formulaSuggestions: { visible: false, items: [], activeIndex: -1, targetCell: null },
            currentBackgroundUrl: null  // Track current background blob URL for cleanup
        }
    };

    const VIEWBOX_WIDTH = 1000;
    const VIEWBOX_HEIGHT = 700;
    const READONLY_COLS = ['RecordId', 'Timestamp', 'SchemaName', 'SchemaVersion', 'OverallStatus', 'Comment'];

    // =========================================
    // [SECTION] DOM ELEMENTS
    // =========================================
    const dom = {
        headerLogo: document.getElementById('header-logo'),
        languageToggle: document.getElementById('language-toggle'),
        themeToggle: document.getElementById('theme-toggle'),
        btnProjectFolder: document.getElementById('btn-project-folder'),
        projectFolderName: document.getElementById('project-folder-name'),
        qrCodeInput: document.getElementById('qr-code'),
        mapSelect: document.getElementById('map-select'),
        mpList: document.getElementById('mp-list'),
        btnSave: document.getElementById('btn-save'),
        saveConfirmationOverlay: document.getElementById('save-confirmation-overlay'),
        canvasWrapper: document.getElementById('canvas-wrapper'),
        backgroundImg: document.getElementById('background-img'),
        overlaySvg: document.getElementById('overlay-svg'),
        labelsContainer: document.getElementById('labels-container'),
        backgroundUploader: document.getElementById('background-uploader'),
        schemaEditor: document.getElementById('schema-editor'),
        schemaEditorContent: document.getElementById('schema-editor-content'),
        btnNewSchema: document.getElementById('btn-new-schema'),
        btnEditSchema: document.getElementById('btn-edit-schema'),
        btnCloseEditor: document.getElementById('btn-close-editor'),
        editorAddMpBtn: document.getElementById('editor-add-mp-btn'),
        btnSaveMap: document.getElementById('btn-save-map'),
        dbViewerModal: document.getElementById('db-viewer-modal'),
        dbTable: document.getElementById('db-table'),
        btnDbViewer: document.getElementById('btn-db-viewer'),
        btnCloseDbViewer: document.getElementById('btn-close-db-viewer'),
        btnSaveDb: document.getElementById('btn-save-db'),
        dbSearchInput: document.getElementById('db-search-input'),
        mpRowTemplateSingle: document.getElementById('mp-row-template-single'),
        mpRowTemplateTable: document.getElementById('mp-row-template-table'),
        visualizationBgToggle: document.getElementById('visualization-bg-toggle'),
        visualizationBgColor: document.getElementById('visualization-bg-color'),
        btnAnalysis: document.getElementById('btn-analysis'),
        analysisModal: document.getElementById('analysis-modal'),
        btnCloseAnalysisModal: document.getElementById('btn-close-analysis-modal'),
        analysisModeSelector: document.getElementById('analysis-mode-selector'),
        analysisFilterGroupTrend: document.getElementById('analysis-filter-group-trend'),
        analysisFilterGroupProfile: document.getElementById('analysis-filter-group-profile'),
        analysisRecordSelect: document.getElementById('analysis-record-select'),
        analysisDateFrom: document.getElementById('analysis-date-from'),
        analysisDateTo: document.getElementById('analysis-date-to'),
        analysisProfileDateFrom: document.getElementById('analysis-profile-date-from'),
        analysisProfileDateTo: document.getElementById('analysis-profile-date-to'),
        analysisQrSearch: document.getElementById('analysis-qr-search'),
        analysisSchemasList: document.getElementById('analysis-schemas-list'),
        analysisChartTitle: document.getElementById('analysis-chart-title'),
        analysisChartType: document.getElementById('analysis-chart-type'),
        analysisAxisX: document.getElementById('analysis-axis-x'),
        analysisAxisY: document.getElementById('analysis-axis-y'),
        mpListContainer: document.getElementById('mp-list-container'),
        analysisMpsList: document.getElementById('analysis-mps-list'),
        analysisChart: document.getElementById('analysis-chart'),
        analysisChartBgToggle: document.getElementById('analysis-chart-bg-toggle'),
        analysisChartBgColor: document.getElementById('analysis-chart-bg-color'),
        btnExportPNG: document.getElementById('btn-export-png'),
        btnExportCSV: document.getElementById('btn-export-csv'),
        chartResetViewBtn: document.getElementById('chart-reset-view-btn'),
        btnResetView: document.getElementById('btn-reset-view'),
        minimapCanvas: document.getElementById('minimap-canvas'),
        dbHeaderContextMenu: document.getElementById('db-header-context-menu'),
        formulaSuggestions: document.getElementById('formula-suggestions'),
    };

    // =========================================
    // [SECTION] TRANSLATIONS & HELPERS
    // =========================================
    const translations = {
        en: { projectFolder: 'Project Folder', editSchema: 'Edit Schema', newSchema: 'New Schema', dbViewer: 'DB Viewer', analysis: 'Analysis', qrCode: 'QR Code', schemaName: 'Schema Name', schemaVersion: 'Schema Version', drawingBackground: 'Drawing Background', metaLabels: 'Meta Labels', showQR: 'Show QR', showDate: 'Show Date', selectMapPrompt: 'Select a schema to begin.', comment: 'Comment', save: 'Save', saveSuccess: 'Saved!', map: 'Schema', deleteSchema: 'Delete Schema', confirmDelete: 'Are you sure you want to delete this schema?', deleteSuccess: 'Schema deleted.', deleteError: 'Error deleting schema.', schemaInfoMissing: 'Schema Name and Version are required.', saveError: 'Error saving.', exportSuccess: 'Export successful!', confirmExitEditor: 'You have unsaved changes. Are you sure you want to exit?', name: 'Name', unit: 'Unit', nominal: 'Nominal', min: 'Min', max: 'Max', arrows: 'Arrows', addArrow: 'Add Arrow', arrowWidth: 'Width', arrowColor: 'Color', arrowHead: 'Head', columns: 'Columns', addColumn: 'Add Column', setView: 'Set View', clearView: 'Clear View', confirmDeleteRecord: "Are you sure you to delete this record?", exportPNG: "Export PNG", actions: "Actions" },
        pl: { projectFolder: 'Folder Projektu', editSchema: 'Edytuj Schemat', newSchema: 'Nowy Schemat', dbViewer: 'Baza Danych', analysis: 'Analiza', qrCode: 'Kod QR', schemaName: 'Nazwa Schematu', schemaVersion: 'Wersja Schematu', drawingBackground: 'Tło Rysunku', metaLabels: 'Etykiety Meta', showQR: 'Pokaż QR', showDate: 'Pokaż Datę', selectMapPrompt: 'Wybierz schemat, aby rozpocząć.', comment: 'Komentarz', save: 'Zapisz', saveSuccess: 'Zapisano!', map: 'Schemat', deleteSchema: 'Usuń Schemat', confirmDelete: 'Czy na pewno chcesz usunąć ten schemat?', deleteSuccess: 'Schemat usunięty.', deleteError: 'Błąd podczas usuwania schematu.', schemaInfoMissing: 'Nazwa i wersja schematu są wymagane.', saveError: 'Błąd zapisu.', exportSuccess: 'Eksport udany!', confirmExitEditor: 'Masz niezapisane zmiany. Czy na pewno chcesz wyjść?', name: 'Nazwa', unit: 'Jedn.', nominal: 'Nominał', min: 'Min', max: 'Max', arrows: 'Strzałki', addArrow: 'Dodaj strzałkę', arrowWidth: 'Szerokość', arrowColor: 'Kolor', arrowHead: 'Grot', columns: 'Kolumny', addColumn: 'Dodaj kolumnę', setView: 'Ustaw Widok', clearView: 'Wyczyść Widok', confirmDeleteRecord: "Czy na pewno chcesz usunąć ten rekord?", exportPNG: "Eksportuj PNG", actions: "Akcje" },
        de: { projectFolder: 'Projektordner', editSchema: 'Schema bearbeiten', newSchema: 'Neues Schema', dbViewer: 'DB-Ansicht', analysis: 'Analyse', qrCode: 'QR-Code', schemaName: 'Schemaname', schemaVersion: 'Schemaversion', drawingBackground: 'Zeichnungshintergrund', metaLabels: 'Meta-Labels', showQR: 'QR anzeigen', showDate: 'Datum anzeigen', selectMapPrompt: 'Wählen Sie ein Schema, um zu beginnen.', comment: 'Kommentar', save: 'Speichern', saveSuccess: 'Gespeichert!', map: 'Schema', deleteSchema: 'Schema löschen', confirmDelete: 'Sind Sie sicher, dass Sie dieses Schema löschen möchten?', deleteSuccess: 'Schema gelöscht.', deleteError: 'Fehler beim Löschen des Schemas.', schemaInfoMissing: 'Schemaname und -version sind erforderlich.', saveError: 'Fehler beim Speichern.', exportSuccess: 'Export erfolgreich!', confirmExitEditor: 'Sie haben ungespeicherte Änderungen. Sind Sie sicher, dass Sie den Editor verlassen möchten?', name: 'Name', unit: 'Einheit', nominal: 'Nominal', min: 'Min', max: 'Max', arrows: 'Pfeile', addArrow: 'Pfeil hinzufügen', arrowWidth: 'Breite', arrowColor: 'Farbe', arrowHead: 'Spitze', columns: 'Spalten', addColumn: 'Spalte hinzufügen', setView: 'Ansicht festlegen', clearView: 'Ansicht löschen', confirmDeleteRecord: "Möchten Sie diesen Datensatz wirklich löschen?", exportPNG: "PNG exportieren", actions: "Aktionen" },
    };
    const t = (key) => translations[appState.ui.language]?.[key] || key;
    const formatNumber = (num, digits = 3) => {
        if (typeof num !== 'number') return num;
        return num.toLocaleString(appState.ui.language === 'en' ? 'en-US' : 'de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    const updateTheme = (isDark) => document.documentElement.classList.toggle('dark-mode', isDark);

    const selectMP = async (id) => {
        appState.ui.selectedMPId = id;
        highlightSelection(id);
        
        // Apply saved view if in normal mode (not editor) and MP has a view
        if (!appState.ui.isEditorOpen && appState.data.currentMap) {
            const mp = appState.data.currentMap.points.find(p => p.id === id);
            if (mp) {
                // ✅ FIXED: Load MP background (own or global) synchronously
                let bgFileName = null;
                if (mp.backgroundId) {
                    const bg = appState.data.currentMap.meta.backgrounds.find(b => b.id === mp.backgroundId);
                    if (bg) {
                        console.log(`🔄 Switching to MP ${id}'s background: ${bg.name}`);
                        bgFileName = bg.fileName;
                    }
                } else {
                    // MP uses global background
                    const globalBg = appState.data.currentMap.meta.backgrounds.find(
                        b => b.id === appState.data.currentMap.meta.globalBackground
                    );
                    if (globalBg) {
                        console.log(`🔄 Switching to global background for MP ${id}: ${globalBg.name}`);
                        bgFileName = globalBg.fileName;
                    }
                }
                
                // Wait for background to load before applying zoom
                if (bgFileName) {
                    await loadAndDisplayBackground(bgFileName, { sync: true });
                }
                
                // ✅ FIX: ALWAYS set zoom - either from mp.view OR reset to 1x
                if (mp.view && mp.view.scale) {
                    console.log(`📐 APPLYING saved view for ${id}:`, {
                        scale: mp.view.scale.toFixed(3),
                        offsetX: mp.view.offsetX.toFixed(1),
                        offsetY: mp.view.offsetY.toFixed(1),
                        containerSize: `${dom.canvasWrapper.offsetWidth}x${dom.canvasWrapper.offsetHeight}`
                    });
                    applyCanvasZoom(mp.view, false); // No animation for precise positioning
                } else {
                    console.log(`📐 No saved view for ${id}, resetting to 1x zoom`);
                    resetCanvasView(false, false); // Reset without animation, keep selection
                }
                
                // ✅ FIXED: Explicitly call renderCanvas() and fitLabelsToView() after zoom
                renderCanvas();
                requestAnimationFrame(() => {
                    fitLabelsToView();
                });
            }
        }
    };

    const highlightSelection = (id) => {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${id}"]`);
        if (label) label.classList.add('selected');

        if (appState.ui.isEditorOpen) {
            const card = dom.schemaEditorContent.querySelector(`.editor-point-card[data-mp-id="${id}"]`);
            if (card) {
                card.classList.add('selected');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            const row = dom.mpList.querySelector(`.mp-row[data-mp-id="${id}"]`);
            if (row) row.classList.add('selected');
        }
    };

    // --- CHART PLUGINS ---
    const customCanvasBackgroundColor = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            if (!dom.analysisChartBgToggle.checked) return;
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = dom.analysisChartBgColor.value || '#ffffff';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };
   
    const chartLogoPlugin = {
        id: 'chartLogo',
        afterDraw: (chart) => {
            if (!appState.ui.logoImage) return;
            const logo = appState.ui.logoImage;
            const ctx = chart.ctx;
            const padding = 10;
            const logoMaxHeight = 40;
            const scale = Math.min(logoMaxHeight / logo.height, (chart.chartArea.width * 0.2) / logo.width);
            const logoWidth = logo.width * scale;
            const logoHeight = logo.height * scale;
            const x = chart.chartArea.right - logoWidth - padding;
            const y = chart.chartArea.bottom - logoHeight - padding;
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.drawImage(logo, x, y, logoWidth, logoHeight);
            ctx.restore();
        }
    };
   
    Chart.register(customCanvasBackgroundColor);
    Chart.register(chartLogoPlugin);

    // =========================================
    // [SECTION] ZOOM & VIEW MANAGEMENT
    // =========================================
    /**
     * Apply zoom and pan transformation to canvas layers
     * 
     * COORDINATE SYSTEM GUARANTEE:
     * - All layers (background, SVG, labels) use transform-origin: 0 0 (top-left)
     * - Transform formula: translate(offsetX, offsetY) scale(scale)
     * - offsetX, offsetY are in SCREEN PIXELS (post-scale translation)
     * - scale is the zoom factor (1.0 = 100%, 2.0 = 200%, etc.)
     * - This ensures that saved views are deterministic and reversible:
     *   saving a view and reapplying it will restore the EXACT same visual composition
     * 
     * @param {Object} view - View object with {scale, offsetX, offsetY}
     * @param {boolean} animate - Whether to animate the transition
     */
    const applyCanvasZoom = (view, animate = true) => {
        if (!view || !view.scale) {
            resetCanvasView(animate);
            return;
        }

        // ✅ Defensive check: ensure container has valid dimensions
        const containerRect = dom.canvasWrapper.getBoundingClientRect();
        if (containerRect.width === 0 || containerRect.height === 0) {
            console.warn('⚠️ Cannot apply zoom: container has no dimensions');
            return;
        }

        const { scale, offsetX, offsetY } = view;
        appState.ui.canvasZoom = { scale, offsetX, offsetY };
        appState.ui.isZoomActive = scale !== 1 || offsetX !== 0 || offsetY !== 0;
        appState.ui.currentMPView = view;

        // ✅ FIXED: With transform-origin: 0 0 (top-left), use translate-then-scale
        // This ensures consistent behavior: pan in screen coords, then scale from top-left
        // Formula: translate(panX, panY) scale(s)
        const transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        
        const transitionStyle = animate ? '' : 'none';
        dom.backgroundImg.style.transition = transitionStyle;
        dom.overlaySvg.style.transition = transitionStyle;
        dom.labelsContainer.style.transition = transitionStyle;

        dom.backgroundImg.style.transform = transform;
        dom.overlaySvg.style.transform = transform;
        dom.labelsContainer.style.transform = transform;

        // ✅ FIX: Update stroke-width and handle radius in SVG elements with inverse scale
        // This is done during applyCanvasZoom because renderCanvas may not be called
        const svgGroup = dom.overlaySvg.querySelector('#svg-content-group');
        if (svgGroup) {
            const lines = svgGroup.querySelectorAll('line');
            lines.forEach(line => {
                // Base width was stored during renderCanvas
                const baseWidth = parseFloat(line.dataset.baseStrokeWidth || 2);
                line.setAttribute('stroke-width', baseWidth / scale);
            });
            
            const handles = svgGroup.querySelectorAll('circle');
            handles.forEach(handle => {
                handle.setAttribute('r', 8 / scale);
            });
        }
        
        // Scale labels inversely so they don't grow/shrink - this is now handled in fitLabelsToView
        // But we need to handle other elements like resizing-handle here
        const resizingHandles = dom.labelsContainer.querySelectorAll('.resizing-handle');
        resizingHandles.forEach(el => {
            const originalTransform = el.dataset.originalTransform || '';
            el.dataset.originalTransform = originalTransform;
            el.style.transform = `scale(${1/scale}) ${originalTransform}`;
        });

        if (!animate) {
            setTimeout(() => {
                dom.backgroundImg.style.transition = '';
                dom.overlaySvg.style.transition = '';
                dom.labelsContainer.style.transition = '';
            }, 50);
        }

        dom.btnResetView.style.display = appState.ui.isZoomActive ? 'block' : 'none';
        updateMinimap();
        
        // Reposition labels after zoom change
        fitLabelsToView();
    };

    const resetCanvasView = (animate = true, clearSelection = true) => {
        console.log(`🔄 resetCanvasView: animate=${animate}, clearSelection=${clearSelection}, isEditor=${appState.ui.isEditorOpen}`);
        
        appState.ui.canvasZoom = { scale: 1, offsetX: 0, offsetY: 0 };
        appState.ui.isZoomActive = false;
        appState.ui.currentMPView = null;
        
        if (clearSelection) {
            appState.ui.selectedMPId = null;
        }
        
        // ✅ POPRAWKA: W edytorze - NIE zmieniaj background
        if (appState.ui.isEditorOpen) {
            console.log(`🔄 Editor: zoom reset only, background unchanged`);
            // Background pozostaje bez zmian - NIE wywołuj loadAndDisplayBackground()
        } 
        // W measurement mode - zmień na global tylko jeśli clearSelection=true
        else if (clearSelection && appState.data.currentMap && appState.data.currentMap.meta) {
            const meta = appState.data.currentMap.meta;
            if (meta.globalBackground && meta.backgrounds) {
                const globalBg = meta.backgrounds.find(b => b.id === meta.globalBackground);
                if (globalBg && globalBg.fileName) {
                    console.log(`🔄 Measurement: resetting to global background: ${globalBg.name}`);
                    loadAndDisplayBackground(globalBg.fileName);
                }
            }
        }
        
        // Reset CSS transforms (bez zmian)
        const transitionStyle = animate ? '' : 'none';
        dom.backgroundImg.style.transition = transitionStyle;
        dom.overlaySvg.style.transition = transitionStyle;
        dom.labelsContainer.style.transition = transitionStyle;

        dom.backgroundImg.style.transform = 'translate(0px, 0px) scale(1)';
        dom.overlaySvg.style.transform = 'translate(0px, 0px) scale(1)';
        dom.labelsContainer.style.transform = 'translate(0px, 0px) scale(1)';

        // Inverse scaling reset
        const elementsToScale = dom.labelsContainer.querySelectorAll('.mp-label, .meta-label, .resizing-handle');
        elementsToScale.forEach(el => {
            const originalTransform = el.dataset.originalTransform || 'translate(-50%, -50%)';
            el.style.transform = originalTransform;
        });
        
        // ✅ FIX: Reset SVG elements in the group
        const svgGroup = dom.overlaySvg.querySelector('#svg-content-group');
        if (svgGroup) {
            const lines = svgGroup.querySelectorAll('line');
            lines.forEach(line => {
                // Reset to base width (scale = 1)
                const baseWidth = parseFloat(line.dataset.baseStrokeWidth || 2);
                line.setAttribute('stroke-width', baseWidth);
            });
            
            const handles = svgGroup.querySelectorAll('circle');
            handles.forEach(handle => {
                handle.setAttribute('r', '8');
            });
        }

        if (!animate) {
            setTimeout(() => {
                dom.backgroundImg.style.transition = '';
                dom.overlaySvg.style.transition = '';
                dom.labelsContainer.style.transition = '';
            }, 50);
        }

        dom.btnResetView.style.display = 'none';
        dom.minimapCanvas.style.display = 'none';
    };

    const updateMinimap = () => {
        if (!appState.ui.isZoomActive || !dom.backgroundImg.src) {
            dom.minimapCanvas.style.display = 'none';
            return;
        }

        dom.minimapCanvas.style.display = 'block';
        const canvas = dom.minimapCanvas;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 150 * dpr;
        canvas.height = 100 * dpr;
        canvas.style.width = '150px';
        canvas.style.height = '100px';
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, 150, 100);
        
        // Draw background thumbnail
        if (dom.backgroundImg.complete && dom.backgroundImg.naturalWidth > 0) {
            ctx.drawImage(dom.backgroundImg, 0, 0, 150, 100);
        }

        // Draw viewport rectangle
        const { scale, offsetX, offsetY } = appState.ui.canvasZoom;
        const mainRect = dom.canvasWrapper.getBoundingClientRect();
        
        const rectWidth = (mainRect.width / scale) * (150 / mainRect.width);
        const rectHeight = (mainRect.height / scale) * (100 / mainRect.height);
        const rectX = -offsetX * (150 / mainRect.width);
        const rectY = -offsetY * (100 / mainRect.height);

        ctx.strokeStyle = '#ff3b30';
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
    };

    // ZOOM IN EDITOR (wheel + drag)
    const onEditorZoomWheel = (e) => {
        if (!appState.ui.isEditorOpen) return;
        e.preventDefault();

        const rect = dom.canvasWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const oldScale = appState.ui.canvasZoom.scale;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        let newScale = oldScale * delta;
        newScale = Math.max(0.5, Math.min(5, newScale));
        
        // ✅ FIXED: With top-left origin, zoom around cursor position (x, y)
        // The point (x, y) in screen coords should stay visually fixed during zoom
        // Current point in viewBox: (x - offsetX) / scale
        // After zoom: this same viewBox point should appear at screen position (x, y)
        // New offset: x - viewBoxPoint * newScale = x - (x - offsetX) * newScale / oldScale
        const newOffsetX = x - (x - appState.ui.canvasZoom.offsetX) * newScale / oldScale;
        const newOffsetY = y - (y - appState.ui.canvasZoom.offsetY) * newScale / oldScale;

        appState.ui.canvasZoom.scale = newScale;
        appState.ui.canvasZoom.offsetX = newOffsetX;
        appState.ui.canvasZoom.offsetY = newOffsetY;

        applyCanvasZoom(appState.ui.canvasZoom, false);
    };
    
    // =========================================
    // [SECTION] FILE SYSTEM WRAPPERS
    // =========================================
    const getOrCreateDir = async (parent, name) => parent.getDirectoryHandle(name, { create: true });
    const getOrCreateFile = async (dir, name) => dir.getFileHandle(name, { create: true });
    const readFile = async (handle) => (await handle.getFile()).text();
    const writeFile = async (handle, content) => { const w = await handle.createWritable(); await w.write(content); await w.close(); };

    const checkFSAPISupport = () => {
        if (!('showDirectoryPicker' in window)) {
            alert('Browser not supported (needs File System Access API). Please use Chrome, Edge, or Opera on desktop.');
            return false;
        }
        return true;
    };

    // =========================================
    // [SECTION] INDEXEDDB HELPERS
    // =========================================
    
    /**
     * Open or create the IndexedDB database for storing directory handles
     * @returns {Promise<IDBDatabase>} The opened database
     */
    const openHandlesDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MeasurementHandlesDB', 1);
            
            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('✅ IndexedDB opened successfully');
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔧 Upgrading IndexedDB schema...');
                const db = event.target.result;
                
                // Create object store for directory handles if it doesn't exist
                if (!db.objectStoreNames.contains('directoryHandles')) {
                    db.createObjectStore('directoryHandles', { keyPath: 'id' });
                    console.log('✅ Created directoryHandles object store');
                }
            };
        });
    };

    /**
     * Save a directory handle to IndexedDB
     * @param {FileSystemDirectoryHandle} handle - The directory handle to save
     * @returns {Promise<void>}
     */
    const saveHandleToIndexedDB = async (handle) => {
        try {
            const db = await openHandlesDB();
            const transaction = db.transaction(['directoryHandles'], 'readwrite');
            const store = transaction.objectStore('directoryHandles');
            
            // Store the handle with a fixed key 'lastProject'
            const data = {
                id: 'lastProject',
                handle: handle,
                name: handle.name,
                savedAt: Date.now()
            };
            
            store.put(data);
            
            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    console.log('✅ Directory handle saved to IndexedDB:', handle.name);
                    db.close();
                    resolve();
                };
                
                transaction.onerror = () => {
                    console.error('❌ Failed to save handle to IndexedDB:', transaction.error);
                    db.close();
                    reject(transaction.error);
                };
            });
        } catch (error) {
            console.error('❌ Error in saveHandleToIndexedDB:', error);
            throw error;
        }
    };

    /**
     * Retrieve the saved directory handle from IndexedDB
     * @returns {Promise<FileSystemDirectoryHandle|null>} The saved handle or null if not found
     */
    const getHandleFromIndexedDB = async () => {
        try {
            const db = await openHandlesDB();
            const transaction = db.transaction(['directoryHandles'], 'readonly');
            const store = transaction.objectStore('directoryHandles');
            
            return new Promise((resolve, reject) => {
                const request = store.get('lastProject');
                
                request.onsuccess = async () => {
                    db.close();
                    
                    if (!request.result || !request.result.handle) {
                        console.log('ℹ️ No saved directory handle found');
                        resolve(null);
                        return;
                    }
                    
                    const savedHandle = request.result.handle;
                    
                    // Verify we still have permission to access this handle
                    try {
                        const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
                        
                        if (permission === 'granted') {
                            console.log('✅ Retrieved directory handle from IndexedDB:', savedHandle.name);
                            resolve(savedHandle);
                        } else {
                            console.log('⚠️ No permission for saved handle, requesting permission...');
                            const newPermission = await savedHandle.requestPermission({ mode: 'readwrite' });
                            
                            if (newPermission === 'granted') {
                                console.log('✅ Permission granted for saved handle');
                                resolve(savedHandle);
                            } else {
                                console.log('❌ Permission denied for saved handle');
                                resolve(null);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error verifying handle permission:', error);
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    console.error('❌ Failed to retrieve handle from IndexedDB:', request.error);
                    db.close();
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ Error in getHandleFromIndexedDB:', error);
            return null;
        }
    };

    // =========================================
    // [SECTION] CORE FUNCTIONS
    // =========================================
    const scanProjectFolder = async () => {
        if (!appState.projectRootHandle) return;
        try {
            const mapsDir = await getOrCreateDir(appState.projectRootHandle, 'maps');
            const backgroundsDir = await getOrCreateDir(appState.projectRootHandle, 'backgrounds');
            const exportsDir = await getOrCreateDir(appState.projectRootHandle, 'exports');
            await getOrCreateDir(exportsDir, 'visualizations');
            await getOrCreateDir(appState.projectRootHandle, 'libs');
            appState.fileHandles.db = await getOrCreateFile(appState.projectRootHandle, 'busbarDB.csv');

            for (const handle of [mapsDir, backgroundsDir]) {
                const type = handle.name;
                appState.fileHandles[type] = {};
                for await (const entry of handle.values()) {
                    if (entry.kind === 'file') {
                        appState.fileHandles[type][entry.name] = entry;
                    }
                }
            }
            const dbContent = await readFile(appState.fileHandles.db);
            parseCSV(dbContent);
        } catch(e) { console.error("Error scanning project folder:", e); parseCSV(""); }
        updateDropdowns();
        renderMPList();
        try { await loadLogo(); } catch(e) { console.log("Logo not found or error loading", e); }
    };

    const loadLogo = async () => {
        try {
            const libsDir = await appState.projectRootHandle.getDirectoryHandle('libs');
            const logoHandle = await libsDir.getFileHandle('logo.png');
            const file = await logoHandle.getFile();
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                appState.ui.logoImage = img;
                dom.headerLogo.src = url;
                dom.headerLogo.style.display = 'block';
                // Revoke the blob URL after the image has loaded to prevent memory leaks
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                appState.ui.logoImage = null;
                dom.headerLogo.style.display = 'none';
                // Revoke the blob URL even on error to prevent memory leaks
                URL.revokeObjectURL(url);
            };
            img.src = url;
        } catch (err) {
            appState.ui.logoImage = null;
            dom.headerLogo.style.display = 'none';
        }
    };

    const handleMapSelect = async (e) => {
        const key = e.target.value;
        dom.backgroundImg.src = '';
        appState.data.currentMap = null;
        resetCanvasView(false);
        
        if (key) {
            const mapHandle = appState.fileHandles.maps[`${key}.map.json`];
            if (mapHandle) {
                try {
                    const mapData = JSON.parse(await readFile(mapHandle));
                    mapData.fileName = key;
                    // Ensure data integrity
                    mapData.points.forEach(mp => {
                        if (!mp.arrows) {
                             mp.arrows = [{ x1: mp.x1, y1: mp.y1, x2: mp.x2, y2: mp.y2, style: mp.style }];
                        }
                        if (!mp.type) {
                            mp.type = 'single';
                        }
                        if (!mp.view) {
                            mp.view = null;
                        }
                    });
                    appState.data.currentMap = mapData;
                    
                    // Load background based on new structure or legacy backgroundFile
                    if (mapData.meta) {
                        let bgToLoad = null;
                        
                        // NEW: Use globalBackground (current system)
                        if (mapData.meta.globalBackground && mapData.meta.backgrounds) {
                            const bg = mapData.meta.backgrounds.find(b => b.id === mapData.meta.globalBackground);
                            if (bg) {
                                bgToLoad = bg.fileName;
                                console.log(`🖼️ Loading global background: ${bg.name}`);
                            }
                        }
                        // FALLBACK: Use defaultBackground (migration compatibility)
                        else if (mapData.meta.defaultBackground && mapData.meta.backgrounds) {
                            const bg = mapData.meta.backgrounds.find(b => b.id === mapData.meta.defaultBackground);
                            if (bg) {
                                bgToLoad = bg.fileName;
                                console.log(`🖼️ Loading default background (legacy): ${bg.name}`);
                            }
                        }
                        // Legacy structure: use backgroundFile
                        else if (mapData.meta.backgroundFile) {
                            bgToLoad = mapData.meta.backgroundFile;
                            console.log(`🖼️ Loading legacy background file: ${bgToLoad}`);
                        }
                        
                        if (bgToLoad) {
                            await loadAndDisplayBackground(bgToLoad);
                        }
                    }
                } catch (err) { console.error(`Error loading map ${key}.map.json`, err); }
            }
        }
        renderMPList();
        renderCanvas();
    };

    /**
     * Load and display a background image
     * @param {string} bgFilename - Background filename
     * @param {Object} options - Options
     * @param {boolean} options.sync - Wait for image to load before returning
     */
    const loadAndDisplayBackground = async (bgFilename, { sync = false } = {}) => {
        console.log(`🔍 Attempting to load background${sync ? ' (sync)' : ''}: ${bgFilename}`);
        dom.backgroundImg.src = '';
        
        if (!bgFilename) {
            console.warn('⚠️ No background filename provided');
            return;
        }
        
        const bgHandle = appState.fileHandles.backgrounds[bgFilename];
        if (!bgHandle) {
            console.error(`❌ Background file handle not found for: ${bgFilename}`);
            console.log('Available backgrounds:', Object.keys(appState.fileHandles.backgrounds));
            return;
        }
        
        try {
            // Revoke the previous background URL to prevent memory leaks
            if (appState.ui.currentBackgroundUrl) {
                URL.revokeObjectURL(appState.ui.currentBackgroundUrl);
                appState.ui.currentBackgroundUrl = null;
            }
            
            const file = await bgHandle.getFile();
            const url = URL.createObjectURL(file);
            appState.ui.currentBackgroundUrl = url;
            dom.backgroundImg.src = url;
            dom.backgroundImg.style.display = 'block';
            
            if (sync) {
                // Wait for image to load before returning
                await new Promise((resolve, reject) => {
                    dom.backgroundImg.onload = () => {
                        console.log(`✅ Background loaded: ${bgFilename}`);
                        resolve();
                    };
                    dom.backgroundImg.onerror = () => {
                        reject(new Error(`Failed to load background: ${bgFilename}`));
                    };
                });
            } else {
                // Async loading with callback
                dom.backgroundImg.onload = () => {
                    console.log(`✅ Background loaded: ${bgFilename}`);
                    renderCanvas();
                };
            }
        } catch (err) { 
            console.error(`❌ Error loading background ${bgFilename}:`, err);
            if (sync) throw err;
        }
    };

    // =========================================
    // [SECTION] UI UPDATES
    // =========================================
    const updateUIStrings = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const span = el.querySelector('span');
            const target = span || el;
            if (translations[appState.ui.language]?.[el.dataset.i18n]) {
                target.textContent = t(el.dataset.i18n);
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
             if (translations[appState.ui.language]?.[el.dataset.i18nPlaceholder]) {
                el.placeholder = t(el.dataset.i18nPlaceholder);
            }
        });
        renderMPList();
        if (appState.ui.isEditorOpen) renderSchemaInspector();
    };

    const updateDropdowns = () => {
        const currentVal = dom.mapSelect.value;
        dom.mapSelect.innerHTML = `<option value="">${t('map')}</option>`;
        Object.keys(appState.fileHandles.maps).sort().forEach(key => {
            const option = document.createElement('option');
            const keyName = key.replace('.map.json', '');
            option.value = keyName;
            option.textContent = keyName;
            dom.mapSelect.appendChild(option);
        });
        if ([...dom.mapSelect.options].some(o => o.value === currentVal)) {
            dom.mapSelect.value = currentVal;
        }
    };
// =========================================
    // [SECTION] LIST RENDERING (MEASUREMENT)
    // =========================================
    const renderMPList = () => {
        const points = appState.data.currentMap?.points;
        if (!points || points.length === 0) {
            dom.mpList.innerHTML = `<div class="placeholder-message">${t('selectMapPrompt')}</div>`;
            return;
        }
        dom.mpList.innerHTML = '';
        points.forEach(mp => {
            let row;
            if (mp.type === 'table' && mp.columns && mp.columns.length > 0) {
                 row = dom.mpRowTemplateTable.content.cloneNode(true).firstElementChild;
                 row.dataset.mpId = mp.id;
                 row.querySelector('.mp-name').textContent = `${mp.id}: ${mp.name}`;
                 const inputsContainer = row.querySelector('.mp-table-inputs');
                 
                 mp.columns.forEach((col, index) => {
                    const group = document.createElement('div');
                    group.className = 'mp-sub-input-group';
                    group.innerHTML = `
                        <label class="mp-sub-label" title="${col.name} [${col.min}...${col.max}]">${col.name}</label>
                        <input type="text" class="input-field mp-sub-input" data-col-index="${index}">
                    `;
                    const input = group.querySelector('input');
                    input.addEventListener('input', () => {
                        handleValueChange(input);
                        
                        // Real-time validation for table columns
                        const val = input.value.replace(',', '.');
                        const num = parseFloat(val);
                        
                        if (val !== '' && !isNaN(num)) {
                            if (num >= col.min && num <= col.max) {
                                input.classList.remove('status-error');
                                input.classList.add('status-ok');
                            } else {
                                input.classList.remove('status-ok');
                                input.classList.add('status-error');
                            }
                            // ✅ FIXED: Update only label text, not positions
                            updateSingleLabel(mp.id);
                        } else {
                            input.classList.remove('status-ok', 'status-error');
                        }
                    });
                    input.addEventListener('focus', () => {
                        selectMP(mp.id);
                        const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
                        if (label) label.classList.add('is-blinking');
                        // View is now applied in selectMP function
                    });
                    input.addEventListener('blur', () => {
                        const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
                        if (label) label.classList.remove('is-blinking');
                        
                        // ✅ SMART RESET
                        setTimeout(() => {
                            const focusedElement = document.activeElement;
                            
                            // Check if focus moved to another MP input
                            const isFocusOnMP = focusedElement && (
                                focusedElement.classList.contains('mp-sub-input') ||
                                focusedElement.closest('.mp-row') ||
                                focusedElement.closest('.mp-table-inputs')
                            );
                            
                            if (!isFocusOnMP) {
                                // User left measurement area - return to global background + zoom 1x
                                console.log('👋 User left measurement area, resetting view');
                                resetCanvasView();
                            }
                            // If focus on another MP, do nothing - selectMP() will handle it
                        }, 50);
                    });
                   
                    if (index === 0) {
                        input.addEventListener('paste', (e) => handleTablePaste(e, inputsContainer));
                    }
                    inputsContainer.appendChild(group);
                 });

            } else {
                row = dom.mpRowTemplateSingle.content.cloneNode(true).firstElementChild;
                row.dataset.mpId = mp.id;
                row.querySelector('.mp-name').textContent = `${mp.id}: ${mp.name}`;
                row.querySelector('.mp-spec').textContent = `[${mp.nominal.toString().replace('.',',')}${mp.unit} | ${mp.min.toString().replace('.',',')}...${mp.max.toString().replace('.',',')}]`;
                const input = row.querySelector('.mp-value input');
                input.addEventListener('input', () => {
                    handleValueChange(input);
                    
                    // Real-time validation
                    const val = input.value.replace(',', '.');
                    const num = parseFloat(val);
                    const statusSpan = row.querySelector('.mp-status-text');
                    
                    if (val !== '' && !isNaN(num)) {
                        if (num >= mp.min && num <= mp.max) {
                            statusSpan.textContent = '✅ OK';
                            statusSpan.style.color = 'var(--status-ok)';
                            input.classList.remove('status-error');
                            input.classList.add('status-ok');
                        } else {
                            statusSpan.textContent = '⚠️ NOK';
                            statusSpan.style.color = 'var(--status-error)';
                            input.classList.remove('status-ok');
                            input.classList.add('status-error');
                        }
                        // ✅ FIXED: Update only label text, not positions
                        updateSingleLabel(mp.id);
                    } else {
                        statusSpan.textContent = '';
                        input.classList.remove('status-ok', 'status-error');
                    }
                });
                input.addEventListener('focus', () => {
                    selectMP(mp.id);
                    const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
                    if (label) label.classList.add('is-blinking');
                    // View is now applied in selectMP function
                });
                input.addEventListener('blur', () => {
                    const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
                    if (label) label.classList.remove('is-blinking');
                    
                    // ✅ SMART RESET
                    setTimeout(() => {
                        const focusedElement = document.activeElement;
                        
                        // Check if focus moved to another MP input
                        const isFocusOnMP = focusedElement && (
                            focusedElement.classList.contains('mp-sub-input') ||
                            focusedElement.closest('.mp-row') ||
                            focusedElement.closest('.mp-table-inputs')
                        );
                        
                        if (!isFocusOnMP) {
                            // User left measurement area - return to global background + zoom 1x
                            console.log('👋 User left measurement area, resetting view');
                            resetCanvasView();
                        }
                        // If focus on another MP, do nothing - selectMP() will handle it
                    }, 50);
                });
            }
            dom.mpList.appendChild(row);
        });

        const commentDiv = document.createElement('div');
        commentDiv.className = 'input-group';
        commentDiv.style.marginTop = '16px';
        commentDiv.innerHTML = `
            <label for="measurement-comment" data-i18n="comment">${t('comment')}</label>
            <textarea id="measurement-comment" class="input-field" rows="3"></textarea>
        `;
        dom.mpList.appendChild(commentDiv);
       
        setupNavigation();
    };

    const handleValueChange = (input) => {
        if (input) input.value = input.value.replace('.', ',');
        // ✅ FIXED: Don't re-render during typing to prevent arrow/label position shifts
        // Labels/arrows should only update on blur or save
        // renderCanvas(); // REMOVED
    };

    const handleTablePaste = (e, container) => {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text');
        if (!pastedData) return;
       
        const values = pastedData.trim().split(/[\t;]|\s{2,}/);
        const inputs = container.querySelectorAll('input.mp-sub-input');
       
        values.forEach((val, i) => {
            if (inputs[i]) {
                inputs[i].value = val.trim().replace('.', ',');
                inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    };

    const setupNavigation = () => {
        const allInputs = Array.from(dom.mpList.querySelectorAll('input, textarea'));
        allInputs.forEach((input, index) => {
             input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const nextInput = allInputs[index + 1];
                    if (nextInput) nextInput.focus(); else dom.btnSave.focus();
                }
            });
        });
    };

    // =========================================
    // [SECTION] CANVAS RENDERING
    // =========================================
    
    // Helper function to escape HTML to prevent XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    const syncOverlayDimensions = () => {
        if (!dom.backgroundImg.src || !dom.backgroundImg.complete || dom.backgroundImg.naturalWidth === 0) return;
        const imgRect = dom.backgroundImg.getBoundingClientRect();
        const wrapperRect = dom.canvasWrapper.getBoundingClientRect();
        const commonStyle = `position: absolute; top: ${imgRect.top - wrapperRect.top}px; left: ${imgRect.left - wrapperRect.left}px; width: ${imgRect.width}px; height: ${imgRect.height}px;`;
        
        // ✅ FIXED: Preserve transform and transition before using cssText
        // cssText overwrites ALL styles, including transform applied by applyCanvasZoom()
        const svgTransform = dom.overlaySvg.style.transform;
        const labelsTransform = dom.labelsContainer.style.transform;
        const svgTransition = dom.overlaySvg.style.transition;
        const labelsTransition = dom.labelsContainer.style.transition;
        
        // SVG and labels container have pointer-events set in CSS
        // SVG has pointer-events: none, but circles/lines inside have pointer-events: auto
        // Labels container has pointer-events: none, but labels themselves have pointer-events: auto
        dom.overlaySvg.style.cssText = commonStyle;
        dom.labelsContainer.style.cssText = commonStyle;
        
        // ✅ FIXED: Restore transform and transition after cssText
        dom.overlaySvg.style.transform = svgTransform;
        dom.labelsContainer.style.transform = labelsTransform;
        dom.overlaySvg.style.transition = svgTransition;
        dom.labelsContainer.style.transition = labelsTransition;
        
        console.log(`🔧 syncOverlayDimensions: preserved transform="${svgTransform}"`);
        
        fitLabelsToView();
    };

    const renderCanvas = (recordData = null) => {
        dom.overlaySvg.innerHTML = '';
        dom.labelsContainer.innerHTML = '';
        const isEditor = appState.ui.isEditorOpen;
        const currentData = isEditor ? appState.ui.editorState : appState.data.currentMap;
        if (!currentData) return;

        const points = currentData.points || [];
        const meta = currentData.meta || {};

        // ✅ CORRECTED: Determine which background we're viewing
        let viewingBgId = meta.globalBackground || null;
        
        // IN EDITOR: If selected MP has its own background, show that background
        if (isEditor && appState.ui.selectedMPId) {
            const selectedMP = points.find(p => p.id === appState.ui.selectedMPId);
            if (selectedMP && selectedMP.backgroundId) {
                viewingBgId = selectedMP.backgroundId;
                console.log(`🎨 EDITOR: Viewing MP ${selectedMP.id}'s background: ${viewingBgId}`);
            } else if (selectedMP) {
                console.log(`🎨 EDITOR: Viewing global background for MP ${selectedMP.id}`);
            }
        }
        
        // IN MEASUREMENT MODE: Similar logic
        if (!isEditor && appState.ui.selectedMPId) {
            const selectedMP = points.find(p => p.id === appState.ui.selectedMPId);
            if (selectedMP) {
                viewingBgId = selectedMP.backgroundId || meta.globalBackground;
                console.log(`📐 MEASUREMENT: Viewing background: ${viewingBgId}`);
            }
        }
        
        // ✅ CRITICAL FIX: CORRECTED FILTERING LOGIC!
        const filteredPoints = points.filter(mp => {
            // If viewing GLOBAL background
            if (viewingBgId === meta.globalBackground || viewingBgId === null) {
                // Show ONLY MPs that DON'T have their own background
                const shouldShow = !mp.backgroundId || mp.backgroundId === null;
                console.log(`  - MP ${mp.id}: backgroundId=${mp.backgroundId}, shouldShow=${shouldShow} (GLOBAL VIEW)`);
                return shouldShow;
            }
            
            // If viewing SPECIFIC background
            // Show ONLY MPs that HAVE this EXACT background
            const shouldShow = mp.backgroundId === viewingBgId;
            console.log(`  - MP ${mp.id}: backgroundId=${mp.backgroundId}, viewing=${viewingBgId}, shouldShow=${shouldShow} (SPECIFIC VIEW)`);
            return shouldShow;
        });
        
        console.log(`📊 Filtered ${filteredPoints.length}/${points.length} MPs for background ${viewingBgId || 'global'}`);
        console.log(`   Showing MPs: ${filteredPoints.map(p => p.id).join(', ')}`);

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.id = `arrowhead`;
        marker.setAttribute('viewBox', '0 -5 10 10');
        marker.setAttribute('refX', '8');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,-5L10,0L0,5');
        path.setAttribute('fill', 'context-stroke');
        marker.appendChild(path);
        defs.appendChild(marker);
        dom.overlaySvg.appendChild(defs);

        // ✅ FIX: Create a group inside SVG to apply transformations
        // This keeps SVG elements synchronized with the viewBox coordinate system
        const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        svgGroup.id = 'svg-content-group';
        dom.overlaySvg.appendChild(svgGroup);

        // Get current zoom scale to apply inverse scaling to visual properties
        const currentScale = appState.ui.canvasZoom.scale;

        filteredPoints.forEach(mp => {
            const arrowsToRender = mp.arrows || [{ x1: mp.x1, y1: mp.y1, x2: mp.x2, y2: mp.y2, style: mp.style }];

            arrowsToRender.forEach((arrow, index) => {
                if (!arrow.x1) return;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                if (isEditor) {
                    // Add data attributes for editor mode so we can update arrows during drag
                    Object.assign(line.dataset, { mpId: mp.id, arrowIndex: index });
                }
                line.setAttribute('x1', arrow.x1);
                line.setAttribute('y1', arrow.y1);
                line.setAttribute('x2', arrow.x2);
                line.setAttribute('y2', arrow.y2);
                line.setAttribute('stroke', arrow.style?.color || mp.style?.color || '#007aff');
                // ✅ FIX: Scale stroke-width inversely to maintain constant visual size
                const baseStrokeWidth = arrow.style?.width || mp.style?.width || 2;
                line.setAttribute('stroke-width', baseStrokeWidth / currentScale);
                // Store base width for use in applyCanvasZoom
                line.dataset.baseStrokeWidth = baseStrokeWidth;
                const head = arrow.style?.head || mp.style?.head;
                if (head === 'arrow') line.setAttribute('marker-end', `url(#arrowhead)`);
                else if (head === 'double') {
                    line.setAttribute('marker-start', `url(#arrowhead)`);
                    line.setAttribute('marker-end', `url(#arrowhead)`);
                }
                svgGroup.appendChild(line); // ✅ Append to group instead of SVG root

                if (isEditor) {
                    ['start', 'end'].forEach(type => {
                        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        Object.assign(handle.dataset, { mpId: mp.id, handleType: type, arrowIndex: index });
                        handle.setAttribute('cx', type === 'start' ? arrow.x1 : arrow.x2);
                        handle.setAttribute('cy', type === 'start' ? arrow.y1 : arrow.y2);
                        // ✅ FIX: Scale handle radius inversely to maintain constant visual size
                        handle.setAttribute('r', 8 / currentScale);
                        handle.setAttribute('fill', 'rgba(0, 122, 255, 0.5)');
                        handle.style.cursor = 'move';
                        handle.style.pointerEvents = 'all';
                        svgGroup.appendChild(handle); // ✅ Append to group instead of SVG root
                    });
                }
            });

            const label = document.createElement('div');
            label.className = `mp-label`;
            label.dataset.mpId = mp.id;
            label.dataset.originalTransform = 'translate(-50%, -50%)';
            let statusClass = '', labelHtml = '', tooltipText = '';

            if (mp.type === 'table') {
                let allOk = true, anyFilled = false;
                (mp.columns || []).forEach((col, i) => {
                    const val = recordData ? recordData[`${mp.id}_${col.name}_Value`] : document.querySelector(`.mp-row[data-mp-id="${mp.id}"] input[data-col-index="${i}"]`)?.value;
                    if (val && val.trim() !== '') {
                        anyFilled = true;
                        const num = parseFloat(val.replace(',', '.'));
                        const isOk = !isNaN(num) && num >= col.min && num <= col.max;
                        if (!isOk) allOk = false;
                        tooltipText += `${col.name}: ${val}${col.unit} [${isOk ? 'OK' : 'NOK'}]\n`;
                    } else {
                        tooltipText += `${col.name}: --\n`;
                    }
                });
                if (anyFilled) statusClass = allOk ? 'status-ok' : 'status-error';
                labelHtml = `<div>${mp.id} ${anyFilled ? (allOk ? '<span class="label-status status-ok-text">✅ OK</span>' : '<span class="label-status status-error-text">⚠️ NOK</span>') : ''}</div><div class="point-name">${mp.name}</div>`;
                if (tooltipText) label.dataset.tooltip = tooltipText.trim();

            } else {
                const value = recordData ? (recordData[`${mp.id}_Value`] || '') : (document.querySelector(`.mp-row[data-mp-id="${mp.id}"] input`)?.value || '');
                let statusText = '';
                if (value !== '') {
                    const numValue = parseFloat(value.replace(',', '.'));
                    if (!isNaN(numValue) && numValue >= mp.min && numValue <= mp.max) {
                        statusClass = 'status-ok';
                        statusText = `<span class="label-status status-ok-text">✅ OK</span>`;
                    } else {
                        statusClass = 'status-error';
                        statusText = `<span class="label-status status-error-text">⚠️ NOK</span>`;
                    }
                }
                labelHtml = `<div>${mp.id}: ${value}${mp.unit} ${statusText}</div><div class="point-name">${mp.name}</div><div class="tolerance">[${mp.min}..${mp.max}]</div>`;
            }

            if (statusClass) label.classList.add(statusClass);
            label.innerHTML = labelHtml;
            dom.labelsContainer.appendChild(label);
        });

        if (meta.showQR) {
            const qr = document.createElement('div');
            qr.className = 'meta-label';
            qr.dataset.dragType = 'qrLabel';
            qr.textContent = `QR: ${(recordData ? recordData.QRCode : dom.qrCodeInput.value) || '...'}`;
            dom.labelsContainer.appendChild(qr);
        }
        if (meta.showDate) {
            const dt = document.createElement('div');
            dt.className = 'meta-label';
            dt.dataset.dragType = 'dateLabel';
            dt.textContent = (recordData ? new Date(recordData.Timestamp) : new Date()).toLocaleDateString();
            dom.labelsContainer.appendChild(dt);
        }
        syncOverlayDimensions();
        if (appState.ui.selectedMPId) highlightSelection(appState.ui.selectedMPId);
        
        // Reapply current zoom if active
        if (appState.ui.isZoomActive) {
            applyCanvasZoom(appState.ui.canvasZoom, false);
        }
        
        // ✅ FIXED: Always call fitLabelsToView after render to ensure correct positioning
        requestAnimationFrame(() => {
            fitLabelsToView();
        });
    };

    const fitLabelsToView = () => {
        // Use offsetWidth/offsetHeight instead of getBoundingClientRect()
        // These return the BASE size before CSS transform, which is what we need
        // because viewBox coordinates (1000x700) are relative to the base container size
        const baseWidth = dom.labelsContainer.offsetWidth;
        const baseHeight = dom.labelsContainer.offsetHeight;
        if (baseWidth === 0 || baseHeight === 0) return;
        
        const isEditor = appState.ui.isEditorOpen;
        const currentData = isEditor ? appState.ui.editorState : appState.data.currentMap;
        if (!currentData) return;
       
        // Calculate scale based on BASE size (before CSS transform)
        // The CSS transform on the container will handle the zoom/pan
        const scaleX = baseWidth / VIEWBOX_WIDTH;
        const scaleY = baseHeight / VIEWBOX_HEIGHT;

        // ✅ FIX: Account for canvasZoom transformation
        // When zoom is applied, we need to account for both scale and offset
        const zoom = appState.ui.canvasZoom;
        
        const positionElement = (element, pos) => {
            if (!element || !pos) return;
            // ✅ FIX: Apply zoom scale and offset to position calculation
            // Convert viewBox coordinates to screen coordinates accounting for zoom
            const screenX = pos.x * scaleX;
            const screenY = pos.y * scaleY;
            element.style.left = `${screenX}px`;
            element.style.top = `${screenY}px`;
            
            // ✅ FIX: Apply inverse scale to the label element itself to keep text size constant
            const originalTransform = element.dataset.originalTransform || 'translate(-50%, -50%)';
            element.dataset.originalTransform = originalTransform;
            element.style.transform = `scale(${1/zoom.scale}) ${originalTransform}`;
        };

        currentData.points?.forEach(mp => {
            const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
            const posX = mp.labelX || (mp.arrows?.[0]?.x2 || mp.x2);
            const posY = mp.labelY || (mp.arrows?.[0]?.y2 || mp.y2);
            positionElement(label, {x: posX, y: posY});
        });

        if (currentData.meta?.showQR) positionElement(dom.labelsContainer.querySelector('[data-drag-type="qrLabel"]'), currentData.meta.qrLabelPos || { x: 100, y: 50 });
        if (currentData.meta?.showDate) positionElement(dom.labelsContainer.querySelector('[data-drag-type="dateLabel"]'), currentData.meta.dateLabelPos || { x: 100, y: 80 });
    };

    /**
     * Update only the text content and status of a single label without recalculating positions
     * This prevents arrow/label position shifts during typing
     */
    const updateSingleLabel = (mpId) => {
        const label = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mpId}"]`);
        if (!label) return;

        const isEditor = appState.ui.isEditorOpen;
        const currentData = isEditor ? appState.ui.editorState : appState.data.currentMap;
        if (!currentData) return;

        const mp = currentData.points?.find(p => p.id === mpId);
        if (!mp) return;

        let statusClass = '', labelHtml = '', tooltipText = '';

        if (mp.type === 'table') {
            let allOk = true, anyFilled = false;
            (mp.columns || []).forEach((col, i) => {
                const val = document.querySelector(`.mp-row[data-mp-id="${mpId}"] input[data-col-index="${i}"]`)?.value;
                if (val && val.trim() !== '') {
                    anyFilled = true;
                    const num = parseFloat(val.replace(',', '.'));
                    const isOk = !isNaN(num) && num >= col.min && num <= col.max;
                    if (!isOk) allOk = false;
                    tooltipText += `${col.name}: ${val}${col.unit} [${isOk ? 'OK' : 'NOK'}]\n`;
                } else {
                    tooltipText += `${col.name}: --\n`;
                }
            });
            if (anyFilled) statusClass = allOk ? 'status-ok' : 'status-error';
            labelHtml = `<div>${escapeHtml(mp.id)} ${anyFilled ? (allOk ? '<span class="label-status status-ok-text">✅ OK</span>' : '<span class="label-status status-error-text">⚠️ NOK</span>') : ''}</div><div class="point-name">${escapeHtml(mp.name)}</div>`;
            if (tooltipText) label.dataset.tooltip = tooltipText.trim();
            else delete label.dataset.tooltip;
        } else {
            const value = document.querySelector(`.mp-row[data-mp-id="${mpId}"] input`)?.value || '';
            let statusText = '';
            if (value !== '') {
                const numValue = parseFloat(value.replace(',', '.'));
                if (!isNaN(numValue) && numValue >= mp.min && numValue <= mp.max) {
                    statusClass = 'status-ok';
                    statusText = `<span class="label-status status-ok-text">✅ OK</span>`;
                } else {
                    statusClass = 'status-error';
                    statusText = `<span class="label-status status-error-text">⚠️ NOK</span>`;
                }
            }
            labelHtml = `<div>${escapeHtml(mp.id)}: ${escapeHtml(value)}${escapeHtml(mp.unit)} ${statusText}</div><div class="point-name">${escapeHtml(mp.name)}</div><div class="tolerance">[${escapeHtml(mp.min.toString())}..${escapeHtml(mp.max.toString())}]</div>`;
        }

        // Update classes
        label.classList.remove('status-ok', 'status-error');
        if (statusClass) label.classList.add(statusClass);
        
        // Update content
        label.innerHTML = labelHtml;
    };

    // =========================================
    // [SECTION] EDITOR LOGIC
    // =========================================
    const toggleEditor = (open, isNew = false) => {
        appState.ui.isEditorOpen = open;
        document.body.classList.toggle('editor-open', open);
        if (open) {
            if (isNew) {
                appState.ui.editorState = { name: '', version: '', meta: { backgrounds: [], globalBackground: null, showQR: false, showDate: false, qrLabelPos: {x:100, y:50}, dateLabelPos: {x:100, y:80} }, points: [] };
                dom.mapSelect.value = '';
            } else {
                const mapKey = dom.mapSelect.value;
                const mapData = appState.data.currentMap;
                if (!mapKey || !mapData) { alert('Please select a schema to edit.'); toggleEditor(false); return; }
                appState.ui.editorState = JSON.parse(JSON.stringify(mapData));
                const [name, version] = mapKey.split('_v');
                appState.ui.editorState.name = name;
                appState.ui.editorState.version = version || '1';
                appState.ui.editorState.originalFileName = mapKey;
            }
            // Initialize meta structure if missing
            if (!appState.ui.editorState.meta) {
                appState.ui.editorState.meta = {};
            }
            if (!appState.ui.editorState.meta.backgrounds) {
                appState.ui.editorState.meta.backgrounds = [];
            }
            
            // Migrate old data structures to new globalBackground system
            if (appState.ui.editorState.meta.backgroundFile && appState.ui.editorState.meta.backgrounds.length === 0) {
                // Migrate very old single backgroundFile
                const bgId = `bg_migrated_${Date.now()}`;
                appState.ui.editorState.meta.backgrounds.push({
                    id: bgId,
                    name: 'Background',
                    fileName: appState.ui.editorState.meta.backgroundFile
                });
                appState.ui.editorState.meta.globalBackground = bgId;
                console.log('🔄 Migrated old backgroundFile to globalBackground');
            } else if (appState.ui.editorState.meta.defaultBackground && !appState.ui.editorState.meta.globalBackground) {
                // Migrate defaultBackground to globalBackground
                appState.ui.editorState.meta.globalBackground = appState.ui.editorState.meta.defaultBackground;
                console.log('🔄 Migrated defaultBackground to globalBackground');
            } else if (appState.ui.editorState.meta.backgroundId && !appState.ui.editorState.meta.globalBackground) {
                // Migrate backgroundId (Active) to globalBackground
                appState.ui.editorState.meta.globalBackground = appState.ui.editorState.meta.backgroundId;
                console.log('🔄 Migrated backgroundId to globalBackground');
            }
            
            appState.ui.editorIsDirty = false;
            renderSchemaInspector();
            
            // Load global background if set
            const bgToLoad = appState.ui.editorState.meta.globalBackground;
            if (bgToLoad) {
                const bg = appState.ui.editorState.meta.backgrounds.find(b => b.id === bgToLoad);
                if (bg) {
                    loadAndDisplayBackground(bg.fileName);
                    console.log(`🖼️ Loaded global background: ${bg.name}`);
                } else {
                    console.warn(`⚠️ Global background ${bgToLoad} not found in backgrounds array`);
                }
            } else {
                console.log('ℹ️ No global background set');
            }
            
            resetCanvasView(false);
        } else {
            appState.ui.editorState = null;
            appState.ui.selectedMPId = null;
            resetCanvasView(false);
            handleMapSelect({target: {value: dom.mapSelect.value}});
        }
        dom.schemaEditor.classList.toggle('open', open);
        syncOverlayDimensions();
    };

    const renderSchemaInspector = () => {
        const contentDiv = dom.schemaEditorContent;
        if (!appState.ui.isEditorOpen || !appState.ui.editorState) { contentDiv.innerHTML = ''; return; }
        const editorData = appState.ui.editorState;
        const isExistingSchema = !!editorData.originalFileName;
        contentDiv.innerHTML = `
            <div id="editor-schema-controls">
                <div class="input-group"><label data-i18n="schemaName">${t('schemaName')}</label><input type="text" id="editor-schema-name" class="input-field" value="${editorData.name || ''}" ${isExistingSchema ? 'readonly' : ''}></div>
                <div class="input-group"><label data-i18n="schemaVersion">${t('schemaVersion')}</label><input type="text" id="editor-schema-version" class="input-field" value="${editorData.version || ''}"></div>
            </div>
            ${isExistingSchema ? `<button id="editor-delete-schema-btn" class="btn" title="${t('deleteSchema')}">🗑️</button>` : ''}
            <div id="editor-bg-control">
                <div class="input-group">
                    <label>Backgrounds</label>
                    <button id="btn-editor-upload-bg" class="btn btn-secondary">📤 Upload New Background</button>
                </div>
                <div class="input-group">
                    <label>Global Background (Default for all MPs)</label>
                    <select id="editor-global-bg-select" class="select-field">
                        <option value="">None</option>
                        ${(editorData.meta.backgrounds || []).map(bg => 
                            `<option value="${bg.id}" ${editorData.meta.globalBackground === bg.id ? 'selected' : ''}>${bg.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div id="editor-bg-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 12px;">
                    ${(editorData.meta.backgrounds || []).map(bg => `
                        <div class="bg-thumbnail" data-bg-id="${bg.id}" style="position: relative; border: 2px solid ${editorData.meta.globalBackground === bg.id ? 'var(--accent-color)' : 'var(--border-color)'}; border-radius: 8px; padding: 8px; background: var(--panel-bg); cursor: pointer;">
                            <div style="width: 100%; height: 100px; background: var(--canvas-bg); border-radius: 4px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <span style="font-size: 2em;">🖼️</span>
                            </div>
                            <div style="font-size: 0.85em; font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bg.name}">${bg.name}</div>
                            <div style="font-size: 0.75em; color: var(--text-secondary); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${bg.fileName}">${bg.fileName}</div>
                            <button class="btn btn-secondary btn-delete-bg" data-bg-id="${bg.id}" style="width: 100%; padding: 4px 8px; font-size: 0.85em;">🗑️ Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div id="editor-meta-control">
                <label><span data-i18n="metaLabels">${t('metaLabels')}</span></label>
                <div class="checkbox-group"><label><input type="checkbox" id="check-show-qr" ${editorData.meta.showQR ? 'checked' : ''}> <span data-i18n="showQR">${t('showQR')}</span></label><label><input type="checkbox" id="check-show-date" ${editorData.meta.showDate ? 'checked' : ''}> <span data-i18n="showDate">${t('showDate')}</span></label></div>
            </div>
            <hr><div id="editor-properties-container"></div>`;
       
        if(isExistingSchema) contentDiv.querySelector('#editor-delete-schema-btn').addEventListener('click', handleDeleteSchema);
        contentDiv.querySelector('#editor-schema-name').addEventListener('input', (e) => { editorData.name = e.target.value; appState.ui.editorIsDirty = true; });
        contentDiv.querySelector('#editor-schema-version').addEventListener('input', (e) => { editorData.version = e.target.value; appState.ui.editorIsDirty = true; });
        contentDiv.querySelector('#check-show-qr').addEventListener('change', (e) => { editorData.meta.showQR = e.target.checked; if(e.target.checked && !editorData.meta.qrLabelPos) editorData.meta.qrLabelPos={x:100, y:50}; appState.ui.editorIsDirty = true; renderCanvas(); });
        contentDiv.querySelector('#check-show-date').addEventListener('change', (e) => { editorData.meta.showDate = e.target.checked; if(e.target.checked && !editorData.meta.dateLabelPos) editorData.meta.dateLabelPos={x:100, y:80}; appState.ui.editorIsDirty = true; renderCanvas(); });
        contentDiv.querySelector('#btn-editor-upload-bg').addEventListener('click', () => dom.backgroundUploader.click());
        
        // Global background selection with live preview
        contentDiv.querySelector('#editor-global-bg-select').addEventListener('change', (e) => {
            const newGlobalBgId = e.target.value === '' ? null : e.target.value;
            editorData.meta.globalBackground = newGlobalBgId;
            appState.ui.editorIsDirty = true;
            
            console.log(`🌐 Global background changed to: ${newGlobalBgId || 'None'}`);
            
            const bg = (editorData.meta.backgrounds || []).find(b => b.id === newGlobalBgId);
            if (bg) {
                loadAndDisplayBackground(bg.fileName);
                console.log(`🖼️ Loading global background: ${bg.name} (${bg.fileName})`);
            } else {
                dom.backgroundImg.src = '';
                console.log(`🖼️ Cleared background (no global background set)`);
            }
            renderCanvas();
        });
        
        // Background thumbnail click to set as global
        contentDiv.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-delete-bg')) return; // Don't trigger on delete button
                const bgId = thumb.dataset.bgId;
                editorData.meta.globalBackground = bgId;
                appState.ui.editorIsDirty = true;
                
                const bg = (editorData.meta.backgrounds || []).find(b => b.id === bgId);
                if (bg) {
                    loadAndDisplayBackground(bg.fileName);
                    console.log(`🖼️ Set global background via thumbnail: ${bg.name}`);
                }
                renderSchemaInspector();
                renderCanvas();
            });
        });
        
        // Background deletion
        contentDiv.querySelectorAll('.btn-delete-bg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent thumbnail click
                const bgId = e.target.dataset.bgId;
                const bg = (editorData.meta.backgrounds || []).find(b => b.id === bgId);
                if (confirm(`Delete background "${bg?.name || bgId}"? MPs using it will revert to global background.`)) {
                    console.log(`🗑️ Deleting background: ${bg?.name || bgId}`);
                    editorData.meta.backgrounds = (editorData.meta.backgrounds || []).filter(b => b.id !== bgId);
                    // Clear references
                    if (editorData.meta.globalBackground === bgId) {
                        editorData.meta.globalBackground = null;
                        dom.backgroundImg.src = '';
                        console.log(`🌐 Cleared global background`);
                    }
                    editorData.points.forEach(mp => { 
                        if (mp.backgroundId === bgId) {
                            mp.backgroundId = null;
                            console.log(`🔄 Reset MP ${mp.id} to use global background`);
                        }
                    });
                    appState.ui.editorIsDirty = true;
                    renderSchemaInspector();
                    renderCanvas();
                }
            });
        });
        const container = contentDiv.querySelector('#editor-properties-container');
        editorData.points.forEach(mp => renderMPCard(mp, container));
    };

    const renderMPCard = (mp, container) => {
        const card = document.createElement('div');
        card.className = 'editor-point-card';
        card.dataset.mpId = mp.id;
        if (mp.id === appState.ui.selectedMPId) card.classList.add('selected');
       
        const typeHtml = mp.type === 'table' ? `
            <div class="editor-sub-list">
                <div class="editor-sub-item-header"><span>${t('columns')}</span><button class="btn btn-secondary editor-add-sub-btn" data-action="add-column">${t('addColumn')}</button></div>
                ${(mp.columns || []).map((col, i) => `
                    <div class="editor-sub-item" data-col-index="${i}">
                        <div class="editor-point-header" style="margin-bottom: 8px;"><span>Col ${i+1}</span><button class="editor-icon-btn delete" data-action="delete-column">🗑️</button></div>
                         <div class="input-group"><label>${t('name')}</label><input type="text" class="input-field" data-prop="columns.${i}.name" value="${col.name}"></div>
                         <div class="input-group"><label>${t('unit')}</label><input type="text" class="input-field" data-prop="columns.${i}.unit" value="${col.unit}"></div>
                         <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                            <div class="input-group"><label>${t('nominal')}</label><input type="text" class="input-field" data-prop="columns.${i}.nominal" value="${col.nominal}"></div>
                            <div class="input-group"><label>${t('min')}</label><input type="text" class="input-field" data-prop="columns.${i}.min" value="${col.min}"></div>
                            <div class="input-group"><label>${t('max')}</label><input type="text" class="input-field" data-prop="columns.${i}.max" value="${col.max}"></div>
                        </div>
                    </div>`).join('')}
            </div>` : `
            <div class="input-group"><label>${t('unit')}</label><input type="text" class="input-field" data-prop="unit" value="${mp.unit || ''}"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                <div class="input-group"><label>${t('nominal')}</label><input type="text" class="input-field" data-prop="nominal" value="${mp.nominal}"></div>
                <div class="input-group"><label>${t('min')}</label><input type="text" class="input-field" data-prop="min" value="${mp.min}"></div>
                <div class="input-group"><label>${t('max')}</label><input type="text" class="input-field" data-prop="max" value="${mp.max}"></div>
            </div>`;

        const arrowsHtml = `
            <div class="editor-sub-list">
                <div class="editor-sub-item-header"><span>${t('arrows')}</span><button class="btn btn-secondary editor-add-sub-btn" data-action="add-arrow">${t('addArrow')}</button></div>
                ${(mp.arrows || []).map((arrow, i) => `
                    <div class="editor-sub-item" data-arrow-index="${i}">
                         <div class="editor-point-header"><span>Arrow ${i+1}</span><button class="editor-icon-btn delete" data-action="delete-arrow">🗑️</button></div>
                         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div class="input-group"><label>${t('arrowWidth')}</label><input type="number" class="input-field" data-prop="arrows.${i}.style.width" value="${arrow.style?.width || 2}"></div>
                            <div class="input-group"><label>${t('arrowColor')}</label><input type="color" class="input-field" data-prop="arrows.${i}.style.color" value="${arrow.style?.color || '#007aff'}"></div>
                        </div>
                        <div class="input-group"><label>${t('arrowHead')}</label>
                            <select class="select-field" data-prop="arrows.${i}.style.head">
                                <option value="none" ${arrow.style?.head === 'none' ? 'selected' : ''}>None</option>
                                <option value="arrow" ${arrow.style?.head === 'arrow' ? 'selected' : ''}>Arrow</option>
                                <option value="double" ${arrow.style?.head === 'double' ? 'selected' : ''}>Double</option>
                            </select>
                        </div>
                    </div>
                `).join('')}
            </div>`;

        const backgroundOptions = (appState.ui.editorState.meta.backgrounds || []).map(bg => 
            `<option value="${bg.id}" ${mp.backgroundId === bg.id ? 'selected' : ''}>${bg.name}</option>`
        ).join('');
        
        const backgroundSelectHtml = `
            <div class="input-group">
                <label>MP Background</label>
                <select class="select-field mp-bg-select" data-prop="backgroundId">
                    <option value="">Use Global</option>
                    ${backgroundOptions}
                </select>
            </div>`;

        const viewControlsHtml = `
            <div class="editor-view-controls">
                <button class="btn btn-secondary" data-action="set-view">${t('setView')}</button>
                <button class="btn btn-secondary" data-action="clear-view" ${!mp.view ? 'disabled' : ''}>${t('clearView')}</button>
            </div>`;

        card.innerHTML = `<div class="editor-point-header"><input type="text" class="input-field editor-point-id-input" value="${mp.id}" title="Change Point ID"><div class="editor-point-actions"><select class="select-field editor-point-type" data-prop="type"><option value="single" ${mp.type==='single'?'selected':''}>Single</option><option value="table" ${mp.type==='table'?'selected':''}>Table</option></select><button class="editor-icon-btn delete" data-action="delete-mp" title="Delete Point">🗑️</button></div></div><div class="input-group"><label>${t('name')}</label><input type="text" class="input-field" data-prop="name" value="${mp.name}"></div>${backgroundSelectHtml}${typeHtml}${arrowsHtml}${viewControlsHtml}`;
        container.appendChild(card);

        card.querySelector('.editor-point-id-input').addEventListener('change', (e) => {
            const newId = e.target.value.trim();
            if (newId && newId !== mp.id && !appState.ui.editorState.points.some(p => p.id === newId)) {
                mp.id = newId; appState.ui.selectedMPId = newId; appState.ui.editorIsDirty = true; renderSchemaInspector(); renderCanvas();
            } else { e.target.value = mp.id; }
        });
        card.addEventListener('click', async (e) => {
            // First, handle card selection (unless clicking on interactive elements)
            if (!e.target.matches('input, button, select, textarea, .editor-icon-btn')) {
                // Select this MP
                appState.ui.selectedMPId = mp.id;
                highlightSelection(mp.id);
                
                // ✅ FIXED: Load correct background synchronously
                let bgFileName = null;
                if (mp.backgroundId) {
                    const bg = (appState.ui.editorState.meta.backgrounds || []).find(b => b.id === mp.backgroundId);
                    if (bg) {
                        console.log(`🔍 Selected MP ${mp.id}, loading its background: ${bg.name}`);
                        bgFileName = bg.fileName;
                    }
                } else {
                    const globalBgId = appState.ui.editorState.meta.globalBackground;
                    if (globalBgId) {
                        const bg = (appState.ui.editorState.meta.backgrounds || []).find(b => b.id === globalBgId);
                        if (bg) {
                            console.log(`🔍 Selected MP ${mp.id}, loading global background: ${bg.name}`);
                            bgFileName = bg.fileName;
                        }
                    }
                }
                
                // Wait for background to load before applying zoom
                if (bgFileName) {
                    await loadAndDisplayBackground(bgFileName, { sync: true });
                }
                
                // ✅ FIXED: Reset zoom based on MP's saved view
                if (mp.view && mp.view.scale) {
                    console.log(`🔍 EDITOR: Applying saved view for ${mp.id}:`, {
                        scale: mp.view.scale.toFixed(3),
                        offsetX: mp.view.offsetX.toFixed(1),
                        offsetY: mp.view.offsetY.toFixed(1)
                    });
                    applyCanvasZoom(mp.view, false);
                } else {
                    console.log(`🔍 EDITOR: Resetting view for ${mp.id} (no saved view)`);
                    resetCanvasView(false, false); // Reset without animation, keep selection
                }
                
                // ✅ FIXED: Explicitly call renderCanvas() and fitLabelsToView() after zoom
                renderCanvas();
                requestAnimationFrame(() => {
                    fitLabelsToView();
                });
            }
            
            // Then handle button actions
            const act = e.target.dataset.action; if (!act) return;
            if (act === 'delete-mp') { if (confirm(`Delete ${mp.id}?`)) deleteMP(mp.id); }
            else if (act === 'add-arrow') {
                // ✅ Oblicz centrum WIDOCZNEGO obszaru
                const { scale, offsetX, offsetY } = appState.ui.canvasZoom;
                
                const rect = dom.canvasWrapper.getBoundingClientRect();
                const screenCenterX = rect.width / 2;
                const screenCenterY = rect.height / 2;
                
                // ✅ ZWERYFIKOWANY wzór: viewBoxX = (screenX / scale) - offsetX
                const centerViewBoxX = (screenCenterX / scale) - offsetX;
                const centerViewBoxY = (screenCenterY / scale) - offsetY;
                
                // Clamp do granic ViewBox (50px margines)
                const clampedX = Math.max(50, Math.min(950, centerViewBoxX));
                const clampedY = Math.max(50, Math.min(650, centerViewBoxY));
                
                console.log(`➕ Arrow at visible center: ViewBox=(${clampedX.toFixed(0)}, ${clampedY.toFixed(0)}) [zoom=${scale.toFixed(2)}x, offset=(${offsetX}, ${offsetY})]`);
                
                mp.arrows.push({
                    x1: clampedX - 50,
                    y1: clampedY, 
                    x2: clampedX + 50,
                    y2: clampedY, 
                    style: {color: '#ff9500', width: 2, head: 'arrow'}
                }); 
                
                appState.ui.editorIsDirty = true; 
                renderSchemaInspector(); 
                renderCanvas();
                
                // ✅ BONUS: Scroll do nowej strzałki
                const arrowCard = e.target.closest('.editor-point-card');
                if (arrowCard) {
                    setTimeout(() => {
                        const newArrowEl = arrowCard.querySelector('.editor-sub-item:last-child');
                        if (newArrowEl) {
                            newArrowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }, 100);
                }
            }
            else if (act === 'delete-arrow') { const idx = parseInt(e.target.closest('.editor-sub-item')?.dataset.arrowIndex || '0', 10); if (!isNaN(idx)) mp.arrows.splice(idx, 1); appState.ui.editorIsDirty = true; renderSchemaInspector(); renderCanvas(); }
            else if (act === 'add-column') { mp.columns = mp.columns || []; mp.columns.push({name:'New Col', unit:'mm', nominal:0, min:-0.1, max:0.1}); appState.ui.editorIsDirty = true; renderSchemaInspector(); }
            else if (act === 'delete-column') { const idx = parseInt(e.target.closest('.editor-sub-item')?.dataset.colIndex || '0', 10); if (!isNaN(idx)) mp.columns.splice(idx, 1); appState.ui.editorIsDirty = true; renderSchemaInspector(); }
            else if (act === 'set-view') {
                // Save the current zoom state as the view for this MP
                mp.view = { 
                    scale: appState.ui.canvasZoom.scale, 
                    offsetX: appState.ui.canvasZoom.offsetX, 
                    offsetY: appState.ui.canvasZoom.offsetY 
                };
                appState.ui.editorIsDirty = true;
                console.log(`📸 VIEW SAVED for ${mp.id}:`, {
                    scale: mp.view.scale.toFixed(3),
                    offsetX: mp.view.offsetX.toFixed(1),
                    offsetY: mp.view.offsetY.toFixed(1),
                    currentCanvasZoom: appState.ui.canvasZoom
                });
                alert(`View saved for ${mp.id}!\nScale: ${mp.view.scale.toFixed(2)}x`);
                renderSchemaInspector();
            }
            else if (act === 'clear-view') {
                mp.view = null;
                appState.ui.editorIsDirty = true;
                resetCanvasView();
                renderSchemaInspector();
            }
        });
        card.querySelectorAll('[data-prop]').forEach(input => {
            const eventType = input.classList.contains('mp-bg-select') ? 'change' : 'input';
            input.addEventListener(eventType, (e) => {
                appState.ui.editorIsDirty = true;
                const path = e.target.dataset.prop.split('.');
                let val = e.target.value;
                // Handle backgroundId - empty string should be null
                if (path[0] === 'backgroundId') {
                    val = val === '' ? null : val;
                    
                    // When MP background changes, load that background for viewing
                    if (val) {
                        const bg = (appState.ui.editorState.meta.backgrounds || []).find(b => b.id === val);
                        if (bg) {
                            loadAndDisplayBackground(bg.fileName);
                            console.log(`🖼️ MP ${mp.id} background changed to: ${bg.name}, loading image`);
                        }
                    } else {
                        // MP set to use global - load global background
                        const globalBgId = appState.ui.editorState.meta.globalBackground;
                        if (globalBgId) {
                            const bg = (appState.ui.editorState.meta.backgrounds || []).find(b => b.id === globalBgId);
                            if (bg) {
                                loadAndDisplayBackground(bg.fileName);
                                console.log(`🖼️ MP ${mp.id} set to use global, loading global background: ${bg.name}`);
                            }
                        } else {
                            dom.backgroundImg.src = '';
                            console.log(`🖼️ MP ${mp.id} set to use global, but no global background set`);
                        }
                    }
                    // IMPORTANT: Refresh canvas to show filtered points for new background
                    renderCanvas();
                }
                if (path[path.length - 1].match(/nominal|min|max|width/)) val = parseFloat(val.replace(',', '.')) || val;
                let target = mp;
                for (let i = 0; i < path.length - 1; i++) target = target[path[i]] = target[path[i]] || {};
                target[path[path.length - 1]] = val;
                if (path[0] === 'type') renderSchemaInspector(); else renderCanvas();
            });
        });
    };

    const onEditorMouseDown = (e) => {
        if (!appState.ui.isEditorOpen) return;
        
        // Check if clicked element is a circle (arrow handle), label, or meta label
        // Use closest() to handle clicks on child elements inside labels
        let target = e.target.closest('.mp-label, .meta-label, circle');
        
        // If closest didn't find anything, check if the target itself is one of these
        if (!target) {
            if (e.target.tagName === 'circle' || e.target.classList.contains('mp-label') || e.target.classList.contains('meta-label')) {
                target = e.target;
            }
        }
        
        // Also check if we clicked inside a label by checking parent elements
        if (!target) {
            let el = e.target;
            while (el && el !== dom.labelsContainer && el !== dom.canvasWrapper) {
                if (el.classList && (el.classList.contains('mp-label') || el.classList.contains('meta-label'))) {
                    target = el;
                    break;
                }
                el = el.parentElement;
            }
        }
        
        if (target) { // User clicked on a draggable item
            e.preventDefault();
            e.stopPropagation();
            
            // For labels, always get the actual label element (not child divs)
            let labelElement = null;
            if (target.classList.contains('mp-label')) {
                labelElement = target;
            } else if (target.closest('.mp-label')) {
                labelElement = target.closest('.mp-label');
            }
            
            // Check for mpId - get it from the label element if we found one
            const mpId = labelElement ? (labelElement.dataset?.mpId || labelElement.getAttribute('data-mp-id')) : (target.dataset?.mpId || target.getAttribute('data-mp-id'));
            
            if (mpId) {
                selectMP(mpId);
                const arrowIndex = target.dataset?.arrowIndex !== undefined ? parseInt(target.dataset.arrowIndex, 10) : undefined;
                const handleType = target.dataset?.handleType;
                
                // Determine drag type: if it's a label (not an arrow handle), set type to 'label'
                let dragType = handleType;
                if (!dragType && labelElement) {
                    dragType = 'label';
                }
                
                const foundMp = appState.ui.editorState.points.find(p => p.id === mpId);
                if (foundMp) {
                    appState.ui.dragging = { 
                        type: dragType || 'label', 
                        mp: foundMp, 
                        arrowIndex: isNaN(arrowIndex) ? undefined : arrowIndex 
                    };
                }
            } else if (target.dataset?.dragType) {
                appState.ui.dragging = { type: target.dataset.dragType };
            } else if (labelElement) {
                // Fallback: if it's a label but no mpId, try to find mp by checking the label's text content
                const labelText = labelElement.textContent || '';
                const mpMatch = labelText.match(/(MP\d+)/);
                if (mpMatch) {
                    const foundMp = appState.ui.editorState.points.find(p => p.id === mpMatch[1]);
                    if (foundMp) {
                        appState.ui.dragging = { type: 'label', mp: foundMp };
                    }
                }
            } else if (target.classList.contains('meta-label') || target.closest('.meta-label')) {
                const metaLabelEl = target.classList.contains('meta-label') ? target : target.closest('.meta-label');
                const dragType = metaLabelEl?.dataset?.dragType;
                if (dragType) {
                    appState.ui.dragging = { type: dragType };
                }
            }
        } else { // User clicked on the background, initiate panning
            appState.ui.isPanning = true;
            appState.ui.panStart = { x: e.clientX, y: e.clientY };
            dom.canvasWrapper.classList.add('is-panning');
        }

        if (appState.ui.dragging || appState.ui.isPanning) {
            document.addEventListener('mousemove', onEditorMouseMove);
            document.addEventListener('mouseup', onEditorMouseUp);
        }
    };
   
    const onEditorMouseMove = (e) => {
        if (!appState.ui.dragging && !appState.ui.isPanning) return;
        
        e.preventDefault();
        e.stopPropagation();
        appState.ui.editorIsDirty = true;

        if (appState.ui.isPanning) {
            const dx = e.clientX - appState.ui.panStart.x;
            const dy = e.clientY - appState.ui.panStart.y;
            // No division by scale needed here as we are moving the whole view
            appState.ui.canvasZoom.offsetX += dx;
            appState.ui.canvasZoom.offsetY += dy;
            appState.ui.panStart = { x: e.clientX, y: e.clientY };
            applyCanvasZoom(appState.ui.canvasZoom, false);
        } else if (appState.ui.dragging) {
            try {
                const { type, mp, arrowIndex } = appState.ui.dragging;
                
                if (type === 'start' || type === 'end') {
                    // For arrow handles (circles in SVG), use SVG coordinate system
                    const pt = dom.overlaySvg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgTransform = dom.overlaySvg.getScreenCTM()?.inverse();
                    if (!svgTransform) return;
                    const coords = pt.matrixTransform(svgTransform);
                    
                    const arrow = mp.arrows[arrowIndex];
                    if (arrow) {
                        arrow[type === 'start' ? 'x1' : 'x2'] = coords.x;
                        arrow[type === 'start' ? 'y1' : 'y2'] = coords.y;
                    }
                    // Update arrow visually without full render
                    const handle = dom.overlaySvg.querySelector(`circle[data-mp-id="${mp.id}"][data-arrow-index="${arrowIndex}"][data-handle-type="${type}"]`);
                    if (handle) {
                        handle.setAttribute('cx', coords.x);
                        handle.setAttribute('cy', coords.y);
                    }
                    const line = dom.overlaySvg.querySelector(`line[data-mp-id="${mp.id}"][data-arrow-index="${arrowIndex}"]`);
                    if (line) {
                        if (type === 'start') {
                            line.setAttribute('x1', coords.x);
                            line.setAttribute('y1', coords.y);
                        } else {
                            line.setAttribute('x2', coords.x);
                            line.setAttribute('y2', coords.y);
                        }
                    }
                } else if (type === 'label' || type === 'qrLabel' || type === 'dateLabel') {
                    // Use EXACT same approach as arrows - convert cursor to viewBox coordinates
                    const pt = dom.overlaySvg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgTransform = dom.overlaySvg.getScreenCTM()?.inverse();
                    if (!svgTransform) return;
                    const coords = pt.matrixTransform(svgTransform);
                    
                    // Clamp coordinates to valid viewBox range
                    const viewBoxX = Math.max(0, Math.min(VIEWBOX_WIDTH, coords.x));
                    const viewBoxY = Math.max(0, Math.min(VIEWBOX_HEIGHT, coords.y));

                    // Save viewBox coordinates (same as arrows do)
                    if (type === 'label' && mp) {
                        mp.labelX = viewBoxX;
                        mp.labelY = viewBoxY;
                    } else if (type === 'qrLabel') {
                        appState.ui.editorState.meta.qrLabelPos = { x: viewBoxX, y: viewBoxY };
                    } else if (type === 'dateLabel') {
                        appState.ui.editorState.meta.dateLabelPos = { x: viewBoxX, y: viewBoxY };
                    }
                    
                    // Use fitLabelsToView to update position - it uses the same calculation as rendering
                    // This ensures labels are positioned correctly during drag
                    fitLabelsToView();
                }
                // Don't call renderCanvas() during drag - it causes flickering and position jumps
                // We'll call it on mouseup instead
            } catch (err) {
                console.error('Error in onEditorMouseMove:', err);
            }
        }
    };
   
    const onEditorMouseUp = () => {
        if (appState.ui.isPanning) {
            appState.ui.isPanning = false;
            dom.canvasWrapper.classList.remove('is-panning');
        }
        if (appState.ui.dragging) {
            appState.ui.dragging = null;
            
            // Call fitLabelsToView after drag to position labels correctly
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                fitLabelsToView();
            });
        }
        document.removeEventListener('mousemove', onEditorMouseMove);
        document.removeEventListener('mouseup', onEditorMouseUp);
    };
   
    const handleDeleteSchema = async () => {
        const fn = appState.ui.editorState.originalFileName;
        if (!fn || !confirm(t('confirmDelete'))) return;
        try {
            await (await getOrCreateDir(appState.projectRootHandle, 'maps')).removeEntry(`${fn}.map.json`);
            alert(t('deleteSuccess'));
            dom.mapSelect.value = '';
            await scanProjectFolder();
            toggleEditor(false);
        } catch (err) {
            console.error(err);
            alert(t('deleteError'));
        }
    };
   
    const addMP = () => {
        if (!appState.ui.isEditorOpen) return;
        
        const points = appState.ui.editorState.points;
        const newId = `MP${(Math.max(0, ...points.map(p => parseInt(p.id.replace(/\D/g, ''), 10) || 0)) + 1)}`;
        
        // ✅ 1. Read backgroundId BEFORE reset
        let newBackgroundId = null;
        if (appState.ui.selectedMPId) {
            const selectedMP = points.find(p => p.id === appState.ui.selectedMPId);
            if (selectedMP) {
                newBackgroundId = selectedMP.backgroundId || null;
                console.log(`✨ New MP inherits background from ${selectedMP.id}: ${newBackgroundId || 'Global'}`);
            }
        }
        
        // ✅ 2. Reset BEZ czyszczenia selekcji
        resetCanvasView(false, false);  // animate=false, clearSelection=false
        
        // ✅ 3. Centrum ViewBox (500, 350)
        const centerX = 500;  // VIEWBOX_WIDTH / 2
        const centerY = 350;  // VIEWBOX_HEIGHT / 2
        
        points.push({ 
            id: newId, 
            name: "New Point", 
            type: 'single', 
            unit: "mm", 
            nominal: 10, 
            min: 9.9, 
            max: 10.1,
            labelX: centerX + 150,  // 650
            labelY: centerY - 25,   // 325
            arrows: [{
                x1: centerX - 100,  // 400
                y1: centerY,        // 350
                x2: centerX + 100,  // 600
                y2: centerY,        // 350
                style: { color: '#007aff', width: 2, head: 'arrow' }
            }], 
            view: null,
            backgroundId: newBackgroundId  // ✅ Dziedziczone!
        });
        
        appState.ui.editorIsDirty = true;
        renderSchemaInspector();
        selectMP(newId);
        renderCanvas();
        
        console.log(`➕ Created MP: ${newId} on background: ${newBackgroundId || 'Global'}`);
    };
   
    const deleteMP = (mpId) => {
        const idx = appState.ui.editorState.points.findIndex(p => p.id === mpId);
        if (idx > -1) {
            appState.ui.editorState.points.splice(idx, 1);
            appState.ui.editorIsDirty = true;
            renderSchemaInspector();
            renderCanvas();
        }
    };

    // =========================================
    // [SECTION] DATA SAVING & EXPORT
    // =========================================
    const saveMap = async () => {
        const { name, version } = appState.ui.editorState;
        if (!name || !version) { alert(t('schemaInfoMissing')); return; }
        const fn = `${name.trim()}_v${version.trim()}`;
        try {
            // Deep clone to ensure views are included
            const s = JSON.parse(JSON.stringify(appState.ui.editorState));
            delete s.name;
            delete s.version;
            delete s.originalFileName;
            // Ensure views and backgroundId are preserved in points
            if (s.points) {
                s.points = s.points.map(mp => ({
                    ...mp,
                    view: mp.view || null,  // Explicitly include view (even if null)
                    backgroundId: mp.backgroundId || null  // Explicitly include backgroundId
                }));
            }
            // Ensure meta.backgrounds, defaultBackground, and backgroundId are preserved
            if (s.meta) {
                s.meta.backgrounds = s.meta.backgrounds || [];
                s.meta.defaultBackground = s.meta.defaultBackground || null;
                // Don't save backgroundId (editor view state) - it's temporary
                delete s.meta.backgroundId;
            }
            await writeFile(await getOrCreateFile(await getOrCreateDir(appState.projectRootHandle, 'maps'), `${fn}.map.json`), JSON.stringify(s, null, 2));
            if (appState.ui.editorState.originalFileName && appState.ui.editorState.originalFileName !== fn) {
                await (await getOrCreateDir(appState.projectRootHandle, 'maps')).removeEntry(`${appState.ui.editorState.originalFileName}.map.json`);
            }
            await scanProjectFolder();
            dom.mapSelect.value = fn;
            await handleMapSelect({target: {value: fn}});
            toggleEditor(false);
        } catch (e) {
            console.error(e);
            alert(t('saveError'));
        }
    };
   
    const saveProjectToLocalStorage = async () => {
        if (!appState.projectRootHandle) {
            console.warn('⚠️ No project handle, skipping localStorage save');
            return;
        }
        
        try {
            console.log('📊 Saving project to localStorage...');
            console.log('📊 Records in appState.data.db:', appState.data.db.length);
            
            // Collect maps with their backgrounds
            const maps = [];
            for (const [fileName, handle] of Object.entries(appState.fileHandles.maps)) {
                try {
                    const content = await readFile(handle);
                    const mapData = JSON.parse(content);
                    // Only include meta (with backgrounds) and name for Report Studio
                    maps.push({
                        fileName: fileName,
                        name: fileName.replace('.map.json', ''),
                        meta: mapData.meta || {}
                    });
                } catch (err) {
                    console.warn(`Could not read map ${fileName}:`, err);
                }
            }
            
            const projectData = {
                name: appState.projectRootHandle.name,
                lastAccess: Date.now(),
                maps: maps,
                records: appState.data.db.map(record => {
                    const measurements = [];
                    
                    // Extract all MP fields
                    Object.keys(record).forEach(key => {
                        if (key.endsWith('_Value') && record[key] && record[key].toString().trim() !== '') {
                            const mpId = key.replace('_Value', '');
                            
                            const value = record[`${mpId}_Value`];
                            const min = record[`${mpId}_Min`];
                            const max = record[`${mpId}_Max`];
                            const nominal = record[`${mpId}_Nominal`];
                            const unit = record[`${mpId}_Unit`];
                            const name = record[`${mpId}_Name`];
                            const backgroundId = record[`${mpId}_BackgroundId`] || null;
                            
                            // Parse numbers (comma as decimal)
                            const valueNum = parseFloat((value || '').toString().replace(',', '.'));
                            const minNum = parseFloat((min || '').toString().replace(',', '.'));
                            const maxNum = parseFloat((max || '').toString().replace(',', '.'));
                            
                            let status = 'OK';
                            if (!isNaN(valueNum) && !isNaN(minNum) && !isNaN(maxNum)) {
                                status = (valueNum >= minNum && valueNum <= maxNum) ? 'OK' : 'NOK';
                            }
                            
                            measurements.push({
                                MP_ID: mpId,
                                Name: name || mpId,
                                Value: value,
                                Unit: unit || 'mm',
                                Min: min || '',
                                Max: max || '',
                                Nominal: nominal || '',
                                Status: status,
                                backgroundId: backgroundId
                            });
                        }
                    });
                    
                    return {
                        qrCode: record.QRCode || '',
                        measurementDate: record.Timestamp ? new Date(record.Timestamp).toISOString().split('T')[0] : '',
                        measurementTime: record.Timestamp ? new Date(record.Timestamp).toTimeString().split(' ')[0] : '',
                        schemaName: record.SchemaName || '',
                        schemaVersion: record.SchemaVersion || '',
                        inspector: 'Inspector',
                        overallStatus: record.OverallStatus || 'OK',
                        comment: record.Comment || '',
                        measurements: measurements
                    };
                })
            };
            
            localStorage.setItem('measurementProject', JSON.stringify(projectData));
            console.log(`✅ Saved ${projectData.records.length} records to localStorage`);
            
        } catch (err) {
            console.error('❌ Error saving to localStorage:', err);
        }
    };

    const saveAndExport = async () => {
        if (!appState.fileHandles.db || !appState.data.currentMap) {
            alert("Select Project Folder & Schema first.");
            return;
        }
        const qr = dom.qrCodeInput.value.trim();
        if (!qr) {
            alert("QR Code required.");
            return;
        }
        try {
            const mpData = {};
            let overallStatus = 'OK';
            appState.data.currentMap.points.forEach(mp => {
                if (mp.type === 'table') {
                    mp.columns.forEach((col, i) => {
                        const inputEl = document.querySelector(`.mp-row[data-mp-id="${mp.id}"] input[data-col-index="${i}"]`);
                        if (!inputEl) return;
                        const val = inputEl.value;
                        const num = parseFloat(val.replace(',', '.'));
                        if (val !== '' && (isNaN(num) || num < col.min || num > col.max)) overallStatus = 'NOK';
                        Object.assign(mpData, {
                            [`${mp.id}_${col.name}_Value`]: val,
                            [`${mp.id}_${col.name}_Nominal`]: col.nominal,
                            [`${mp.id}_${col.name}_Min`]: col.min,
                            [`${mp.id}_${col.name}_Max`]: col.max,
                            [`${mp.id}_${col.name}_Unit`]: col.unit,
                            [`${mp.id}_${col.name}_Name`]: col.name,
                            [`${mp.id}_${col.name}_BackgroundId`]: mp.backgroundId || null
                        });
                    });
                } else {
                    const inputEl = document.querySelector(`.mp-row[data-mp-id="${mp.id}"] input`);
                    if (!inputEl) return;
                    const val = inputEl.value;
                    const num = parseFloat(val.replace(',', '.'));
                    if (val !== '' && (isNaN(num) || num < mp.min || num > mp.max)) overallStatus = 'NOK';
                    Object.assign(mpData, {
                        [`${mp.id}_Value`]: val,
                        [`${mp.id}_Nominal`]: mp.nominal,
                        [`${mp.id}_Min`]: mp.min,
                        [`${mp.id}_Max`]: mp.max,
                        [`${mp.id}_Unit`]: mp.unit,
                        [`${mp.id}_Name`]: mp.name,
                        [`${mp.id}_BackgroundId`]: mp.backgroundId || null
                    });
                }
            });
            const [sn, sv] = dom.mapSelect.value.split('_v');
            const rec = {
                RecordId: `${new Date().toISOString().replace(/[:.]/g, '-')}_${Math.random().toString(36).substring(2, 7)}`,
                Timestamp: new Date().toISOString(),
                QRCode: qr,
                SchemaName: sn,
                SchemaVersion: sv||'1',
                OverallStatus: overallStatus,
                Comment: document.getElementById('measurement-comment').value.trim(),
                ...mpData
            };
            const ah = new Set(appState.data.dbHeaders);
            Object.keys(rec).forEach(k => ah.add(k));
            appState.data.dbHeaders = [...ah];
            appState.data.db.push(rec);
            await writeFile(appState.fileHandles.db, serializeCSV(appState.data.dbHeaders, appState.data.db));
            
            // ✅ Priority 1: Update localStorage after CSV save
            console.log('📊 Updating localStorage with new measurement...');
            await scanProjectFolder(); // Re-scan to refresh appState.data.db from CSV
            await saveProjectToLocalStorage(); // Update localStorage with latest data
            console.log('✅ localStorage updated - new measurement visible in Report Studio');
            
            // ✅ FIX: Validate schema has background before export
            const hasGlobalBg = appState.data.currentMap.meta?.globalBackground && 
                               appState.data.currentMap.meta?.backgrounds?.length > 0;
            const hasLegacyBg = appState.data.currentMap.meta?.backgroundFile;
            
            if (!hasGlobalBg && !hasLegacyBg) {
                alert("Schemat nie ma skonfigurowanego tła. Proszę edytować schemat i dodać obraz tła.");
                console.error('❌ Cannot export: Schema has no background configured');
                return;
            }
            
            // ✅ CHANGE: Use new function instead of old one
            console.log('📸 Generating visualizations...');
            const qrCode = dom.qrCodeInput.value.trim();
            const schemaName = appState.data.currentMap?.fileName;
            if (qrCode && schemaName) {
                await generateAllVisualizationImages(qrCode, schemaName);
            }
            console.log('✅ All visualizations saved');
            
            dom.saveConfirmationOverlay.classList.add('visible');
            setTimeout(() => {
                dom.saveConfirmationOverlay.classList.remove('visible');
                dom.qrCodeInput.value = '';
                document.querySelectorAll('.mp-row input, #measurement-comment').forEach(i => i.value = '');
                resetCanvasView();
                renderMPList();
                renderCanvas();
                dom.qrCodeInput.focus();
            }, 1500);
        } catch (e) {
            console.error(e);
            alert(t('saveError'));
        }
    };
   
    const exportPNG = async ({ 
        fromSave = false, 
        recordData = null, 
        mapData = null, 
        saveToFile = false, 
        showAlertOnSuccess = true,
        backgroundId = null,  // ✅ NEW parameter for overview per background
        visibleMPs = null,    // ✅ NEW parameter for filtering MPs
        fileName = null,      // ✅ NEW parameter for custom filename
        view = null           // ✅ NEW parameter for custom view (zoom)
    } = {}) => {
        return new Promise(async (resolve, reject) => {
            const cMap = mapData || appState.data.currentMap;
            
            // ✅ NEW LOGIC: Determine background to use
            let backgroundFileName = null;
            
            if (backgroundId) {
                // Explicitly provided backgroundId (for overview per background)
                const bg = cMap.meta.backgrounds.find(b => b.id === backgroundId);
                if (bg) {
                    backgroundFileName = bg.fileName;
                    console.log(`📤 Export using specified background: ${bg.name} (${backgroundFileName})`);
                }
            } else if (cMap?.meta?.globalBackground && cMap?.meta?.backgrounds) {
                // New system: globalBackground
                const bg = cMap.meta.backgrounds.find(b => b.id === cMap.meta.globalBackground);
                if (bg) {
                    backgroundFileName = bg.fileName;
                    console.log(`📤 Export using global background: ${bg.name} (${backgroundFileName})`);
                }
            }
            
            // ✅ Fallback for old schemas
            if (!backgroundFileName && cMap?.meta?.backgroundFile) {
                backgroundFileName = cMap.meta.backgroundFile;
                console.log(`📤 Export using legacy backgroundFile: ${backgroundFileName}`);
            }
            
            if (!backgroundFileName) {
                const error = '❌ No background configured for schema';
                console.error(error);
                alert('Schema nie ma skonfigurowanego tła. Proszę edytować schemat i dodać obraz tła.');
                return reject(error);
            }
            
            const bgH = appState.fileHandles.backgrounds[backgroundFileName];
            if (!bgH) {
                const error = `❌ Background file "${backgroundFileName}" not found in project`;
                console.error(error);
                alert(`Plik tła "${backgroundFileName}" nie istnieje w projekcie.`);
                return reject(error);
            }
            const img = new Image();
            const bgUrl = URL.createObjectURL(await bgH.getFile());
            img.onload = () => {
                const { naturalWidth: nw, naturalHeight: nh } = img;
                
                // ✅ NEW: Handle custom view (for zoom exports)
                let cv, ctx, scale, ox, oy;
                
                if (view && view.scale && view.scale > 1) {
                    // Create canvas with zoom view (only if scale > 1)
                    cv = document.createElement('canvas');
                    cv.width = 800;  // Standard output size
                    cv.height = 600;
                    ctx = cv.getContext('2d');
                    
                    // NOTE: This calculation assumes center-based view offsets from the old system.
                    // With the new top-left transform-origin system, view.offsetX/offsetY are now
                    // pan translations in screen pixels. This export logic may need adjustment
                    // if zoom exports don't match the on-screen view after the transform changes.
                    // TODO: Verify and update if needed after testing.
                    
                    // Calculate crop region based on view
                    const centerX = nw / 2 + (view.offsetX || 0);
                    const centerY = nh / 2 + (view.offsetY || 0);
                    const cropW = nw / view.scale;
                    const cropH = nh / view.scale;
                    const cropX = centerX - cropW / 2;
                    const cropY = centerY - cropH / 2;
                    
                    // Draw cropped background
                    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 800, 600);
                    
                    // Adjust scale and offset for rendering MPs in cropped view
                    scale = Math.min(nw / VIEWBOX_WIDTH, nh / VIEWBOX_HEIGHT) * view.scale * (800 / nw);
                    ox = ((nw - VIEWBOX_WIDTH * Math.min(nw / VIEWBOX_WIDTH, nh / VIEWBOX_HEIGHT)) / 2 - cropX) * (800 / cropW);
                    oy = ((nh - VIEWBOX_HEIGHT * Math.min(nw / VIEWBOX_WIDTH, nh / VIEWBOX_HEIGHT)) / 2 - cropY) * (600 / cropH);
                } else {
                    // Standard full view
                    scale = Math.min(nw / VIEWBOX_WIDTH, nh / VIEWBOX_HEIGHT);
                    ox = (nw - VIEWBOX_WIDTH * scale) / 2;
                    oy = (nh - VIEWBOX_HEIGHT * scale) / 2;
                    cv = document.createElement('canvas');
                    cv.width = nw;
                    cv.height = nh;
                    ctx = cv.getContext('2d');
                    if (dom.visualizationBgToggle.checked) {
                        ctx.fillStyle = dom.visualizationBgColor.value;
                        ctx.fillRect(0, 0, nw, nh);
                    }
                    ctx.drawImage(img, 0, 0, nw, nh);
                }
                
                URL.revokeObjectURL(bgUrl);
                const cRec = recordData;
                const getVal = (mpId, colName) => cRec ? (colName ? cRec[`${mpId}_${colName}_Value`] : cRec[`${mpId}_Value`]) : (colName ? document.querySelector(`.mp-row[data-mp-id="${mpId}"] input[data-col-index="${colName}"]`)?.value : document.querySelector(`.mp-row[data-mp-id="${mpId}"] input`)?.value);
                
                // ✅ NEW: Use visibleMPs if provided (for overview per background)
                const pointsToRender = visibleMPs || cMap.points;
                
                pointsToRender.forEach(mp => {
                    (mp.arrows||[{x1:mp.x1,y1:mp.y1,x2:mp.x2,y2:mp.y2,style:mp.style}]).forEach(a => {
                        if(!a.x1) return;
                        const x1=a.x1*scale+ox, y1=a.y1*scale+oy, x2=a.x2*scale+ox, y2=a.y2*scale+oy, lw=(a.style?.width||2)*scale, col=a.style?.color||'#007aff';
                        ctx.beginPath();
                        ctx.moveTo(x1,y1);
                        ctx.lineTo(x2,y2);
                        ctx.strokeStyle=col;
                        ctx.lineWidth=lw;
                        ctx.lineCap='round';
                        ctx.stroke();
                        const head = (fx,fy,tx,ty) => {
                            const hl=10*lw/2, ang=Math.atan2(ty-fy,tx-fx);
                            ctx.beginPath();
                            ctx.moveTo(tx,ty);
                            ctx.lineTo(tx-hl*Math.cos(ang-Math.PI/6),ty-hl*Math.sin(ang-Math.PI/6));
                            ctx.lineTo(tx-hl*Math.cos(ang+Math.PI/6),ty-hl*Math.sin(ang+Math.PI/6));
                            ctx.closePath();
                            ctx.fillStyle=col;
                            ctx.fill();
                        };
                        if(a.style?.head==='arrow'||mp.style?.head==='arrow') head(x1,y1,x2,y2);
                        else if(a.style?.head==='double'||mp.style?.head==='double') {
                            head(x1,y1,x2,y2);
                            head(x2,y2,x1,y1);
                        }
                    });
                    let st='OK', sCol='#34c759', valTxt='';
                    if(mp.type==='table') {
                        let any=false, allOk=true;
                        (mp.columns||[]).forEach((c, i) => {
                            const v = getVal(mp.id, i);
                            if(v && v.trim()!=='') {
                                any=true;
                                const n=parseFloat(v.replace(',','.'));
                                if(isNaN(n)||n<c.min||n>c.max) allOk=false;
                            }
                        });
                        if(any) {
                            st=allOk?'OK':'NOK';
                            sCol=allOk?'#34c759':'#ff3b30';
                        } else st='';
                        valTxt = mp.id;
                    } else {
                        const v=getVal(mp.id);
                        if(v!=='') {
                            const n=parseFloat(v.replace(',','.'));
                            if(!isNaN(n)&&n>=mp.min&&n<=mp.max) {
                                st='OK';
                                sCol='#34c759';
                            } else {
                                st='NOK';
                                sCol='#ff3b30';
                            }
                        } else st='';
                        valTxt = `${mp.id}: ${v}${mp.unit}`;
                    }
                    if(st || valTxt) { // Show label even if no status yet
                        const lx=(mp.labelX||(mp.arrows?.[0]?.x2||mp.x2))*scale+ox;
                        const ly=(mp.labelY||(mp.arrows?.[0]?.y2||mp.y2))*scale+oy;
                        
                        // Value text with status
                        ctx.font=`600 ${16*scale}px sans-serif`;
                        ctx.textAlign='center';
                        ctx.textBaseline='middle';
                        const statusText = st ? ` ${st}` : '';
                        const valueText = `${valTxt}${statusText}`;
                        const m1=ctx.measureText(valueText);
                        
                        // Name text
                        ctx.font=`400 ${14*scale}px sans-serif`;
                        const m2=ctx.measureText(mp.name);
                        
                        // Tolerance text
                        const tolText = mp.type === 'table' ? '' : `[${mp.min}..${mp.max}]`;
                        ctx.font=`400 ${12*scale}px sans-serif`;
                        const m3=ctx.measureText(tolText);
                        
                        const w=Math.max(m1.width,m2.width,m3.width)+24*scale;
                        const h=(1.4*16*scale)*3.5; // Increased height for 3 lines
                        
                        // Draw background box
                        ctx.fillStyle='white';
                        ctx.strokeStyle=sCol;
                        ctx.lineWidth=2*scale;
                        ctx.beginPath();
                        ctx.roundRect(lx-w/2,ly-h/2,w,h,[8*scale]);
                        ctx.fill();
                        ctx.stroke();
                        
                        // Draw value + status (line 1)
                        ctx.fillStyle='#0B0F10';
                        ctx.font=`600 ${16*scale}px sans-serif`;
                        ctx.fillText(valueText, lx, ly-h*0.25);
                        
                        // Draw name (line 2)
                        ctx.font=`400 ${14*scale}px sans-serif`;
                        ctx.fillStyle='#6c757d';
                        ctx.fillText(mp.name, lx, ly+h*0.05);
                        
                        // Draw tolerance (line 3)
                        if (tolText) {
                            ctx.font=`400 ${12*scale}px sans-serif`;
                            ctx.fillStyle='#6c757d';
                            ctx.fillText(tolText, lx, ly+h*0.3);
                        }
                    }
                });
                const qr=(cRec?cRec.QRCode:dom.qrCodeInput.value), dt=(cRec?new Date(cRec.Timestamp):new Date()).toLocaleDateString();
                const drawMeta=(txt,p)=>{
                    if(!p)return;
                    const x=p.x*scale+ox, y=p.y*scale+oy;
                    ctx.font=`600 ${16*scale}px sans-serif`;
                    const m=ctx.measureText(txt), w=m.width+16*scale, h=32*scale;
                    ctx.fillStyle='white';
                    ctx.strokeStyle='#6c757d';
                    ctx.lineWidth=2*scale;
                    ctx.beginPath();
                    ctx.roundRect(x-w/2,y-h/2,w,h,[8*scale]);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle='#0B0F10';
                    ctx.textAlign='center';
                    ctx.textBaseline='middle';
                    ctx.fillText(txt,x,y);
                };
                if(cMap.meta.showQR&&qr) drawMeta(`QR: ${qr}`,cMap.meta.qrLabelPos);
                if(cMap.meta.showDate) drawMeta(dt,cMap.meta.dateLabelPos);
                cv.toBlob(async (b) => {
                    // ✅ NEW: Use custom fileName if provided
                    const fn = fileName || `${qr||'viz'}.png`;
                    if(saveToFile) {
                        try {
                            await writeFile(await getOrCreateFile(await getOrCreateDir(await getOrCreateDir(appState.projectRootHandle,'exports'),'visualizations'),fn),b);
                            if(showAlertOnSuccess) alert(t('exportSuccess'));
                        } catch(e){
                            reject(e);
                        }
                    } else {
                        const a=document.createElement('a');
                        a.href=URL.createObjectURL(b);
                        a.download=fn;
                        a.click();
                        URL.revokeObjectURL(a.href);
                        if(showAlertOnSuccess) alert(t('exportSuccess'));
                    }
                    resolve();
                }, 'image/png');
            };
            img.onerror = () => reject("Img load error");
            img.src = bgUrl;
        });
    };

    // ═════════════════════════════════════════════════════════════════════════════
    // GENERATE ALL VISUALIZATION IMAGES (PER-BACKGROUND OVERVIEWS + ZOOMS)
    // ═════════════════════════════════════════════════════════════════════════════
    
    const generateAllVisualizationImages = async (qrCode, schemaName) => {
        console.log(`🎨 Generating all visualization images for QR: ${qrCode}`);
        
        try {
            const mapData = appState.data.currentMap;
            if (!mapData) throw new Error("No map data");
            
            // 1. Collect unique backgrounds
            const uniqueBackgrounds = new Set();
            
            // Add global background
            if (mapData.meta.globalBackground) {
                uniqueBackgrounds.add(mapData.meta.globalBackground);
            }
            
            // Add MP-specific backgrounds
            mapData.points.forEach(mp => {
                if (mp.backgroundId) {
                    uniqueBackgrounds.add(mp.backgroundId);
                }
            });
            
            console.log(`📊 Found ${uniqueBackgrounds.size} unique backgrounds`);
            
            // 2. Generate overview for each background
            for (const bgId of uniqueBackgrounds) {
                const bg = mapData.meta.backgrounds.find(b => b.id === bgId);
                if (!bg) continue;
                
                // Filter MPs for this background
                const mpsForThisBg = mapData.points.filter(mp => {
                    if (bgId === mapData.meta.globalBackground) {
                        return !mp.backgroundId;
                    } else {
                        return mp.backgroundId === bgId;
                    }
                });
                
                console.log(`🖼️ Generating overview for ${bg.name}: ${mpsForThisBg.length} MPs`);
                
                // Export overview (zoom 1x, all MPs for this background)
                await exportPNG({
                    recordData: appState.data.db[appState.data.db.length - 1],
                    mapData: mapData,
                    saveToFile: true,
                    showAlertOnSuccess: false,
                    backgroundId: bgId,
                    visibleMPs: mpsForThisBg,
                    fileName: `${qrCode}_overview_${bg.name.replace(/\s/g, '_')}.png`,
                    view: { scale: 1, offsetX: 0, offsetY: 0 }
                });
            }
            
            // 3. Generate zoom for each MP with saved view
            for (const mp of mapData.points) {
                if (!mp.view || !mp.view.scale) continue; // Skip MPs without saved view
                
                const bgId = mp.backgroundId || mapData.meta.globalBackground;
                const bg = mapData.meta.backgrounds.find(b => b.id === bgId);
                if (!bg) continue;
                
                console.log(`🔍 Generating zoom for ${mp.id} on ${bg.name}`);
                
                await exportPNG({
                    recordData: appState.data.db[appState.data.db.length - 1],
                    mapData: mapData,
                    saveToFile: true,
                    showAlertOnSuccess: false,
                    backgroundId: bgId,
                    visibleMPs: [mp],
                    fileName: `${qrCode}_${mp.id}.png`,
                    view: mp.view
                });
            }
            
            console.log(`✅ All visualization images generated`);
            
        } catch (error) {
            console.error('❌ Error generating visualization images:', error);
            throw error;
        }
    };

    // ═════════════════════════════════════════════════════════════════════════════
    // AUTO-GENERATE ZOOM IMAGES FROM OVERVIEW + SCHEMA VIEW COORDINATES (OLD)
    // ═════════════════════════════════════════════════════════════════════════════

    // =========================================
    // [SECTION] FORMULA ENGINE
    // =========================================
    /**
     * Evaluate a formula with security checks
     * @param {string} formula - Formula starting with '='
     * @param {Object} rowData - Data context for column references
     * @returns {string|number} - Evaluated result or '#ERROR!'
     */
    const evaluateFormula = (formula, rowData) => {
        if (!formula.startsWith('=')) return formula;

        let expression = formula.substring(1).trim();

        // Security: Limit formula length to prevent DoS
        if (expression.length > 1000) {
            console.error("Formula too long (max 1000 chars):", expression.length);
            return "#ERROR!";
        }

        expression = expression.replace(/\[(.*?)\]/g, (match, colName) => {
            const val = rowData[colName.trim()];
            const num = parseFloat(val?.replace(',', '.'));
            return isNaN(num) ? `"${val}"` : num;
        });
        
        const functionCalls = expression.match(/[a-zA-Z_]+\(/g) || [];
        const allowedFunctions = ['SQRT', 'POW', 'ABS', 'ROUND', 'SIN', 'COS', 'TAN', 'CONCAT', 'IF'];
        
        const isSafe = functionCalls.every(call => allowedFunctions.includes(call.slice(0, -1).toUpperCase()));
        if (!isSafe) {
             console.error("Unsafe function in formula:", expression);
             return "#ERROR!";
        }

        try {
            const evaluator = new Function('SQRT', 'POW', 'ABS', 'ROUND', 'SIN', 'COS', 'TAN', 'CONCAT', 'IF', `return ${expression}`);
            const result = evaluator(Math.sqrt, Math.pow, Math.abs, Math.round, Math.sin, Math.cos, Math.tan, (...args) => args.join(''), (cond, t, f) => cond ? t : f);
            return result;
        } catch (e) {
            console.error("Formula evaluation error:", e);
            return '#ERROR!';
        }
    };

    // =========================================
    // [SECTION] FORMULA SUGGESTIONS
    // =========================================
    const AVAILABLE_FUNCTIONS = [
        { name: 'SQRT', description: 'Calculates the square root.' },
        { name: 'POW', description: 'Raises a number to a power.' },
        { name: 'ABS', description: 'Returns the absolute value.' },
        { name: 'ROUND', description: 'Rounds a number.' },
        { name: 'SIN', description: 'Calculates the sine.' },
        { name: 'COS', description: 'Calculates the cosine.' },
        { name: 'TAN', description: 'Calculates the tangent.' },
        { name: 'IF', description: 'Conditional statement.' },
        { name: 'CONCAT', description: 'Joins strings together.' },
    ];

    const getCaretPositionInfo = (element) => {
        try {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                // Fallback to end of content
                const text = element.textContent || '';
                return { position: text.length, textBefore: text };
            }
            
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            
            const position = preCaretRange.toString().length;
            const textBefore = (element.textContent || '').substring(0, position);
            
            return { position, textBefore };
        } catch (err) {
            console.error('Error getting caret position:', err);
            // Fallback
            const text = element.textContent || '';
            return { position: text.length, textBefore: text };
        }
    };

    /**
     * Update formula suggestions based on current cell content and caret position
     * Triggers on: empty field, typing '=', '[', ']', or any character while in formula mode
     * @param {HTMLElement} cell - The editable cell element
     */
    const updateFormulaSuggestions = (cell) => {
        if (!cell) return;
        
        try {
            const { textBefore } = getCaretPositionInfo(cell);
            const formula = cell.textContent || '';

            // If empty field (trim and check for zero-width characters), show default function list
            if (formula.replace(/\s/g, '').length === 0) {
                const suggestions = AVAILABLE_FUNCTIONS.map(f => ({ ...f, type: 'function' }));
                showSuggestions(suggestions, cell);
                return;
            }

            // Must start with '=' for formula mode
            if (!formula.startsWith('=')) {
                hideSuggestions();
                return;
            }

            const openBracketIndex = textBefore.lastIndexOf('[');
            const closeBracketIndex = textBefore.lastIndexOf(']');
            
            // Inside a column reference [...]
            if (openBracketIndex > closeBracketIndex) {
                const filter = textBefore.substring(openBracketIndex + 1);
                const suggestions = appState.data.dbHeaders
                    .filter(h => !READONLY_COLS.includes(h) && h.toLowerCase().includes(filter.toLowerCase()))
                    .map(h => ({ name: h, type: 'column' }));
                showSuggestions(suggestions, cell);
            } else {
                // Outside a column tag, suggest functions
                const lastWordMatch = textBefore.match(/(\w+)$/);
                const filter = lastWordMatch ? lastWordMatch[1] : '';
                const suggestions = AVAILABLE_FUNCTIONS
                    .filter(f => f.name.toLowerCase().startsWith(filter.toLowerCase()))
                    .map(f => ({ ...f, type: 'function' }));
                showSuggestions(suggestions, cell);
            }
        } catch (err) {
            console.error('Error updating formula suggestions:', err);
            hideSuggestions();
        }
    };
    
    /**
     * Show suggestions popup near the active cell
     * Positions dynamically and adds fade-in animation
     * @param {Array} items - Array of suggestion items {name, type, description?}
     * @param {HTMLElement} cell - The target cell element
     */
    const showSuggestions = (items, cell) => {
        const popup = dom.formulaSuggestions;
        if (!popup || !cell) {
            console.warn('showSuggestions: missing popup or cell element');
            return;
        }

        appState.ui.formulaSuggestions.items = items;
        appState.ui.formulaSuggestions.activeIndex = -1;
        appState.ui.formulaSuggestions.targetCell = cell;

        if (items.length === 0) {
            hideSuggestions();
            return;
        }

        // Render suggestions with type indicator
        popup.innerHTML = items.map(item => `
            <div class="suggestion-item" data-value="${item.name}">
                <span class="suggestion-name">${item.name}</span>
                ${item.type === 'column' ? '<span class="suggestion-type">[Column]</span>' : ''}
                ${item.description ? `<span class="suggestion-desc">${item.description}</span>` : ''}
            </div>
        `).join('');

        // Position tooltip directly below the cell, accounting for scroll
        try {
            const cellRect = cell.getBoundingClientRect();
            const scrollContainer = dom.dbTable.parentElement;
            const modalBody = scrollContainer ? scrollContainer.parentElement : null;
            
            if (!scrollContainer || !modalBody) {
                // Fallback: position relative to viewport, directly below cell
                popup.style.left = `${cellRect.left}px`;
                popup.style.top = `${cellRect.bottom + 2}px`; // 2px gap below cell
            } else {
                const modalBodyRect = modalBody.getBoundingClientRect();
                // Position relative to modal body
                // cellRect already accounts for scroll (viewport coordinates)
                // so we just need to convert from viewport to modalBody coordinates
                const left = cellRect.left - modalBodyRect.left;
                const top = cellRect.bottom - modalBodyRect.top + 2; // 2px gap
                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;
            }
        } catch (err) {
            console.error('Error positioning suggestions popup:', err);
            // Fallback: position relative to viewport
            const cellRect = cell.getBoundingClientRect();
            popup.style.left = `${cellRect.left}px`;
            popup.style.top = `${cellRect.bottom + 2}px`;
        }

        popup.style.display = 'block';
        
        // Ensure visible class is added after display is set
        // Use double requestAnimationFrame for better browser compatibility
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                popup.classList.add('visible');
                appState.ui.formulaSuggestions.visible = true;
            });
        });
    };

    /**
     * Hide suggestions popup with fade-out animation
     */
    const hideSuggestions = () => {
        const popup = dom.formulaSuggestions;
        if (!popup) return;
        
        // Set state first to prevent race conditions
        appState.ui.formulaSuggestions.visible = false;
        appState.ui.formulaSuggestions.items = [];
        appState.ui.formulaSuggestions.activeIndex = -1;
        
        popup.classList.remove('visible');
        
        // Use requestAnimationFrame for better responsiveness
        requestAnimationFrame(() => {
            // Double-check state hasn't changed
            if (!appState.ui.formulaSuggestions.visible) {
                popup.style.display = 'none';
            }
        });
    };

    /**
     * Handle keyboard navigation within suggestions popup
     * Supports: ArrowDown, ArrowUp, Tab, Escape
     * Note: Enter key is handled separately to allow confirming formulas
     * @param {KeyboardEvent} e - The keyboard event
     * @returns {boolean} - True if event was handled, false otherwise
     */
    const handleSuggestionNavigation = (e) => {
        const { visible, items, activeIndex } = appState.ui.formulaSuggestions;
        if (!visible || items.length === 0) return false;

        let newIndex = activeIndex;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = (activeIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = (activeIndex - 1 + items.length) % items.length;
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (activeIndex > -1) {
                insertSuggestion();
            } else if (items.length === 1) {
                // Auto-select if only one option
                appState.ui.formulaSuggestions.activeIndex = 0;
                insertSuggestion();
            } else {
                // Select first item by default
                newIndex = 0;
                appState.ui.formulaSuggestions.activeIndex = newIndex;
                const suggestions = dom.formulaSuggestions.querySelectorAll('.suggestion-item');
                suggestions[newIndex].classList.add('active');
                // On second press, insert
                return true;
            }
            return true;
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideSuggestions();
            return true;
        }

        if (newIndex !== activeIndex) {
            const suggestions = dom.formulaSuggestions.querySelectorAll('.suggestion-item');
            if(activeIndex > -1 && suggestions[activeIndex]) {
                suggestions[activeIndex].classList.remove('active');
            }
            if(suggestions[newIndex]) {
                suggestions[newIndex].classList.add('active');
                // Scroll into view if needed
                suggestions[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            appState.ui.formulaSuggestions.activeIndex = newIndex;
        }
        return true;
    };

    /**
     * Insert selected suggestion into the cell
     * Handles both function and column suggestions with proper cursor positioning
     */
    const insertSuggestion = () => {
        const { items, activeIndex, targetCell } = appState.ui.formulaSuggestions;
        if (activeIndex < 0 || !targetCell || !items || !items[activeIndex]) {
            console.warn('insertSuggestion: invalid state');
            return;
        }

        try {
            const selectedItem = items[activeIndex];
            const { textBefore } = getCaretPositionInfo(targetCell);
            const currentText = targetCell.textContent || '';
            
            let textToInsert = '';
            let textToReplace = '';
            let cursorOffset = 0;

            if (selectedItem.type === 'column') {
                // Replace everything from [ to current position
                const openBracketIndex = textBefore.lastIndexOf('[');
                textToReplace = textBefore.substring(openBracketIndex);
                textToInsert = `[${selectedItem.name}]`;
                cursorOffset = 0; // Place cursor after ]
            } else {
                // Function suggestion
                // If we're in an empty field or just typed '=', prepend '=' if needed
                if (currentText.replace(/\s/g, '').length === 0) {
                    textToReplace = '';
                    textToInsert = `=${selectedItem.name}()`;
                    cursorOffset = -1; // Place cursor between ()
                } else {
                    const lastWordMatch = textBefore.match(/(\w+)$/);
                    textToReplace = lastWordMatch ? lastWordMatch[1] : '';
                    textToInsert = `${selectedItem.name}()`;
                    cursorOffset = -1; // Place cursor between ()
                }
            }
            
            const textAfter = currentText.substring(textBefore.length);
            const newText = currentText.substring(0, textBefore.length - textToReplace.length) + textToInsert + textAfter;
            
            targetCell.textContent = newText;

            // Set cursor position with enhanced error handling
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                const newCaretPos = textBefore.length - textToReplace.length + textToInsert.length + cursorOffset;
                
                // Ensure we have a text node
                if (targetCell.childNodes.length === 0) {
                    targetCell.appendChild(document.createTextNode(newText));
                }
                
                if (targetCell.childNodes.length > 0 && targetCell.childNodes[0].nodeType === Node.TEXT_NODE) {
                    const textNode = targetCell.childNodes[0];
                    const safePos = Math.max(0, Math.min(newCaretPos, textNode.length));
                    range.setStart(textNode, safePos);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            } catch (e) {
                console.error('Error setting cursor position:', e);
                // Fallback: just focus the cell
                targetCell.focus();
            }

            // Trigger update to show next suggestions if needed
            setTimeout(() => {
                updateFormulaSuggestions(targetCell);
            }, 50);
        } catch (err) {
            console.error('Error inserting suggestion:', err);
        }
    };

    // =========================================
    // [SECTION] DB & ANALYSIS
    // =========================================
    const parseCSV = (text) => {
        const rows = text.trim().split(/\r?\n/).filter(r => r);
        if(rows.length<1) {
            appState.data.dbHeaders=[];
            appState.data.db=[];
            return;
        }
        appState.data.dbHeaders = rows[0].split(';');
        appState.data.db = rows.slice(1).map(r => {
            const v=r.split(';');
            return appState.data.dbHeaders.reduce((o,h,i)=>({...o,[h]:v[i]||''}),{});
        });
    };
   
    const serializeCSV = (h, d) => [h.join(';'), ...d.map(r => h.map(k => r[k]||'').join(';'))].join('\n');

    const toggleDbViewer = (open) => {
        appState.ui.isDbViewerOpen = open;
        dom.dbViewerModal.classList.toggle('open', open);
        if (open) {
            renderDbViewer();
        } else {
            hideSuggestions();
        }
    };
    
    // --- DB Viewer Rendering and Interactions ---
    const renderDbViewer = () => {
        const tableEl = dom.dbTable;
        tableEl.innerHTML = '';
        
        // --- Render Header ---
        const thead = tableEl.createTHead();
        const headerRow = thead.insertRow();
        if (appState.data.dbHeaders) {
            appState.data.dbHeaders.forEach((headerText, index) => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.dataset.columnIndex = index;

                const isReadOnly = READONLY_COLS.includes(headerText);
                if (!isReadOnly) {
                    th.classList.add('draggable');
                    th.draggable = true;
                    th.addEventListener('dragstart', handleDbColumnDragStart);
                    th.addEventListener('dragenter', (e) => e.preventDefault());
                    th.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        document.querySelectorAll('th.drag-over').forEach(t => t.classList.remove('drag-over'));
                        th.classList.add('drag-over');
                    });
                    th.addEventListener('dragleave', () => th.classList.remove('drag-over'));
                    th.addEventListener('drop', handleDbColumnDrop);
                    th.addEventListener('dragend', () => th.classList.remove('dragging'));
                    th.addEventListener('contextmenu', (e) => showDbHeaderContextMenu(e, headerText));
                }
                if (appState.data.columnFormulas[headerText]) {
                    th.innerHTML += ' <span class="fx-icon">fx</span>';
                }
                headerRow.appendChild(th);
            });
        }

        const actionsTh = document.createElement('th');
        actionsTh.textContent = t('actions');
        headerRow.appendChild(actionsTh);
        
        const addColTh = document.createElement('th');
        addColTh.style.textAlign = 'center';
        const addBtn = document.createElement('button');
        addBtn.textContent = '+';
        addBtn.className = 'btn btn-secondary';
        addBtn.style.height = '24px';
        addBtn.style.padding = '0 8px';
        addBtn.addEventListener('click', addNewDbColumn);
        addColTh.appendChild(addBtn);
        headerRow.appendChild(addColTh);

        // --- Render Body ---
        const tbody = tableEl.createTBody();
        const filteredData = appState.data.db.slice().sort((a,b)=>new Date(b.Timestamp)-new Date(a.Timestamp));
        
        filteredData.forEach((r, rowIndex) => {
            const row = tbody.insertRow();
            row.dataset.recordId = r.RecordId;
            
            if (appState.data.dbHeaders) {
                appState.data.dbHeaders.forEach((k, colIndex) => {
                    const c = row.insertCell();
                    const cellValue = r[k] || '';
                    c.textContent = cellValue;
                    
                    if (cellValue === '#ERROR!') c.classList.add('formula-error');

                    if(!READONLY_COLS.includes(k)) {
                        c.contentEditable=true;
                        c.dataset.header=k;
                        
                        // Show suggestions immediately on focus (always, not just when empty)
                        c.addEventListener('focus', () => {
                            updateFormulaSuggestions(c);
                        });
                        
                        // Handle character input - primary trigger for updates
                        c.addEventListener('input', (e) => {
                            // Input event handles all text changes, no need for redundant keyup
                            updateFormulaSuggestions(c);
                        });
                        
                        c.addEventListener('keydown', (e) => {
                            // Handle Enter key specially - insert suggestion if one is selected, otherwise apply formula
                            if (e.key === 'Enter' && !e.shiftKey) {
                                const { visible, items, activeIndex } = appState.ui.formulaSuggestions;
                                
                                // If suggestions are visible and an item is selected, insert it
                                if (visible && items.length > 0 && activeIndex > -1) {
                                    e.preventDefault();
                                    insertSuggestion();
                                    return;
                                }
                                
                                // Otherwise, apply formula or navigate
                                e.preventDefault();
                                const formula = c.textContent;
                                if (formula && formula.startsWith('=')) {
                                    // Hide suggestions before applying
                                    hideSuggestions();
                                    applyFormulaToColumn(k, formula);
                                } else {
                                    hideSuggestions();
                                    const nextRow = row.parentElement.rows[rowIndex + 1];
                                    if (nextRow) {
                                        nextRow.cells[colIndex]?.focus();
                                    }
                                }
                                return;
                            }
                            
                            // Handle other navigation keys (arrows, Tab, Escape)
                            if (handleSuggestionNavigation(e)) {
                                e.stopImmediatePropagation();
                                return;
                            }
                        });
                        
                        // Use longer delay to avoid conflict with mousedown on suggestions
                        c.addEventListener('blur', () => setTimeout(hideSuggestions, 200));
                    } else {
                        c.classList.add('readonly-col');
                    }
                    if(k==='QRCode') c.dataset.qrCodeForSearch=(r[k]||'').toLowerCase();
                });
            }
            row.insertCell().className='db-table-actions-cell';
            row.lastElementChild.innerHTML = `<button class="db-export-btn" title="${t('exportPNG')}">📷</button><button class="db-delete-btn" title="${t('deleteSchema')}">🗑️</button>`;
        });
    };

    const handleDbColumnDragStart = (e) => {
        appState.ui.dbDraggedColumnIndex = parseInt(e.target.dataset.columnIndex, 10);
        e.target.classList.add('dragging');
    };
    
    const handleDbColumnDrop = (e) => {
        e.preventDefault();
        const fromIndex = appState.ui.dbDraggedColumnIndex;
        const toTh = e.target.closest('th.draggable');
        if (!toTh) return;
        const toIndex = parseInt(toTh.dataset.columnIndex, 10);

        document.querySelectorAll('th.drag-over').forEach(th => th.classList.remove('drag-over'));
        
        if (fromIndex !== toIndex) {
            const headers = appState.data.dbHeaders;
            const [movedHeader] = headers.splice(fromIndex, 1);
            headers.splice(toIndex, 0, movedHeader);
            renderDbViewer();
        }
    };
    
    const showDbHeaderContextMenu = (e, headerText) => {
        e.preventDefault();
        hideSuggestions(); // Hide formula suggestions if open
        const menu = dom.dbHeaderContextMenu;
        menu.style.display = 'block';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        
        appState.ui.dbHeaderContextMenu = { visible: true, target: headerText, x: e.pageX, y: e.pageY };
        
        const deleteItem = menu.querySelector('[data-action="delete"]');
        deleteItem.classList.toggle('disabled', READONLY_COLS.includes(headerText));
    };

    const hideDbHeaderContextMenu = () => {
        dom.dbHeaderContextMenu.style.display = 'none';
        appState.ui.dbHeaderContextMenu.visible = false;
    };

    const addNewDbColumn = () => {
        const colName = prompt("Enter new column name:");
        if (colName && !appState.data.dbHeaders.includes(colName)) {
            appState.data.dbHeaders.push(colName);
            appState.data.db.forEach(row => row[colName] = '');
            renderDbViewer();
        } else if (colName) {
            alert("Column name already exists.");
        }
    };

    const renameDbColumn = (oldName, newName) => {
        const index = appState.data.dbHeaders.indexOf(oldName);
        if (index > -1 && newName && !appState.data.dbHeaders.includes(newName)) {
            appState.data.dbHeaders[index] = newName;
            appState.data.db.forEach(row => {
                row[newName] = row[oldName];
                delete row[oldName];
            });
            if (appState.data.columnFormulas[oldName]) {
                appState.data.columnFormulas[newName] = appState.data.columnFormulas[oldName];
                delete appState.data.columnFormulas[oldName];
            }
            renderDbViewer();
        } else if (newName) {
            alert("New column name is invalid or already exists.");
        }
    };

    const deleteDbColumn = (colName) => {
        if (READONLY_COLS.includes(colName)) return;
        if (confirm(`Are you sure you want to delete the column "${colName}" and all its data?`)) {
            appState.data.dbHeaders = appState.data.dbHeaders.filter(h => h !== colName);
            appState.data.db.forEach(row => delete row[colName]);
            delete appState.data.columnFormulas[colName];
            renderDbViewer();
        }
    };
    
    const applyFormulaToColumn = (colName, formula) => {
        if (formula.trim() === '=' || formula.trim() === '') {
            delete appState.data.columnFormulas[colName];
        } else {
            appState.data.columnFormulas[colName] = formula;
        }
        
        appState.data.db.forEach(row => {
            row[colName] = evaluateFormula(formula, row);
        });
        renderDbViewer();
    };

    const saveDbChanges = async () => {
        try {
            dom.dbTable.querySelectorAll('td[contenteditable]').forEach(c => {
                const r = appState.data.db.find(rec => rec.RecordId === c.closest('tr').dataset.recordId);
                if(r) r[c.dataset.header] = c.textContent;
            });
            for (const [colName, formula] of Object.entries(appState.data.columnFormulas)) {
                 appState.data.db.forEach(row => {
                    row[colName] = evaluateFormula(formula, row);
                });
            }

            await writeFile(appState.fileHandles.db, serializeCSV(appState.data.dbHeaders, appState.data.db));
            alert(t('saveSuccess'));
        } catch(e) {
            console.error(e);
            alert(t('saveError'));
        }
    };

    const openAnalysis = () => {
        if (appState.data.db.length === 0) {
            alert("Database empty.");
            return;
        }
        appState.ui.hiddenRecordIds.clear();
        dom.chartResetViewBtn.classList.add('hidden');
        appState.ui.analysisMode = 'trend';
        dom.analysisModeSelector.querySelector('input[value="trend"]').checked = true;
        updateAnalysisUI();
        dom.analysisModal.classList.add('open');
    };
   
    const updateAnalysisUI = () => {
        appState.ui.analysisMode = dom.analysisModeSelector.querySelector('input:checked').value;
        dom.analysisFilterGroupTrend.classList.toggle('hidden', appState.ui.analysisMode !== 'trend');
        dom.analysisFilterGroupProfile.classList.toggle('hidden', appState.ui.analysisMode === 'trend');
        dom.mpListContainer.classList.toggle('hidden', appState.ui.analysisMode !== 'trend');
        if (appState.ui.chartInstance) appState.ui.chartInstance.destroy();
        if (appState.ui.analysisMode === 'trend') {
            populateAnalysisFilters();
            filterAnalysisData();
            populateAnalysisMPs();
        } else {
            updateProfileRecordSelector();
        }
        generateChart();
    };
   
    const populateAnalysisFilters = () => {
        dom.analysisSchemasList.innerHTML = [...new Set(appState.data.db.map(i => i.SchemaName))].map(s => `<label><input type="checkbox" name="schema" value="${s}" checked> ${s}</label>`).join('');
    };
   
    const filterAnalysisData = () => {
        const df = dom.analysisDateFrom.valueAsDate, dt = dom.analysisDateTo.valueAsDate, qr = dom.analysisQrSearch.value.toLowerCase(), schemas = [...dom.analysisSchemasList.querySelectorAll('input:checked')].map(e=>e.value);
        appState.data.analysisData = appState.data.db.filter(r => {
            const rd = new Date(r.Timestamp);
            return (!df || rd >= df) && (!dt || rd < new Date(dt.getTime() + 86400000)) && (!qr || r.QRCode.toLowerCase().includes(qr)) && schemas.includes(r.SchemaName);
        });
    };
   
    const populateAnalysisMPs = () => {
        const h = appState.data.analysisData.reduce((acc, r) => new Set([...acc, ...Object.keys(r)]), new Set());
        dom.analysisMpsList.innerHTML = [...h].filter(k => k.endsWith('_Value')).sort().map(k => {
            const mp = k.replace('_Value','');
            return `<div class="mp-selection-item"><label><input type="checkbox" name="mp" value="${mp}" checked data-mp="${mp}"> ${mp}</label><input type="checkbox" class="mp-tolerance-toggle" data-mp="${mp}"> Tol.</div>`;
        }).join('');
        dom.analysisMpsList.querySelectorAll('input').forEach(el => el.addEventListener('change', generateChart));
    };
   
    const updateProfileRecordSelector = () => {
        const df = dom.analysisProfileDateFrom.valueAsDate, dt = dom.analysisProfileDateTo.valueAsDate;
        const recs = appState.data.db.filter(r => {
            const rd = new Date(r.Timestamp);
            return (!df || rd >= df) && (!dt || rd < new Date(dt.getTime() + 86400000));
        }).sort((a,b)=>new Date(b.Timestamp)-new Date(a.Timestamp));
        dom.analysisRecordSelect.innerHTML = recs.map(r => `<option value="${r.RecordId}">${r.QRCode} (${new Date(r.Timestamp).toLocaleString()})</option>`).join('');
       
        if (recs.length > 0 && dom.analysisRecordSelect.selectedOptions.length === 0) {
            dom.analysisRecordSelect.selectedIndex = 0;
        }
       
        generateChart();
    };
   
    const generateChart = () => {
        if (appState.ui.chartInstance) appState.ui.chartInstance.destroy();
        const ctx = dom.analysisChart.getContext('2d'), mode = appState.ui.analysisMode;
        let data, labels, datasets = [];
        if (mode === 'trend') {
            data = appState.data.analysisData.filter(r => !appState.ui.hiddenRecordIds.has(r.RecordId));
            labels = data.map(r => r.QRCode);
            const mps = [...dom.analysisMpsList.querySelectorAll('input[name="mp"]:checked')].map(e=>e.value), tols = [...dom.analysisMpsList.querySelectorAll('.mp-tolerance-toggle:checked')].map(e=>e.dataset.mp);
            mps.forEach((mp,i) => {
                const col = ['#007aff','#ff9500','#34c759'][i%3];
                datasets.push({
                    label: mp,
                    data: data.map(r => parseFloat(r[`${mp}_Value`]?.replace(',','.'))||null),
                    borderColor: col,
                    backgroundColor: col+'80',
                    tension: 0.1,
                    spanGaps:true
                });
                if(tols.includes(mp) && data[0]) {
                     datasets.push({
                         label: `${mp} Nom`,
                         data: Array(data.length).fill(parseFloat(data[0][`${mp}_Nominal`]?.replace(',','.'))),
                         borderColor: 'green',
                         borderDash:[5,5],
                         pointRadius:0,
                         fill:false
                     });
                     datasets.push({
                         label: `${mp} Min`,
                         data: Array(data.length).fill(parseFloat(data[0][`${mp}_Min`]?.replace(',','.'))),
                         borderColor: 'orange',
                         borderDash:[5,5],
                         pointRadius:0,
                         fill:false
                     });
                     datasets.push({
                         label: `${mp} Max`,
                         data: Array(data.length).fill(parseFloat(data[0][`${mp}_Max`]?.replace(',','.'))),
                         borderColor: 'red',
                         borderDash:[5,5],
                         pointRadius:0,
                         fill:false
                     });
                }
            });
        } else {
             const recs = [...dom.analysisRecordSelect.selectedOptions].map(o=>appState.data.db.find(r=>r.RecordId===o.value)).filter(r=>r);
             if(recs.length===0) return;
             const keys = new Set();
             recs.forEach(r => Object.keys(r).forEach(k => { if(k.endsWith('_Value')) keys.add(k.replace('_Value','')); }));
             labels = [...keys].sort();
             recs.forEach((r,i) => {
                 const col = ['#007aff','#ff9500'][i%2];
                 datasets.push({
                     label: r.QRCode,
                     data: labels.map(l => parseFloat(r[`${l}_Value`]?.replace(',','.'))||null),
                     borderColor: col,
                     backgroundColor: col+'80',
                     spanGaps:true
                 });
             });
             if(recs[0]) {
                 datasets.push({
                     label: t('nominal'),
                     data: labels.map(l => parseFloat(recs[0][`${l}_Nominal`]?.replace(',','.'))),
                     borderColor: 'green',
                     borderDash:[5,5],
                     pointRadius:0
                 });
                 datasets.push({
                     label: t('min'),
                     data: labels.map(l => parseFloat(recs[0][`${l}_Min`]?.replace(',','.'))),
                     borderColor: 'orange',
                     borderDash:[5,5],
                     pointRadius:0
                 });
                 datasets.push({
                     label: t('max'),
                     data: labels.map(l => parseFloat(recs[0][`${l}_Max`]?.replace(',','.'))),
                     borderColor: 'red',
                     borderDash:[5,5],
                     pointRadius:0
                 });
             }
        }
        appState.ui.chartInstance = new Chart(ctx, {
            type: dom.analysisChartType.value,
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: !!dom.analysisAxisX.value, text: dom.analysisAxisX.value } },
                    y: { title: { display: !!dom.analysisAxisY.value, text: dom.analysisAxisY.value } }
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            mode: 'x',
                            onZoomComplete: () => dom.chartResetViewBtn.classList.remove('hidden')
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                            onPanComplete: () => dom.chartResetViewBtn.classList.remove('hidden')
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (c) => {
                                let l = c.dataset.label||'';
                                if(l)l+=': ';
                                if(c.parsed.y!==null)l+=formatNumber(c.parsed.y);
                                return l;
                            }
                        }
                    }
                },
                onClick: (e, el, chart) => {
                    if(mode==='trend'&&el.length>0&&data&&data[el[0].index]) {
                        appState.ui.hiddenRecordIds.add(data[el[0].index].RecordId);
                        dom.chartResetViewBtn.classList.remove('hidden');
                        generateChart();
                    }
                }
            }
        });
    };

    // =========================================
    // [SECTION] INIT & EVENTS
    // =========================================
    if (!checkFSAPISupport()) return;
    
    // ✅ Load saved dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    const isDarkMode = savedDarkMode === 'true' || (savedDarkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    updateTheme(isDarkMode);
    console.log(`🎨 Theme initialized: ${isDarkMode ? 'dark' : 'light'} (from localStorage: ${savedDarkMode})`);
    
    // ✅ Priority 2: Fix language toggle - save to localStorage and update UI
    dom.languageToggle.addEventListener('change', (e) => {
        const newLang = e.target.value;
        console.log(`🌐 Language changed to: ${newLang}`);
        appState.ui.language = newLang;
        localStorage.setItem('language', newLang);
        updateUIStrings();
        const count = document.querySelectorAll('[data-i18n]').length;
        console.log(`✅ Updated ${count} UI elements`);
    });

    dom.themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        updateTheme(isDark);
        // ✅ Save dark mode preference to localStorage
        localStorage.setItem('darkMode', isDark.toString());
        console.log(`🎨 Theme toggled to: ${isDark ? 'dark' : 'light'}`);
    });

    async function selectProjectFolder() {
        try {
            // DIRECT picker call (no auto-restore) - force user to choose folder
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            
            // Save to adapter
            const fs = window.fileSystemAdapter;
            fs.projectRoot = handle;
            fs.mode = 'local';
            localStorage.setItem('fsMode', 'local');
            
            appState.fileSystem = fs;
            appState.projectRootHandle = handle;
            
            // Update UI
            dom.projectFolderName.textContent = handle.name;
            dom.btnProjectFolder.classList.remove('needs-action');
            console.log('✅ New folder selected:', handle.name);
            
            // Save to IndexedDB for future auto-restore
            await fs.saveHandleToIndexedDB(handle);
            
            // Load project data
            await scanProjectFolder();
            
            // Save project data to localStorage for Report Studio
            await saveProjectToLocalStorage();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Folder selection failed:', error);
                throw error;
            }
            // User cancelled - not an error, just log it
            console.log('ℹ️ Folder selection cancelled by user');
        }
    }

    dom.btnProjectFolder.addEventListener('click', async () => {
        try {
            await selectProjectFolder();
        } catch (e) {
            console.error('Error selecting project folder:', e);
        }
    });
   
    dom.mapSelect.addEventListener('change', handleMapSelect);
   
    dom.backgroundUploader.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0 && appState.ui.editorState) {
            console.log(`📤 Uploading ${files.length} background(s)...`);
            
            // Initialize backgrounds array if needed
            if (!appState.ui.editorState.meta.backgrounds) {
                appState.ui.editorState.meta.backgrounds = [];
            }
            
            const isFirstBackground = appState.ui.editorState.meta.backgrounds.length === 0;
            let uploadedCount = 0;
            let lastUploadedBgId = null;
            
            for (const f of files) {
                try {
                    // Generate unique ID for this background
                    const bgId = `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const originalName = f.name.replace(/\.[^/.]+$/, ''); // Remove extension
                    const ext = f.name.split('.').pop();
                    const fn = `${bgId}.${ext}`;
                    
                    // Save the file and get the file handle
                    const backgroundsDir = await getOrCreateDir(appState.projectRootHandle, 'backgrounds');
                    const fileHandle = await getOrCreateFile(backgroundsDir, fn);
                    await writeFile(fileHandle, f);
                    
                    // ⭐ Update appState.fileHandles.backgrounds with new handle
                    appState.fileHandles.backgrounds[fn] = fileHandle;
                    console.log(`✅ Added file handle for: ${fn}`);
                    
                    // Add to backgrounds array
                    appState.ui.editorState.meta.backgrounds.push({
                        id: bgId,
                        name: originalName,
                        fileName: fn
                    });
                    
                    lastUploadedBgId = bgId;
                    uploadedCount++;
                    console.log(`✅ Uploaded background: ${originalName} (${fn})`);
                } catch (err) {
                    console.error(`❌ Error uploading background ${f.name}:`, err);
                    alert(`Failed to upload background file: ${f.name}`);
                }
            }
            
            // If this is the first background(s), set the last one as global
            if (isFirstBackground && lastUploadedBgId) {
                appState.ui.editorState.meta.globalBackground = lastUploadedBgId;
                console.log(`🌐 Set global background: ${lastUploadedBgId}`);
            }
            
            if (uploadedCount > 0) {
                appState.ui.editorIsDirty = true;
                renderSchemaInspector();
                
                // Load the global background if set
                const globalBgId = appState.ui.editorState.meta.globalBackground;
                if (globalBgId) {
                    const bg = appState.ui.editorState.meta.backgrounds.find(b => b.id === globalBgId);
                    if (bg) {
                        loadAndDisplayBackground(bg.fileName);
                        console.log(`🖼️ Loaded global background: ${bg.name}`);
                    }
                }
                
                console.log(`✅ Successfully uploaded ${uploadedCount} of ${files.length} backgrounds`);
            }
        }
        // Reset the input so the same file can be selected again
        e.target.value = '';
    });

    dom.btnNewSchema.addEventListener('click', () => toggleEditor(true, true));
    dom.btnEditSchema.addEventListener('click', () => toggleEditor(true, false));
    dom.btnCloseEditor.addEventListener('click', () => {
        if (!appState.ui.editorIsDirty || confirm(t('confirmExitEditor'))) toggleEditor(false);
    });
    dom.editorAddMpBtn.addEventListener('click', addMP);
    dom.btnSaveMap.addEventListener('click', saveMap);
    dom.canvasWrapper.addEventListener('mousedown', onEditorMouseDown);
    // Also attach to SVG and labels container to catch events on their children
    dom.overlaySvg.addEventListener('mousedown', onEditorMouseDown);
    dom.labelsContainer.addEventListener('mousedown', onEditorMouseDown);
    dom.canvasWrapper.addEventListener('wheel', onEditorZoomWheel, { passive: false });
    dom.btnSave.addEventListener('click', saveAndExport);
    dom.qrCodeInput.addEventListener('input', () => renderCanvas());
    dom.btnResetView.addEventListener('click', () => resetCanvasView());
    dom.minimapCanvas.addEventListener('click', () => resetCanvasView());

    dom.btnDbViewer.addEventListener('click', () => toggleDbViewer(true));
    dom.btnCloseDbViewer.addEventListener('click', () => toggleDbViewer(false));
    dom.btnSaveDb.addEventListener('click', saveDbChanges);
    dom.dbSearchInput.addEventListener('input', (e) => {
        const t = e.target.value.toLowerCase();
        dom.dbTable.querySelectorAll('tbody tr').forEach(r => r.style.display = (!r.querySelector('[data-qr-code-for-search]') || r.querySelector('[data-qr-code-for-search]').dataset.qrCodeForSearch.includes(t)) ? '' : 'none');
    });
    dom.dbTable.addEventListener('click', async (e) => {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const rid = tr.dataset.recordId;
        if (e.target.closest('.db-delete-btn')) {
            if (confirm(t('confirmDeleteRecord'))) {
                appState.data.db = appState.data.db.filter(r => r.RecordId !== rid);
                renderDbViewer();
            }
        } else if (e.target.closest('.db-export-btn')) {
            const r = appState.data.db.find(rec => rec.RecordId === rid);
            if (r && appState.fileHandles.maps[`${r.SchemaName}_v${r.SchemaVersion}.map.json`]) {
                try {
                    const md = JSON.parse(await readFile(appState.fileHandles.maps[`${r.SchemaName}_v${r.SchemaVersion}.map.json`]));
                    await exportPNG({recordData:r, mapData:md});
                } catch(e){
                    alert("Export failed");
                }
            }
        }
    });

    // --- Context Menu and Suggestions Logic ---
    dom.dbHeaderContextMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const targetHeader = appState.ui.dbHeaderContextMenu.target;
        if (!action || !targetHeader || e.target.classList.contains('disabled')) return;

        if (action === 'rename') {
            const newName = prompt(`Enter new name for "${targetHeader}":`, targetHeader);
            if (newName) renameDbColumn(targetHeader, newName);
        } else if (action === 'delete') {
            deleteDbColumn(targetHeader);
        } else if (action === 'formula') {
            const formula = prompt(`Enter formula for column "${targetHeader}":\n(e.g., =[Col1] + [Col2])`, appState.data.columnFormulas[targetHeader] || '=');
            if (formula !== null) applyFormulaToColumn(targetHeader, formula);
        }
        hideDbHeaderContextMenu();
    });

    dom.formulaSuggestions.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        const item = e.target.closest('.suggestion-item');
        if(item) {
            const allItems = [...dom.formulaSuggestions.querySelectorAll('.suggestion-item')];
            appState.ui.formulaSuggestions.activeIndex = allItems.indexOf(item);
            insertSuggestion();
        }
    });

    document.addEventListener('click', (e) => {
        if (appState.ui.dbHeaderContextMenu.visible && !dom.dbHeaderContextMenu.contains(e.target)) {
            hideDbHeaderContextMenu();
        }
    });

    dom.btnAnalysis.addEventListener('click', openAnalysis);
    dom.btnCloseAnalysisModal.addEventListener('click', () => dom.analysisModal.classList.remove('open'));
    dom.analysisModeSelector.addEventListener('change', updateAnalysisUI);
    [dom.analysisChartBgToggle, dom.analysisChartBgColor, dom.analysisChartType, dom.analysisChartTitle, dom.analysisAxisX, dom.analysisAxisY].forEach(el => el.addEventListener('input', generateChart));
    [dom.analysisRecordSelect, dom.analysisProfileDateFrom, dom.analysisProfileDateTo].forEach(el => el.addEventListener('input', updateProfileRecordSelector));
    [dom.analysisDateFrom, dom.analysisDateTo, dom.analysisQrSearch].forEach(el => el.addEventListener('input', () => {
        filterAnalysisData();
        populateAnalysisMPs();
        generateChart();
    }));
    dom.analysisSchemasList.addEventListener('change', () => {
        filterAnalysisData();
        populateAnalysisMPs();
        generateChart();
    });
    dom.btnExportPNG.addEventListener('click', () => {
        if(appState.ui.chartInstance) {
            const a=document.createElement('a');
            a.href=appState.ui.chartInstance.toBase64Image();
            a.download='chart.png';
            a.click();
        }
    });
    dom.btnExportCSV.addEventListener('click', () => {
        const d = appState.ui.analysisMode === 'trend' ? appState.data.analysisData : appState.data.db.filter(r => [...dom.analysisRecordSelect.selectedOptions].map(o => o.value).includes(r.RecordId));
        if(d.length>0) {
            const a=document.createElement('a');
            a.href=URL.createObjectURL(new Blob([serializeCSV(Object.keys(d[0]), d)], {type:'text/csv'}));
            a.download='analysis_export.csv';
            a.click();
            // Revoke the blob URL after triggering download to prevent memory leaks
            URL.revokeObjectURL(a.href);
        } else alert("No data");
    });
    dom.chartResetViewBtn.addEventListener('click', () => {
        if(appState.ui.chartInstance) appState.ui.chartInstance.resetZoom();
        appState.ui.hiddenRecordIds.clear();
        dom.chartResetViewBtn.classList.add('hidden');
        generateChart();
    });

    dom.visualizationBgToggle.addEventListener('change', () => dom.canvasWrapper.style.backgroundColor = dom.visualizationBgToggle.checked ? dom.visualizationBgColor.value : 'transparent');
    dom.visualizationBgColor.addEventListener('input', () => dom.canvasWrapper.style.backgroundColor = dom.visualizationBgToggle.checked ? dom.visualizationBgColor.value : 'transparent');
    new ResizeObserver(syncOverlayDimensions).observe(dom.canvasWrapper);
    if (!appState.projectRootHandle) dom.btnProjectFolder.classList.add('needs-action');
    
    // ✅ Load saved language preference on page load
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && dom.languageToggle) {
        appState.ui.language = savedLanguage;
        dom.languageToggle.value = savedLanguage;
        console.log(`🌐 Loaded saved language: ${savedLanguage}`);
    }
    
    updateUIStrings();
    
    // Load last used project from localStorage and IndexedDB on startup
    const loadLastProject = async () => {
        try {
            // Try to restore the directory handle from IndexedDB
            const savedHandle = await getHandleFromIndexedDB();
            
            if (savedHandle) {
                // Successfully restored handle with permission
                appState.projectRootHandle = savedHandle;
                dom.projectFolderName.textContent = savedHandle.name;
                dom.btnProjectFolder.classList.remove('needs-action');
                
                console.log('🎉 Auto-restored project folder:', savedHandle.name);
                
                // Scan the project folder to load data
                try {
                    await scanProjectFolder();
                    
                    // Add success indicator
                    const successIcon = document.createElement('span');
                    successIcon.textContent = ' ✓';
                    successIcon.style.color = '#34c759';
                    successIcon.style.fontWeight = 'bold';
                    successIcon.title = 'Folder automatically restored - full access';
                    dom.projectFolderName.appendChild(successIcon);
                    
                } catch (err) {
                    console.error('❌ Error scanning restored folder:', err);
                    // Still show the folder name but indicate it needs attention
                    dom.btnProjectFolder.classList.add('needs-action');
                }
            } else {
                // No saved handle or permission denied - try localStorage for display
                const projectDataStr = localStorage.getItem('measurementProject');
                if (projectDataStr) {
                    const projectData = JSON.parse(projectDataStr);
                    
                    // Clear any existing content first to prevent duplicates
                    dom.projectFolderName.innerHTML = '';
                    
                    // Add project name as text node (safe from XSS)
                    dom.projectFolderName.appendChild(document.createTextNode(projectData.name || 'Unknown Project'));
                    
                    dom.btnProjectFolder.classList.remove('needs-action');
                    
                    const lastAccessDate = new Date(projectData.lastAccess).toLocaleString();
                    console.log(`📁 Last project loaded from localStorage: ${projectData.name} (last access: ${lastAccessDate})`);
                    
                    // Add hint with unique class to prevent duplicates
                    const hint = document.createElement('small');
                    hint.className = 'last-access-hint';
                    hint.textContent = ` (Last accessed: ${lastAccessDate})`;
                    hint.style.color = 'var(--text-secondary)';
                    hint.style.fontSize = '0.8em';
                    hint.style.marginLeft = '8px';
                    dom.projectFolderName.appendChild(hint);
                    
                    // Add helpful message about re-selecting folder
                    const infoIcon = document.createElement('span');
                    infoIcon.textContent = ' ℹ️';
                    infoIcon.title = 'To access database and maps, please re-select the project folder';
                    infoIcon.style.cursor = 'help';
                    dom.projectFolderName.appendChild(infoIcon);
                }
            }
        } catch (error) {
            console.error('❌ Error loading last project:', error);
        }
    };

    // Call on startup (async)
    loadLastProject();
});
