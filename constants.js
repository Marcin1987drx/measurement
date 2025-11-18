const CONFIG = {
    VIEWBOX_WIDTH: 1000,
    VIEWBOX_HEIGHT: 700,
    MIN_ZOOM: 0.5,
    MAX_ZOOM: 5.0,
    GRID_SIZE: 8,
    
    DEFAULT_ARROW_STYLE: {
        color: '#007aff',
        width: 2,
        head: 'arrow'
    },
    
    COLORS: {
        STATUS_OK: '#34c759',
        STATUS_ERROR: '#ff3b30'
    },
    
    LOCALE_MAP: {
        'en': 'en-US',
        'pl': 'pl-PL',
        'de': 'de-DE'
    }
};

Object.freeze(CONFIG);
window.CONFIG = CONFIG;
