/**
 * Infinity admin post lists: resizable + reorderable columns, compact
 * rows, copy link, keyboard shortcuts.
 *
 * Config comes from wp_localize_script as window.infinityListTable.
 */
(function () {
    'use strict';

    var cfg = window.infinityListTable;
    var table = document.querySelector('.wp-list-table');
    if (!cfg || !table || !table.tHead) {
        return;
    }

    var MIN_WIDTH = 40;
    var DESKTOP = window.matchMedia('(min-width: 783px)');
    var layout = {
        widths: (cfg.layout && cfg.layout.widths && !Array.isArray(cfg.layout.widths)) ? cfg.layout.widths : {},
        order: (cfg.layout && Array.isArray(cfg.layout.order)) ? cfg.layout.order : [],
        compact: !!(cfg.layout && cfg.layout.compact)
    };
    var styleEl = document.getElementById('infinity-list-layout-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'infinity-list-layout-css';
        document.head.appendChild(styleEl);
    }

    /* ---------------------------------------------------------------
     * Helpers
     * ------------------------------------------------------------ */

    // Column key for a header or body cell. Body cells carry
    // "column-{key}" plus sometimes "column-primary", which is not a key.
    function columnKey(cell) {
        if (cell.classList.contains('check-column')) {
            return 'cb';
        }
        if (cell.id && cell.closest('thead, tfoot') && cell.id !== 'cb') {
            return cell.id;
        }
        var m = cell.className.match(/(?:^|\s)column-([\w-]+)/g) || [];
        for (var i = 0; i < m.length; i++) {
            var key = m[i].trim().slice(7);
            if (key !== 'primary') {
                return key;
            }
        }
        return '';
    }

    function headerCells() {
        return Array.prototype.slice.call(table.tHead.rows[0].cells);
    }

    function cssEscape(s) {
        return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&');
    }

    // CSS width on a table cell is its content box, so measure that.
    function contentWidth(cell) {
        var cs = getComputedStyle(cell);
        return cell.getBoundingClientRect().width -
            parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) -
            parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
    }

    function renderWidths() {
        var rules = Object.keys(layout.widths).map(function (key) {
            return 'table.wp-list-table .column-' + cssEscape(key) + '{width:' + (layout.widths[key] | 0) + 'px}';
        });
        styleEl.textContent = rules.length ? '@media screen and (min-width:783px){' + rules.join('') + '}' : '';
    }

    var saveTimer = null;
    function post(data) {
        var body = new FormData();
        body.append('action', 'infinity_save_list_layout');
        body.append('nonce', cfg.nonce);
        body.append('screen', cfg.screen);
        Object.keys(data).forEach(function (k) {
            body.append(k, data[k]);
        });
        return fetch(cfg.ajaxUrl, { method: 'POST', credentials: 'same-origin', body: body })
            .catch(function () { /* layout is a convenience; ignore network errors */ });
    }
    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            post({ layout: JSON.stringify(layout) });
        }, 300);
    }

    /* ---------------------------------------------------------------
     * Resize
     * ------------------------------------------------------------ */

    function addResizers() {
        headerCells().forEach(function (th) {
            var key = columnKey(th);
            if (!key || key === 'cb' || th.querySelector('.infinity-col-resizer')) {
                return;
            }
            var handle = document.createElement('span');
            handle.className = 'infinity-col-resizer';
            handle.setAttribute('role', 'separator');
            handle.setAttribute('aria-orientation', 'vertical');
            handle.setAttribute('aria-label', cfg.i18n.resize);
            handle.tabIndex = 0;
            handle.draggable = false;
            handle.dataset.col = key;
            th.appendChild(handle);
        });
    }

    var drag = null;

    // Native header drag (reorder) must never start from the handle.
    table.tHead.addEventListener('mousedown', function (e) {
        if (e.target.closest('.infinity-col-resizer')) {
            e.preventDefault();
        }
    });

    table.tHead.addEventListener('pointerdown', function (e) {
        var handle = e.target.closest('.infinity-col-resizer');
        if (!handle || !DESKTOP.matches || e.button !== 0) {
            return;
        }
        e.preventDefault();
        var th = handle.parentNode;
        drag = { key: handle.dataset.col, th: th, startX: e.clientX, startW: contentWidth(th), moved: false };
        th.draggable = false;
        handle.setPointerCapture(e.pointerId);
        document.body.classList.add('infinity-resizing');
    });

    table.tHead.addEventListener('pointermove', function (e) {
        if (!drag) {
            return;
        }
        var dx = e.clientX - drag.startX;
        if (Math.abs(dx) > 2) {
            drag.moved = true;
        }
        var dir = document.documentElement.dir === 'rtl' ? -1 : 1;
        layout.widths[drag.key] = Math.max(MIN_WIDTH, Math.round(drag.startW + dx * dir));
        renderWidths();
    });

    function endDrag() {
        if (!drag) {
            return;
        }
        drag.th.draggable = true;
        document.body.classList.remove('infinity-resizing');
        if (drag.moved) {
            save();
        }
        drag = null;
    }
    table.tHead.addEventListener('pointerup', endDrag);
    table.tHead.addEventListener('pointercancel', endDrag);

    table.tHead.addEventListener('dblclick', function (e) {
        var handle = e.target.closest('.infinity-col-resizer');
        if (!handle) {
            return;
        }
        delete layout.widths[handle.dataset.col];
        renderWidths();
        save();
    });

    // Clicking the handle must not trigger the header's sort link.
    table.tHead.addEventListener('click', function (e) {
        if (e.target.closest('.infinity-col-resizer')) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // Keyboard resize: arrows on a focused handle (Shift = 50px steps).
    table.tHead.addEventListener('keydown', function (e) {
        var handle = e.target.closest('.infinity-col-resizer');
        if (!handle || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) {
            return;
        }
        e.preventDefault();
        var key = handle.dataset.col;
        var current = layout.widths[key] || contentWidth(handle.parentNode);
        var step = (e.shiftKey ? 50 : 10) * (e.key === 'ArrowRight' ? 1 : -1);
        layout.widths[key] = Math.max(MIN_WIDTH, Math.round(current + step));
        renderWidths();
        save();
    });

    /* ---------------------------------------------------------------
     * Reorder (drag a header onto another)
     * ------------------------------------------------------------ */

    function applyOrder(order) {
        var sections = [table.tHead, table.tFoot].concat(Array.prototype.slice.call(table.tBodies));
        var expected = headerCells().length;
        sections.forEach(function (section) {
            if (!section) {
                return;
            }
            Array.prototype.forEach.call(section.rows, function (row) {
                // Skip colspan rows (no-items, Quick Edit, bulk edit).
                if (row.cells.length !== expected) {
                    return;
                }
                var byKey = {};
                Array.prototype.forEach.call(row.cells, function (cell) {
                    byKey[columnKey(cell)] = cell;
                });
                ['cb'].concat(order).forEach(function (key) {
                    if (byKey[key]) {
                        row.appendChild(byKey[key]);
                        delete byKey[key];
                    }
                });
                Object.keys(byKey).forEach(function (key) {
                    row.appendChild(byKey[key]);
                });
            });
        });
    }

    function currentOrder() {
        return headerCells().map(columnKey).filter(function (k) {
            return k && k !== 'cb';
        });
    }

    var dragKey = null;

    function enableReorder() {
        headerCells().forEach(function (th) {
            var key = columnKey(th);
            if (key && key !== 'cb') {
                th.draggable = true;
                th.classList.add('infinity-draggable');
            }
        });
    }

    table.tHead.addEventListener('dragstart', function (e) {
        var th = e.target.closest && e.target.closest('th');
        if (!th || drag || !DESKTOP.matches || e.target.closest('.infinity-col-resizer')) {
            e.preventDefault();
            return;
        }
        dragKey = columnKey(th);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragKey);
        th.classList.add('infinity-dragging');
    });

    function clearDropMarks() {
        headerCells().forEach(function (th) {
            th.classList.remove('infinity-drop-before', 'infinity-drop-after', 'infinity-dragging');
        });
    }

    function dropSide(th, e) {
        var r = th.getBoundingClientRect();
        var after = e.clientX > r.left + r.width / 2;
        return document.documentElement.dir === 'rtl' ? !after : after;
    }

    table.tHead.addEventListener('dragover', function (e) {
        var th = e.target.closest('th');
        if (!dragKey || !th || columnKey(th) === 'cb' || columnKey(th) === dragKey) {
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        var after = dropSide(th, e);
        headerCells().forEach(function (c) {
            c.classList.remove('infinity-drop-before', 'infinity-drop-after');
        });
        th.classList.add(after ? 'infinity-drop-after' : 'infinity-drop-before');
    });

    table.tHead.addEventListener('drop', function (e) {
        var th = e.target.closest('th');
        if (!dragKey || !th) {
            return;
        }
        e.preventDefault();
        var target = columnKey(th);
        var order = currentOrder().filter(function (k) { return k !== dragKey; });
        var idx = order.indexOf(target);
        if (idx !== -1) {
            order.splice(dropSide(th, e) ? idx + 1 : idx, 0, dragKey);
            layout.order = order;
            applyOrder(order);
            save();
        }
        clearDropMarks();
        dragKey = null;
    });

    table.tHead.addEventListener('dragend', function () {
        clearDropMarks();
        dragKey = null;
    });

    /* ---------------------------------------------------------------
     * Screen Options: compact rows, reset
     * ------------------------------------------------------------ */

    var compact = document.getElementById('infinity-compact-rows');
    if (compact) {
        compact.addEventListener('change', function () {
            layout.compact = compact.checked;
            document.body.classList.toggle('infinity-compact-rows', layout.compact);
            save();
        });
    }

    var reset = document.getElementById('infinity-reset-layout');
    if (reset) {
        reset.addEventListener('click', function () {
            if (!window.confirm(cfg.i18n.confirmReset)) {
                return;
            }
            reset.disabled = true;
            clearTimeout(saveTimer);
            // The default order lives on the server, so reload after reset.
            post({ reset: '1' }).then(function () {
                window.location.reload();
            });
        });
    }

    /* ---------------------------------------------------------------
     * Copy link
     * ------------------------------------------------------------ */

    function flash(btn, text) {
        var original = btn.dataset.label || btn.textContent;
        btn.dataset.label = original;
        btn.textContent = text;
        setTimeout(function () { btn.textContent = original; }, 1600);
        if (window.wp && wp.a11y && wp.a11y.speak) {
            wp.a11y.speak(text);
        }
    }

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.infinity-copy-link');
        if (!btn) {
            return;
        }
        e.preventDefault();
        var url = btn.dataset.url;
        var done = function () { flash(btn, cfg.i18n.copied); };
        var fail = function () { flash(btn, cfg.i18n.copyFailed); window.prompt('', url); };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(done, fail);
        } else {
            var ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy') ? done() : fail(); } catch (err) { fail(); }
            ta.remove();
        }
    });

    /* ---------------------------------------------------------------
     * Keyboard shortcuts: "/" search, "n" new, Esc leaves search
     * ------------------------------------------------------------ */

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }
        var el = document.activeElement;
        var typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
        var search = document.getElementById('post-search-input');

        if (e.key === 'Escape' && typing && el === search) {
            search.blur();
            return;
        }
        if (typing) {
            return;
        }
        if (e.key === '/' && search) {
            e.preventDefault();
            search.focus();
            search.select();
        } else if (e.key === 'n') {
            var add = document.querySelector('.wrap .page-title-action');
            if (add && add.href) {
                window.location.href = add.href;
            }
        }
    });

    /* ---------------------------------------------------------------
     * Init
     * ------------------------------------------------------------ */

    addResizers();
    enableReorder();
    renderWidths();
})();
