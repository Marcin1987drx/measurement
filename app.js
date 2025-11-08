document.addEventListener('DOMContentLoaded', () => {

    const appState = {
        formulaSuggestions: { visible: false, items: [], activeIndex: -1, targetCell: null }
    };

    const dom = {
        dbViewerModal: document.getElementById('db-viewer-modal'),
        formulaSuggestions: document.getElementById('formula-suggestions'),
    };

    const positionTooltip = (cell) => {
        const rect = cell.getBoundingClientRect();
        const viewerRect = dom.dbViewerModal.getBoundingClientRect();
        const tooltipMaxRight = viewerRect.width - dom.formulaSuggestions.offsetWidth;
        dom.formulaSuggestions.style.top = `${rect.bottom + window.scrollY}px`;
        dom.formulaSuggestions.style.left = `${Math.min(rect.left + window.scrollX, tooltipMaxRight)}px`;
    };

    const updateTooltipContent = (cell) => {
        const columnData = cell.dataset.header || "No Data";
        dom.formulaSuggestions.innerHTML = `<div class='tooltip-header'>Column: ${columnData}</div>`;
    };

    const addTooltipListeners = () => {
        const cells = document.querySelectorAll('.db-table td');
        cells.forEach(cell => {
            cell.addEventListener('mouseenter', () => {
                updateTooltipContent(cell);
                positionTooltip(cell);
                dom.formulaSuggestions.style.display = 'block';
            });
            cell.addEventListener('mouseleave', () => {
                dom.formulaSuggestions.style.display = 'none';
            });
        });
    };

    addTooltipListeners();
});
