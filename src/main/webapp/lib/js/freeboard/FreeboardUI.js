// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

function FreeboardUI() {

    var logger = log4jq.getLogger({
        loggerName: 'FreeboardUI.js'
    });
    logger.info('init FreeboardUI');

    var PANE_MARGIN = 9;
    var PANE_WIDTH = 300;
    var MIN_COLUMNS = 3;
    var MAX_SHEETS = 8;//added by ken 2015/11/15
    var COLUMN_WIDTH = PANE_MARGIN + PANE_WIDTH + PANE_MARGIN;

    var userColumns = MIN_COLUMNS;

    var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
    var grid;

    function processResize(layoutWidgets, loading) {

        if (window.matchMedia('(max-width: 960px)').matches) {
            freeboard.setEditing(false);
            $('#main-header').css('transform', 'translateY(0px)');
        } else {
            freeboard.setEditing(true);
        }

        var calHeight =
                $('.datasource-container').css('height').split('px')[0] -
                $('.datasource-container-header').css('height').split('px')[0] -
                $('.datasource-container-header').css('padding-top').split('px')[0] -
                $('.datasource-container-header').css('padding-bottom').split('px')[0] -
                $('.datasource-toolbar').css('height').split('px')[0] -
                $('.datasource-toolbar').css('padding-top').split('px')[0] -
                $('.datasource-toolbar').css('padding-bottom').split('px')[0];

        $('.datasource-container-list').css('max-height', calHeight + 'px');
        var maxDisplayableColumns = getMaxDisplayableColumnCount();
        var repositionFunction = function () {
        };

        if (layoutWidgets) {
            repositionFunction = function (index) {
                var paneElement = this;
                var paneModel = ko.dataFor(paneElement);

                var newPosition = getPositionForScreenSize(paneModel);
                $(paneElement).attr('data-sizex', Math.min(paneModel.col_width(),
                        maxDisplayableColumns, grid.cols))
                        .attr('data-row', newPosition.row)
                        .attr('data-col', newPosition.col);

                if (loading === true) {
                    // Give the animation a moment to complete. Really hacky.
                    var resize = _.debounce(function () {
                        paneModel.processSizeChange();
                    }, 500);
                    resize();
                } else {
                    paneModel.processSizeChange();
                }
            };
        }
        updateGridColumnControls();
        
        updateGridWidth(Math.min(maxDisplayableColumns, userColumns));

        repositionGrid(repositionFunction);

    }

    function addGridColumn(shift) {
        var num_cols = grid.cols + 1;
        if (updateGridWidth(num_cols)) {
            repositionGrid(function () {
                var paneElement = this;
                var paneModel = ko.dataFor(paneElement);

                var prevColumnIndex = grid.cols > 1 ? grid.cols - 1 : 1;
                var prevCol = paneModel.col[prevColumnIndex];
                var prevRow = paneModel.row[prevColumnIndex];
                var newPosition;
                if (shift) {
                    leftPreviewCol = true;
                    var newCol = prevCol < grid.cols ? prevCol + 1 : grid.cols;
                    newPosition = {row: prevRow, col: newCol};
                } else {
                    rightPreviewCol = true;
                    newPosition = {row: prevRow, col: prevCol};
                }
                $(paneElement).attr('data-sizex', Math.min(paneModel.col_width(), grid.cols))
                        .attr('data-row', newPosition.row)
                        .attr('data-col', newPosition.col);
            });
        }
        updateGridColumnControls();
        userColumns = grid.cols;
    }

    function subtractGridColumn(shift) {
        logger.info('subtractGridColumn');
        var num_cols = grid.cols - 1;
        if (updateGridWidth(num_cols)) {
            repositionGrid(function () {
                var paneElement = this;
                var paneModel = ko.dataFor(paneElement);

                var prevColumnIndex = grid.cols + 1;
                var prevCol = paneModel.col[prevColumnIndex];
                var prevRow = paneModel.row[prevColumnIndex];
                var newPosition, newCol;
                if (shift) {
                    newCol = prevCol > 1 ? prevCol - 1 : 1;
                    newPosition = {row: prevRow, col: newCol};
                } else {
                    newCol = prevCol <= grid.cols ? prevCol : grid.cols;
                    newPosition = {row: prevRow, col: newCol};
                }
                $(paneElement).attr('data-sizex', Math.min(paneModel.col_width(), grid.cols))
                        .attr('data-row', newPosition.row)
                        .attr('data-col', newPosition.col);
            });
        }
        updateGridColumnControls();
        userColumns = grid.cols;
    }

    function updateGridColumnControls() {
        var col_controls = $('.column-tool');
        var available_width = $('#board-content').width();
        var max_columns = Math.floor(available_width / COLUMN_WIDTH);
        //Dylan : default to max_columns
        MIN_COLUMNS = max_columns;

        if (grid.cols <= MIN_COLUMNS)
            col_controls.addClass('min');
        else
            col_controls.removeClass('min');

        if (grid.cols >= max_columns)
            col_controls.addClass('max');
        else
            col_controls.removeClass('max');
    }

    function getMaxDisplayableColumnCount() {
        var available_width = $('#board-content').width();
        return Math.floor(available_width / COLUMN_WIDTH);
    }

    function updateGridWidth(newCols) {
        if (newCols === undefined || newCols < MIN_COLUMNS)
            newCols = MIN_COLUMNS;
        var max_columns = getMaxDisplayableColumnCount();
        if (newCols > max_columns)
            newCols = max_columns;
        // +newCols to account for scaling on zoomed browsers
        var new_width = (COLUMN_WIDTH * newCols) + newCols;
        $('.responsive-column-width').css('max-width', new_width);

        //Added by Ashley for margin-bottom above sheet list
        $('#board-content .responsive-column-width').css('margin-bottom', '80px');

        return (newCols !== grid.cols);
    }

    function repositionGrid(repositionFunction) {
        var rootElement = grid.$el;

        rootElement.find('> li').unbind().removeData();
        $('.responsive-column-width').css('width', '');
        grid.generate_grid_and_stylesheet();

        rootElement.find('> li').each(repositionFunction);

        grid.init();
        $('.responsive-column-width').css('width', grid.cols * PANE_WIDTH + (grid.cols * PANE_MARGIN * 2));
    }

    function getUserColumns() {
        //logger.info('getUserColumns: ' + userColumns);
        return userColumns;
    }

    function setUserColumns(numCols) {
        logger.info('setUserColumns');
        logger.debug('numCols: ' + numCols + ', MIN_COLUMNS: ' + MIN_COLUMNS);
        if (typeof (numCols) == 'undefined') {
            userColumns = MIN_COLUMNS;
        } else {
            userColumns = Math.max(MIN_COLUMNS, numCols);
        }
        logger.debug('current user col: ' + userColumns);
    }

    ko.bindingHandlers.grid = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // Initialize our grid
            grid = $(element).gridster({
                widget_margins: [PANE_MARGIN, PANE_MARGIN],
                widget_base_dimensions: [PANE_WIDTH, PANE_MARGIN],
                resize: {
                    enabled: false,
                    axes: 'x'
                }
            }).data('gridster');
            grid.disable();
        }
    };

    //added by ken 2015/11/03
    function addContentPack() {

        logger.info('addContentPack');

        freeBoardAPI.checkMaxSheets(function () {
            freeboard.addContentPack();
        });
    }
    ;

    function addPane(element, viewModel, isEditing) {
        logger.info('addPane');

        logger.debug('===start to getPositionForScreenSize===');
        var position = getPositionForScreenSize(viewModel);
        logger.debug('===end to getPositionForScreenSize===');
        var col = position.col;
        var row = position.row;
        var width = Number(viewModel.width());
        var height = Number(viewModel.getCalculatedHeight());
        logger.debug('row: ' + row + ' ,col: ' + col);
        logger.debug('width: ' + width + ' ,height: ' + height);
        logger.debug('===start to grid.add_widget===');
        grid.add_widget(element, width, height, col, row);
        logger.debug('===end to grid.add_widget===');

        if (isEditing)
            showPaneEditIcons(true);

        //新增的都放row:1 col:1
        logger.debug('===start to updatePositionForScreenSize===');
        updatePositionForScreenSize(viewModel, row, col);
        logger.debug('===end to updatePositionForScreenSize===');

        $(element).attrchange({
            trackValues: true,
            callback: function (event) {
                //會印超多，debug再打開就好
//                logger.debug('==========attrchange: ' + event.attributeName + '===========');

                if (event.attributeName === 'data-row') {
                    logger.debug('attrchange => data-row: ' + event.newValue);
                    updatePositionForScreenSize(viewModel, Number(event.newValue), undefined);
                } else if (event.attributeName === 'data-col') {
                    logger.debug('attrchange => data-col: ' + event.newValue);
                    updatePositionForScreenSize(viewModel, undefined, Number(event.newValue));
                }
            }
        });

        logger.debug('addPane DONE');
    }

    //added by ken 2015/12/30
    function updateTitleOfPane(element, viewModel) {
        logger.info('updateTitleOfPane');
        var newTitle = viewModel.title();
        logger.debug('new title: ' + newTitle);

        var $liOfWidget = $(element);
        var $element = $liOfWidget.find('h1');//header 
        var length = 20 * viewModel.col_width() * 0.8;

        truncatedText($element, newTitle, length);
    }
    //added by ken 2015/12/30
    function truncatedText($element, newTitle, length) {
        logger.debug('truncatedText: ' + newTitle);
        if (typeof (newTitle) != 'undefined') {
            var truncatedValue = newTitle.length > length ? newTitle.substring(0, Math.min(newTitle.length, length)) + " ..." : newTitle;
            logger.debug('truncatedValue: ' + truncatedValue);
            $element.html(truncatedValue).attr('title', newTitle);
            var escapeTitle = $('<div/>').html(newTitle).text();
            if (newTitle != escapeTitle)
                $element.html(newTitle).attr('title', escapeTitle);
            else    
                $element.html(truncatedValue).attr('title', escapeTitle);
        }
    }

    function updatePane(element, viewModel) {
        logger.debug('updatePane');
        // If widget has been added or removed
        var calculatedHeight = viewModel.getCalculatedHeight();

        var elementHeight = Number($(element).attr('data-sizey'));
        var elementWidth = Number($(element).attr('data-sizex'));

        if (calculatedHeight != elementHeight || viewModel.col_width() != elementWidth) {
            logger.debug('trigger  grid.resize_widget');
            grid.resize_widget($(element), viewModel.col_width(), calculatedHeight, function () {
                grid.set_dom_grid_height();
            });
        }
    }

    function updatePositionForScreenSize(paneModel, row, col) {
        logger.info('updatePositionForScreenSize r: ' + row + ', col: ' + col);
        var displayCols = grid.cols;

        if (!_.isUndefined(row)) {
            logger.debug('set row value: ' + row);
            paneModel.row[displayCols] = row;
        }
        if (!_.isUndefined(col)) {
            logger.debug('set col value: ' + col);
            paneModel.col[displayCols] = col;
        }
    }

    function showLoadingIndicator(show) {
        logger.info('showLoadingIndicator: ' + show);
        if ($('#modal_overlay').length) {
            logger.debug('find model_overlay');
            var overlay = $('#modal_overlay');

            if (show === true)
                loadingIndicator.removeClass('hide').appendTo(overlay).addClass('show');
            else {
                _.delay(function () {
                    _.delay(function () {
                        overlay.remove();
                    }, 500);
                }, 500);
            }
        } else {
            logger.debug('no model_overlay');
            if (show === true)
                loadingIndicator.removeClass('hide').appendTo('body').addClass('show');
            else {
                _.delay(function () {
                    loadingIndicator.removeClass('show').addClass('hide');
                    _.delay(function () {
                        loadingIndicator.remove();
                    }, 500);
                }, 500);
            }
        }


    }

    function showPaneEditIcons(show, animate) {
        if (_.isUndefined(animate))
            animate = true;

        if (show) {
            if (animate) {
                $('.pane-tools').css('display', 'block').removeClass('hide').addClass('show');
                $('#column-tools').css('display', 'block').removeClass('hide').addClass('show');
            } else {
                $('.pane-tools').css('display', 'block');
                $('#column-tools').css('display', 'block');
            }
        } else {
            if (animate) {
                $('.pane-tools').removeClass('show').addClass('hide');
                $('#column-tools').removeClass('show').addClass('hide');
                _.delay(function () {
                    $('.pane-tools').css('display', 'none');
                    $('#column-tools').css('display', 'none');
                }, 200);
            } else {
                $('.pane-tools').css('display', 'none');
                $('#column-tools').css('display', 'none');
            }
        }
    }

    function attachWidgetEditIcons(element) {
        $(element).hover(function () {
            showWidgetEditIcons(this, true);
        }, function () {
            showWidgetEditIcons(this, false);
        });
    }

    function showWidgetEditIcons(element, show) {
        var tool = $(element).find('.sub-section-tools');
        if (show)
            tool.css('display', 'block').removeClass('hide').addClass('show');
        else {
            tool.removeClass('show').addClass('hide');
        }
    }

    function getPositionForScreenSize(paneModel) {

        var cols = Number(grid.cols);
        logger.info('getPositionForScreenSize: grid.cols is ' + cols);

        if (_.isNumber(paneModel.row) && _.isNumber(paneModel.col)) {
            // Support for legacy format
            logger.debug('Support for legacy format');
            var obj = {};
            obj[cols] = paneModel.row;
            paneModel.row = obj;

            obj = {};
            obj[cols] = paneModel.col;
            paneModel.col = obj;
        }

        var newColumnIndex = 1;
        var columnDiff = 1000;

        for (var columnIndex in paneModel.col) {
            if (Number(columnIndex) === cols) // If we already have a position defined for this number of columns, return that position
                return {row: paneModel.row[columnIndex], col: paneModel.col[columnIndex]};
            else if (paneModel.col[columnIndex] > cols) // If it's greater than our display columns, put it in the last column
                newColumnIndex = cols;
            else { // If it's less than, pick whichever one is closest
                var delta = cols - columnIndex;

                if (delta < columnDiff) {
                    newColumnIndex = columnIndex;
                    columnDiff = delta;
                }
            }
        }

        if (newColumnIndex in paneModel.col && newColumnIndex in paneModel.row)
            return {row: paneModel.row[newColumnIndex], col: paneModel.col[newColumnIndex]};


        logger.debug('new pane pos as below:');
        var posOfPane = {row: 1, col: newColumnIndex};
        logger.debug(posOfPane);
        return posOfPane;
    }


    // Public Functions
    freeBoardAPI = {
        showLoadingIndicator: function (show) {
            showLoadingIndicator(show);
        },
        showPaneEditIcons: function (show, animate) {
            showPaneEditIcons(show, animate);
        },
        attachWidgetEditIcons: function (element) {
            attachWidgetEditIcons(element);
        },
        getPositionForScreenSize: function (paneModel) {
            return getPositionForScreenSize(paneModel);
        },
        processResize: function (layoutWidgets, loading) {
            processResize(layoutWidgets, loading);
        },
        disableGrid: function () {
            grid.disable();
        },
        enableGrid: function () {
            grid.enable();
        },
        addContentPack: function () {
            logger.info('addContentPack  (public API)');
            addContentPack();
        },
        addPane: function (element, viewModel, isEditing) {
            logger.info('addPane (public API)');
            addPane(element, viewModel, isEditing);
        },
        updatePane: function (element, viewModel) {
            logger.info('updatePane (public API)');
            updatePane(element, viewModel);
        },
        updateTitleOfPane: function (element, newTitle) {
            updateTitleOfPane(element, newTitle);
        },
        removePane: function (element) {
            grid.remove_widget(element);
        },
        removeAllPanes: function () {
            grid.remove_all_widgets();
        },
        addGridColumnLeft: function () {
            addGridColumn(true);
        },
        addGridColumnRight: function () {
            addGridColumn(false);
        },
        subGridColumnLeft: function () {
            subtractGridColumn(true);
        },
        subGridColumnRight: function () {
            subtractGridColumn(false);
        },
        getUserColumns: function () {
            return getUserColumns();
        },
        setUserColumns: function (numCols) {
            setUserColumns(numCols);
        },
        checkMaxSheets: function (callback) {
            logger.info('checkMaxSheets');
            var totalSheets = $('#tabs .ui-state-default').length;
            logger.debug('totalSheets: ' + totalSheets);
            if (totalSheets >= MAX_SHEETS) {
                var _title = $.i18n.t('global.warning'),
                        //                        'Warning',
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('sheet.overflow');
                //                                'The sheet amount is over limitation. (Cannot bigger than 8.)';

                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);
            } else {
                if (typeof (callback) != 'undefined' && typeof (callback) == 'function') {
                    callback();
                }

            }
        }
    };



    return freeBoardAPI;
}
