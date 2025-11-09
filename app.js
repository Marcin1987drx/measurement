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

                    if (type === 'label' && mp) {
                        mp.labelX = viewBoxX;
                        mp.labelY = viewBoxY;
                    } else if (type === 'qrLabel') {
                        appState.ui.editorState.meta.qrLabelPos = { x: viewBoxX, y: viewBoxY };
                    } else if (type === 'dateLabel') {
                        appState.ui.editorState.meta.dateLabelPos = { x: viewBoxX, y: viewBoxY };
                    }
                    
                    // Update label position immediately
                    const containerRect = dom.labelsContainer.getBoundingClientRect();
                    if (containerRect.width > 0) {
                        const scaleX = containerRect.width / VIEWBOX_WIDTH;
                        const scaleY = containerRect.height / VIEWBOX_HEIGHT;
                        
                        let labelElement = null;
                        if (type === 'label' && mp) {
                            labelElement = dom.labelsContainer.querySelector(`.mp-label[data-mp-id="${mp.id}"]`);
                        } else if (type === 'qrLabel') {
                            labelElement = dom.labelsContainer.querySelector('[data-drag-type="qrLabel"]');
                        } else if (type === 'dateLabel') {
                            labelElement = dom.labelsContainer.querySelector('[data-drag-type="dateLabel"]');
                        }
                        
                        if (labelElement) {
                            labelElement.style.left = `${viewBoxX * scaleX}px`;
                            labelElement.style.top = `${viewBoxY * scaleY}px`;
                            
                            const currentScale = appState.ui.canvasZoom.scale;
                            const originalTransform = labelElement.dataset.originalTransform || 'translate(-50%, -50%)';
                            labelElement.dataset.originalTransform = originalTransform;
                            labelElement.style.transform = `scale(${1/currentScale}) ${originalTransform}`;
                            
                            // CRITICAL: Force visibility during drag
                            labelElement.style.display = '';
                            labelElement.style.visibility = 'visible';
                            labelElement.style.opacity = '1';
                            labelElement.style.pointerEvents = 'auto';
                        }
                    }
                }