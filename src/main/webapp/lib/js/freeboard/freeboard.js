// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

// Jquery plugin to watch for attribute changes
(function ($)
{
    function isDOMAttrModifiedSupported() {
        var p = document.createElement('p');
        var flag = false;
        if (p.addEventListener) {
            p.addEventListener('DOMAttrModified', function () {
                flag = true;
            }, false);
        } else if (p.attachEvent) {
            p.attachEvent('onDOMAttrModified', function () {
                flag = true;
            });
        } else {
            return false;
        }

        p.setAttribute('id', 'target');
        return flag;
    }

    function checkAttributes(chkAttr, e) {
        if (chkAttr) {
            var attributes = this.data('attr-old-value');
            if (e.attributeName.indexOf('style') >= 0) {
                if (!attributes['style'])
                    attributes['style'] = {};
                //initialize
                var keys = e.attributeName.split('.');
                e.attributeName = keys[0];
                e.oldValue = attributes['style'][keys[1]]; //old value
                e.newValue = keys[1] + ':' + this.prop('style')[$.camelCase(keys[1])]; //new value
                attributes['style'][keys[1]] = e.newValue;
            }
            else
            {
                e.oldValue = attributes[e.attributeName];
                e.newValue = this.attr(e.attributeName);
                attributes[e.attributeName] = e.newValue;
            }

            this.data('attr-old-value', attributes); //update the old value object
        }
    }

//initialize Mutation Observer
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    $.fn.attrchange = function (o) {

        var cfg = {
            trackValues: false,
            callback: $.noop
        };
        // for backward compatibility
        if (typeof o === 'function')
            cfg.callback = o;
        else
            $.extend(cfg, o);
        // get attributes old value
        if (cfg.trackValues) {
            //get attributes old value
            $(this).each(function (j, el) {
                var attributes = {};
                for (var attr, i = 0, attrs = el.attributes, l = attrs.length; i < l; i++) {
                    attr = attrs.item(i);
                    attributes[attr.nodeName] = attr.value;
                }

                $(this).data('attr-old-value', attributes);
            });
        }

        // Modern Browsers supporting MutationObserver
        if (MutationObserver) {
            /*
             Mutation Observer is still new and not supported by all browsers.
             http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1622.html
             */
            var mOptions = {
                subtree: false,
                attributes: true,
                attributeOldValue: cfg.trackValues
            };
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (e) {
                    var _this = e.target;
                    //get new value if trackValues is true
                    if (cfg.trackValues) {
                        /**
                         * @KNOWN_ISSUE: The new value is buggy for STYLE attribute as we don't have
                         * any additional information on which style is getting updated.
                         * */
                        e.newValue = $(_this).attr(e.attributeName);
                    }

                    cfg.callback.call(_this, e);
                });
            });
            return this.each(function () {
                observer.observe(this, mOptions);
            });
        } else if (isDOMAttrModifiedSupported()) { //Opera
            //Good old Mutation Events but the performance is no good
            //http://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
            return this.on('DOMAttrModified', function (event) {
                if (event.originalEvent) {
                    event = event.originalEvent;
                } //jQuery normalization is not required for us
                event.attributeName = event.attrName; //property names to be consistent with MutationObserver
                event.oldValue = event.prevValue; //property names to be consistent with MutationObserver
                cfg.callback.call(this, event);
            });
        } else if ('onpropertychange' in document.body) { //works only in IE
            return this.on('propertychange', function (e) {
                e.attributeName = window.event.propertyName;
                //to set the attr old value
                checkAttributes.call($(this), cfg.trackValues, e);
                cfg.callback.call(this, e);
            });
        }

        return this;
    };
})(jQuery);
(function (jQuery) {
    'use strict';
    jQuery.eventEmitter = {
        _JQInit: function () {
            this._JQ = jQuery(this);
        },
        emit: function (evt, data) {
            !this._JQ && this._JQInit();
            this._JQ.trigger(evt, data);
        },
        once: function (evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.one(evt, handler);
        },
        on: function (evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.bind(evt, handler);
        },
        off: function (evt, handler) {
            !this._JQ && this._JQInit();
            this._JQ.unbind(evt, handler);
        }
    };
}(jQuery));
var freeboard = (function () {

    var logger = log4jq.getLogger({
        loggerName: 'freeboard.js'
    });
    logger.info('init freeboard');
    'use strict';
    var datasourcePlugins = {};
    var widgetPlugins = {};
    //init all componemts
    var freeboardUI = new FreeboardUI();
    var theFreeboardModel = new FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI);
    var jsEditor = new JSEditor(theFreeboardModel);
    var valueEditor = new ValueEditor(theFreeboardModel);
    var pluginEditor = new PluginEditor(jsEditor, valueEditor);
    var developerConsole = new DeveloperConsole(theFreeboardModel);
    //added by ken 2015/11/03
    var contentPackEditor = new ContentPackEditor(theFreeboardModel);
    ko.bindingHandlers.contentPackEditor = {
        //之後再處理
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            logger.debug('contentPackEditor.init');
            var options = ko.unwrap(valueAccessor());
        }
    };
    ko.bindingHandlers.truncatedText = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            logger.info('truncatedText: ' + viewModel.title());
            freeboardUI.updateTitleOfPane($(element).parent(), viewModel);
        }
    };
    ko.bindingHandlers.pluginEditor = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var options = ko.unwrap(valueAccessor());
            var types = {};
            var settings;
            var title = '';
            //click action:　operation (add,delete,panel)
            //      type: datasource
            if (options.type == 'datasource') {
                types = datasourcePlugins;
                title = $.i18n.t('PluginEditor.datasource.title');
            } else if (options.type == 'widget') {
                types = widgetPlugins;
                title = $.i18n.t('PluginEditor.widget.title');
            } else if (options.type == 'pane') {
                title = $.i18n.t('PluginEditor.pane.title');
            }

            $(element).click(function (event) {
                logger.debug('trigger element of pluginEditor operation: ' + options.operation + ', type: ' + options.type);
                if (options.operation == 'delete') {


                    var _title =
                            $.i18n.t('PluginEditor.delete.title'),
                            _yes = $.i18n.t('global.yes'),
                            _no = $.i18n.t('global.no'),
                            _ask = $.i18n.t('PluginEditor.delete.text');
                    var paneTitle = '';
                    if (options.type == 'datasource') {

                        if (typeof (viewModel) != 'undefiend') {
                            paneTitle = (typeof (viewModel.name()) != 'undefined' && viewModel.name() != '') ? '(' + viewModel.name() + ') ' : '';
                        }

                    } else if (options.type == 'widget') {

                        if (typeof (viewModel) != 'undefiend') {
                            paneTitle = (typeof (viewModel.title()) != 'undefined' && viewModel.title() != '') ? '(' + viewModel.title() + ') ' : '';
                        }
                    } else if (options.type == 'pane') {

                        if (typeof (viewModel) != 'undefiend') {
                            paneTitle = (typeof (viewModel.title()) != 'undefined' && viewModel.title() != '') ? '(' + viewModel.title() + ') ' : '';
                        }
                    }



                    var phraseElement = $('<p>' + title + paneTitle + _ask + ' ？</p>');
                    var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                        if (okcancel == 'ok') {
                            if (options.type == 'datasource') {
                                theFreeboardModel.deleteDatasource(viewModel);
                            } else if (options.type == 'widget') {
                                theFreeboardModel.deleteWidget(viewModel);
                            } else if (options.type == 'pane') {
                                logger.debug('trigger deletePane func');
                                //viweModel = PaneModel

                                theFreeboardModel.deletePane(viewModel);
                            }
                        }
                    });
                } else {

                    var instanceType;
                    if (options.type === 'datasource') {
                        if (options.operation === 'add') {
                            settings = {};
                        } else {
                            $('body').data(viewModel.name(), options.operation);
                            instanceType = viewModel.type();
                            settings = viewModel.settings();
                            settings.name = viewModel.name();
                            viewModel.isEditing(true);
                        }
                    } else if (options.type === 'widget') {
                        if (options.operation === 'add') {
                            settings = {};
                        } else {
                            instanceType = viewModel.type();
                            settings = viewModel.settings();
                            viewModel.isEditing(true);
                        }
                    } else if (options.type === 'pane') {

                        var columns = freeboardUI.getUserColumns();
                        settings = {};
                        if (options.operation === 'edit') {
                            settings.title = viewModel.title();
                            settings.col_width = viewModel.col_width();
                        }
                        //pane settings
                        types = {
                            settings: {
                                settings: [{
                                        name: "title",
                                        display_name: $.i18n.t('PluginEditor.pane.edit.title'),
                                        validate: "optional,maxSize[100]",
                                        type: "text",
                                        description: $.i18n.t('global.limit_value_characters', 100)
//                                                $.i18n.t('PluginEditor.pane.edit.title_desc')
                                    }, {
                                        name: "col_width",
                                        display_name: $.i18n.t('PluginEditor.pane.edit.colwidth'),
                                        validate: "required,custom[integer],min[1],max[" + columns + "]",
                                        style: "width:100px",
                                        type: "number",
                                        default_value: 1,
                                        description: $.i18n.t('PluginEditor.pane.edit.colwidth_desc1') + columns + $.i18n.t('PluginEditor.pane.edit.colwidth_desc2')
                                    }]
                            }
                        };
                    }

                    var saveSettingCallback = function (newSettings) {
                        logger.debug('saveSettingCallback: operation ' + options.operation + ' ,result as below: ');
                        logger.debug(newSettings);
                        if (options.operation === 'add') {
                            var newViewModel;
                            if (options.type === 'datasource') {
                                newViewModel = new DatasourceModel(theFreeboardModel, datasourcePlugins);
                                theFreeboardModel.addDatasource(newViewModel);
                                newViewModel.name(newSettings.settings.name);
                                delete newSettings.settings.name;
                                newViewModel.settings(newSettings.settings);
                                newViewModel.type(newSettings.type);
                            } else if (options.type === 'widget') {

                                newViewModel = new WidgetModel(theFreeboardModel, widgetPlugins);
                                newViewModel.settings(newSettings.settings);
                                newViewModel.type(newSettings.type);
                                viewModel.widgets.push(newViewModel);
                                freeboardUI.attachWidgetEditIcons(element);
                            }
                        } else if (options.operation === 'edit') {

                            if (options.type === 'pane') {


                                viewModel.title(newSettings.settings.title);
                                viewModel.col_width(newSettings.settings.col_width);
                                //added by ken 20151224
                                //add new callback event when pane width is changed
                                var allWidgetsOfPane = viewModel.widgets();
                                for (var wdIndex = 0; wdIndex < allWidgetsOfPane.length; wdIndex++) {
                                    var widgetModel = allWidgetsOfPane[wdIndex];
                                    if (typeof (widgetModel.widgetInstance.onPaneWidgetChanged) === 'function') {
                                        widgetModel.widgetInstance
                                                .onPaneWidgetChanged(newSettings.settings.col_width);
                                    } else {
                                        logger.warn('Cannot find onPaneWidgetChanged func widgetModel.widgetInstance.name()');
                                    }

                                }
                                freeboardUI.processResize(false);
                            } else {
                                if (options.type === 'datasource') {
                                    if (viewModel.name() != newSettings.settings.name)
                                        theFreeboardModel.updateDatasourceNameRef(newSettings.settings.name, viewModel.name());
                                    viewModel.name(newSettings.settings.name);
                                    var DSName = newSettings.settings.name;
                                    delete newSettings.settings.name;
                                }

                                viewModel.isEditing(false);
                                viewModel.type(newSettings.type);
                                viewModel.settings(newSettings.settings);
                                if (options.type === 'datasource') {
                                    $('#datasources-list').find('tr').each(function () {
                                        var $this = $(this);
                                        var eName = $this.find('.datasource-name').text();
                                        if (eName === DSName) {

                                            $this.find('.fa-refresh').parent('li').trigger('click');
                                        }
                                    });
                                } else {

                                    var wigdetValue = newSettings.settings.value;
                                    var bindingDS;
                                    if (typeof wigdetValue == 'undefined')
                                        return;
                                    if (wigdetValue.indexOf('datasources["') < 0) {
                                        return;
                                    } else {
                                        bindingDS = wigdetValue.split('datasources["')[1].split('"]')[0];
                                        $('#datasources-list').find('tr').each(function () {
                                            var $this = $(this);
                                            var eName = $this.find('.datasource-name').text();
                                            if (eName === bindingDS) {

                                                $this.find('.fa-refresh').parent('li').trigger('click');
                                            }
                                        });
                                    }
                                }

                            }
                        }
                    };
                    var cancelCallback = function () {
                        if (options.operation === 'edit') {
                            if (options.type === 'widget' || options.type === 'datasource')
                                viewModel.isEditing(false);
                        }
                    };
                    pluginEditor.createPluginEditor(title, types, instanceType, settings, saveSettingCallback, cancelCallback);
                }
            });
        }
    };
    ko.virtualElements.allowedBindings.datasourceTypeSettings = true;
    ko.bindingHandlers.datasourceTypeSettings = {
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            processPluginSettings(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        }
    };
    ko.bindingHandlers.pane = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (theFreeboardModel.isEditing())
                $(element).css({cursor: 'pointer'});
            freeboardUI.addPane(element, viewModel, bindingContext.$root.isEditing());
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            logger.debug('update pane');
            // If pane has been removed
            if (theFreeboardModel.panes.indexOf(viewModel) == -1) {
                freeboardUI.removePane(element);
            }
            freeboardUI.updatePane(element, viewModel);
        }
    };
    ko.bindingHandlers.widget = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (theFreeboardModel.isEditing())
                freeboardUI.attachWidgetEditIcons($(element).parent());
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            if (viewModel.shouldRender()) {
                $(element).empty();
                viewModel.render(element);
            }
        }
    };
    function getParameterByName(name) {
        name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'), results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    // DOM Ready
    $(function () {

        $('body').on('keydown', '#setting-value-container-refresh input', function (e) {

            if (e.shiftKey || e.keyCode == 16 || e.keyCode == 109 || e.keyCode == 110 || e.keyCode == 189 || (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 106 && e.keyCode <= 111) || e.keyCode > 123 || e.keyCode == 229) {

                e.preventDefault();
            }

        });
        $('body').on('keydown', '#setting-value-container-amount input', function (e) {

            if (e.shiftKey || e.keyCode == 16 || e.keyCode == 109 || e.keyCode == 110 || e.keyCode == 189 || (e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 106 && e.keyCode <= 111) || e.keyCode > 123 || e.keyCode == 229) {

                e.preventDefault();
            }

        });
        $('body').on('mouseover', '.agentDisconnect', function (e) {
            var $this = $(this);
            $this.attr('title', $.i18n.t('global.plugins_wd.deviceDisconnect'));
        });
        Object.equals = function (x, y) {
            if (x === y)
                return true;
            // if both x and y are null or undefined and exactly the same

            if (!(x instanceof Object) || !(y instanceof Object))
                return false;
            // if they are not strictly equal, they both need to be Objects

            if (x.constructor !== y.constructor)
                return false;
            // they must have the exact same prototype chain, the closest we can do is
            // test there constructor.

            for (var p in x) {

                if (!x.hasOwnProperty(p))
                    continue;
                // other properties were tested using x.constructor === y.constructor

                if (typeof x[ p ] == "undefined")
                    continue;
//                if (typeof y[ p ] == "undefined")
//                    continue;

                if (!y.hasOwnProperty(p))
                    return false;
                // allows to compare x[ p ] and y[ p ] when set to undefined

                if (x[ p ] === y[ p ])
                    continue;
                // if they have the same strict value or identity then they are equal

                if (typeof (x[ p ]) !== "object")
                    return false;
                // Numbers, Strings, Functions, Booleans must be strictly equal

                if (!Object.equals(x[ p ], y[ p ]))
                    return false;
                // Objects and Arrays must be tested recursively
            }

            for (p in y) {
//                if (typeof x[ p ] == "undefined")
//                    continue;

                if (typeof y[ p ] == "undefined")
                    continue;
                if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
                    return false;
                // allows x[ p ] to be set to undefined
            }
            return true;
        }

        $(window).bind('beforeunload', function () {
            if (!head.browser.chrome || navigator.userAgent.indexOf('Edge') >= 0) {
                var prevData = JSON.parse($('body').data('Content'));
                var content = freeboard.serialize();
                if (Object.equals(prevData, content) == false) {
                    return $.i18n.t('global.dialogMsg.Info_IEwontSaved');
                }
            } else {
                if (!$('body').data('bundleVer') && $('body').data('isEditable')) {
                    $('.notificationNumber').html("0").hide();
                    var prevData = JSON.parse($('body').data('Content'));
                    var content = freeboard.serialize();
                    if (Object.equals(prevData, content) == false) {
                        theFreeboardModel.editPrivilegeCheck();
                    }
                    var currentUrl = document.URL.split('dashboard.jsp')[0];
                    currentUrl = "/";
                    //var accountId = $.cookie('mobileacountId');
                    var accountId = $('#queryShareAccount label').attr('aid');
                    var requestURL = requestURL = encodeURI(currentUrl + 'webresources/AccountMgmt/' + accountId);
                    var method = "PUT";
                    var body = '{"request": {"account": {"item": [{"@name": "theme","@value": "' + $.cookie('themeType') + '"}]}}}';
                    $.ajax({
                        url: requestURL,
                        type: method,
                        data: body,
                        contentType: "application/json",
                        beforeSend: function (xhr) {
                            try {
                                var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                                xhr.setRequestHeader("Authorization", authorization);
                                xhr.setRequestHeader("Accept", "application/json");
                            }
                            catch (e) {
                            }
                        },
                        success: function (data) {
                            if (!TokenValidation(data))
                                return;
                        },
                        error: function (xhr, status, error) {

                        }
                    });
                } else {
                    return $.i18n.t('global.dialogMsg.Info_wontSaved');
                }
            }
        });
        $('body').on('click', function (e) {

            var $this = $(e.target);
            if ($this.attr('id') == 'datasources' || $this.closest('#datasources').length || $this.attr('id') == 'board-actions-right' || $this.closest('#board-actions-right').length) {
//                alert('DataSources');
            } else {
                var DSvisibility = $('#datasources').data('DSvisibility');
                if (DSvisibility) {

                    $('#datasources .datasource-container-header .board-toolbar>li').trigger('click');
                }
            }
        });
        $('body').on('click', '#toggleSetting', function () {

            theFreeboardModel.toggleSetting();
        });
        //Added by Ashley
        $('#backtoHomepage').click(function () {
            $.cookie('changeType', 'true', {
                path: '/'
            });
            location = '/';
        });
        $('#board-content').appendTo('#tab1');
        $("div#tabs").tabs({
            //Disable Create Bug
            create: function (event, ui) {
                //off keyboard event for tabs
                ui.tab.off('keyup keydown keypress');
            },
            activate: function (event, ui) {
                //off keyboard event for tabs
                ui.newTab.off('keyup keydown keypress');
                ui.oldTab.off('keyup keydown keypress');
            }
        });
        $("div#tabs").tabs("refresh");
        $("#tabs .ui-tabs-nav").sortable({
            start: function (e) {

                if (!theFreeboardModel.privilegeCheck()) {
                    e.preventDefault();
                    return;
                }

            },
            cursor: "move",
            items: "> .ui-state-default",
            axis: "x",
            stop: function (event, ui) {

                $("div#tabs").tabs("refresh");
                $('#tabs li').removeClass('ui-corner-top');
                var i = 0;
                while ($('#tabs .ui-state-default').eq(i).length != 0) {

                    $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
                    i++;
                }

                $.cookie('ActiveSheet', $('#tabs .ui-state-active').data('sequence') - 1, {
                    path: '/'
                });
                $(ui.item[0]).addClass('SQChange');
                theFreeboardModel.editPrivilegeCheck($(ui.item[0]));
            }
        });
        $('#tabs li').removeClass('ui-corner-top');
        var DELAY = 700, clicks = 0, timer = null;
        //Added by Ashley
        $('body').on('click', 'li.ui-state-default a', function (e) {
            logger.info('selected sheet');
            e.preventDefault;
            var oringinalSheet = $.cookie('ActiveSheet');
            var newSheet = $(e.target).parent('li').data('sequence') - 1;
            logger.info('selected sheet: ' + newSheet);
            if ($(e.target).attr('class') != 'thVal' && !$(e.target).closest('.thVal').length && $('body .thVal').length <= 0) {

                clicks++; //count clicks
                if (clicks === 1) {
//Bug 7778 - A账户 share给B，通过B账户切换到A的dashboard，不能对A的sheet页名称进行修改。
//                    if ($('#queryShareAccount label').attr('aid') !== $.cookie('mobileacountId')) {
//                        var overlay = $('<div id="modal_overlay"></div>');
//                        $('body').append(overlay);
//                        freeboardUI.showLoadingIndicator(true);
//
//                        timer = setTimeout(function () {
//
//                            $('div#tabs').tabs({
//                                active: newSheet
//                            });
//
//                            $.cookie('ActiveSheet', newSheet, {
//                                path: '/'
//                            });
//
//                            $('#tabs li').removeClass('ui-corner-top');
//
//                            theFreeboardModel.loadDashboardFromDataBase();
//
//                            clicks = 0; //after action performed, reset counter
//
//                        }, DELAY);
//
//                        return;
//
//                    }
                    //SINGLE Click (LOAD SHEET)
                    if (newSheet != oringinalSheet) {
                        var prevData = JSON.parse($('body').data('Content'));
                        var content = freeboard.serialize();
                        if (Object.equals(prevData, content) == false) {
                            var overlay = $('<div id="modal_overlay"></div>');
                            $('body').append(overlay);
                            freeboardUI.showLoadingIndicator(true);
                            timer = setTimeout(function () {

                                logger.debug('SAVE sheet to SERVER: ');
                                var currentUrl = document.URL.split('dashboard.jsp')[0];
                                currentUrl = "/";
                                var did = $('#tabs').find('.ui-state-default').eq(oringinalSheet).data('did');
                                var sequence = $('#tabs').find('.ui-state-default').eq(oringinalSheet).data('sequence');
                                var sheetName = $('#tabs').find('.ui-state-default').eq(oringinalSheet).children('a').attr('title');
                                var content = JSON.stringify(freeboard.serialize());
                                var method = "PUT";
                                var requestURL = "dashboard/api/sheet";
                                requestURL = requestURL + "/" + did;
                                var body = '{"sheet" : "' + sheetName + '","content" : ' + content + ',"sequence" : ' + sequence + '}';
                                $.ajax({
                                    url: requestURL,
                                    type: method,
                                    data: body,
                                    contentType: "application/json",
                                    beforeSend: function (xhr) {
                                        var authorization = 'Basic ' + $.base64.encode(_oRMM.Login.aid + ':' + _oRMM.Login.password);
                                        xhr.setRequestHeader("Authorization", authorization);
                                        xhr.setRequestHeader("Accept", "application/json");
                                    },
                                    success: function (data) {
                                        if (!TokenValidation(data))
                                            return;
                                        if (!_.isUndefined(data.result.ErrorCode)) {

                                            $('div#tabs').tabs({
                                                active: oringinalSheet
                                            });
                                            $.cookie('ActiveSheet', oringinalSheet, {
                                                path: '/'
                                            });
                                            $('#tabs li').removeClass('ui-corner-top');
                                            var _title = $.i18n.t('global.warning'),
                                                    _yes = $.i18n.t('global.yes'),
                                                    _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + $.i18n.t('global.dialogMsg.Errorcode') + data.result.ErrorCode;
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes);
                                            _.delay(function () {
                                                freeboardUI.showLoadingIndicator(false);
                                            }, 100);
                                        } else if (data.result == 'false') {

                                            $('div#tabs').tabs({
                                                active: oringinalSheet
                                            });
                                            $.cookie('ActiveSheet', oringinalSheet, {
                                                path: '/'
                                            });
                                            $('#tabs li').removeClass('ui-corner-top');
                                            var _title = $.i18n.t('global.warning'),
                                                    _yes = $.i18n.t('global.yes'),
                                                    _ask = $.i18n.t('global.dialogMsg.Error_SavedFail', sheetName);
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes);
                                            _.delay(function () {
                                                freeboardUI.showLoadingIndicator(false);
                                            }, 100);
                                        } else {

                                            $('div#tabs').tabs({
                                                active: newSheet
                                            });
                                            $.cookie('ActiveSheet', newSheet, {
                                                path: '/'
                                            });
                                            $('#tabs li').removeClass('ui-corner-top');
                                            //load sheet
                                            theFreeboardModel.loadDashboardFromDataBase();
                                        }
                                    },
                                    error: function (xhr, status, error) {

                                        $('div#tabs').tabs({
                                            active: oringinalSheet
                                        });
                                        $.cookie('ActiveSheet', oringinalSheet, {
                                            path: '/'
                                        });
                                        $('#tabs li').removeClass('ui-corner-top');
                                        var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes);
                                        _.delay(function () {
                                            freeboardUI.showLoadingIndicator(false);
                                        }, 1000);
                                    }
                                });
                                clicks = 0; //after action performed, reset counter

                            }, DELAY);
                        } else {
                            var overlay = $('<div id="modal_overlay"></div>');
                            $('body').append(overlay);
                            freeboardUI.showLoadingIndicator(true);
                            timer = setTimeout(function () {

                                $('div#tabs').tabs({
                                    active: newSheet
                                });
                                $.cookie('ActiveSheet', newSheet, {
                                    path: '/'
                                });
                                $('#tabs li').removeClass('ui-corner-top');
                                theFreeboardModel.loadDashboardFromDataBase();
                                clicks = 0; //after action performed, reset counter

                            }, DELAY);
                        }
                    }
                } else {
                    //Double Click (EDIT)
                    clearTimeout(timer); //prevent single-click action

                    e.stopPropagation();
                    var tabs = $('div#tabs').tabs({
                        active: oringinalSheet

                    });
//
//                    $("#tabs .ui-tabs-nav").sortable({
//                        items: "> .ui-state-default",
//                        axis: "x",
//                        stop: function (event, ui) {
//
//                            $("div#tabs").tabs("refresh");
//                            $('#tabs li').removeClass('ui-corner-top');
//
//                            var i = 0;
//                            while ($('#tabs .ui-state-default').eq(i).length != 0) {
//
//                                $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
//                                i++;
//                            }
//
//                            $.cookie('ActiveSheet', $('#tabs .ui-state-active').data('sequence') - 1, {
//                                path: '/'
//                            });
//
//                            $(ui.item[0]).addClass('SQChange');
//
//                            theFreeboardModel.saveDashboard($(ui.item[0]));
//                        }
//                    });
                    $.cookie('ActiveSheet', oringinalSheet, {
                        path: '/'
                    });
                    var currentLi = $(this).parent('li');
                    var value = $(this).attr('title');
                    var width = $(this).css('width');
                    if ($(this).parent('li').hasClass('ui-state-active') && theFreeboardModel.isEditing()) {

                        updateVal(currentLi, value, width);
                    }

                    clicks = 0; //after action performed, reset counter
                }
            }



        }).on("dblclick", 'li.ui-state-default a', function (e) {

            e.preventDefault(); //cancel system double-click event

        });
        function updateVal(currentLi, value, width) {

            $(currentLi).html('<input class="thVal" style="width:' + width + ';" type="text" value="' + value + '" />');
            $(".thVal").focus();
            $(".thVal").keyup(function (event) {

                event.preventDefault();
                var newLabelName = $(this).val();
                if (event.keyCode == 13 && $('#modal_overlay').length == 0) {

                    if (newLabelName == '' || newLabelName.toLowerCase() == 'null') {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Info_sheetNameNull');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                            if (okcancel) {
                                $(".thVal").focus();
                            }
                        });
                    } else if (newLabelName.length > 256) {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Info_sheetNameLength');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                            if (okcancel) {
                                $(".thVal").focus();
                            }
                        });
                    } else {

                        var labelNameCompare = true;
                        $('#tabs').find('li.ui-state-default>a').each(function () {

                            var tabLabelName = $(this).attr('title');
                            if (newLabelName == tabLabelName) {

                                labelNameCompare = false;
                            }

                        });
                        if (labelNameCompare) {
                            if (newLabelName.length > 11) {

                                var currenta = '<a href="#tab1" class="ui-tabs-anchor" role="presentation" title="' + newLabelName + '" tabindex="-1" id="' + $(currentLi).attr('aria-labelledby') + '">' + newLabelName.slice(0, 11) + '</a><i style="line-height:32px; padding-right: 5px;" class="fa-w fa-ellipsis-h">';
                            } else {

                                var currenta = '<a href="#tab1" class="ui-tabs-anchor" role="presentation" title="' + newLabelName + '" tabindex="-1" id="' + $(currentLi).attr('aria-labelledby') + '">' + newLabelName + '</a>';
                            }

                            $(currentLi).html(currenta);
                            $('div#tabs').tabs({
                                active: $.cookie('ActiveSheet')
                            });
                            if (!$('body').data('bundleVer') && $('body').data('isEditable')) {
                                theFreeboardModel.editPrivilegeCheck(currentLi);
                            }

                        } else {

                            var _title = $.i18n.t('global.warning'),
                                    _yes = $.i18n.t('global.yes'),
                                    _ask = $.i18n.t('global.dialogMsg.Info_sheetNameDuplicated');
                            var phraseElement = $('<p>' + _ask + '</p>');
                            var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                if (okcancel) {
                                    $(".thVal").focus();
                                }
                            });
                        }
                    }
                }
            });
            $('body').on('click', function (e) {

                var $this = $(e.target);
                e.preventDefault;
                if (!$this.closest('.modal').length && $this.attr('class') !== 'thVal' && !$this.closest('.thVal').length) {

                    var event = $.Event('keyup');
                    event.keyCode = 13; // # Some key code value
                    $('.thVal').trigger(event);
                }
            });
        }

        // browser check
        if (head.browser.ie && head.browser.version <= 9) {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.Error_BrowserNoSupport');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes, '', function () {
                $.cookie('redirectSource', '', {
                    path: '/'
                });
                location = '/';
            });
//            alert('This browser not supported');
            return;
        }

        // i18next initialize
        $('html').i18n();
        // Show the loading indicator when we first load
        freeboardUI.showLoadingIndicator(true);
        $(window).resize(_.debounce(function () {
            freeboardUI.processResize(true);
        }, 500));
    });
    // PUBLIC FUNCTIONS
    return {
        initialize: function (allowEdit, finishedCallback) {
            $.ajaxSetup({cache: false});
            logger.info('initialize');
            logger.info('allowEdit: ' + allowEdit);
            if (!$('#modal_overlay').length) {
                var overlay = $('<div id="modal_overlay"></div>');
                $('body').append(overlay);
                freeboardUI.showLoadingIndicator(true);
            }

            // Check to see if we have a query param called load. If so, we should load that dashboard initially
            var freeboardLocation = getParameterByName('load');
            theFreeboardModel.allow_edit(allowEdit);
            ko.applyBindings(theFreeboardModel);
            theFreeboardModel.setEditing(allowEdit);
            if (freeboardLocation !== '') {
                $.ajax({
                    url: freeboardLocation,
                    success: function (data) {
                        theFreeboardModel.loadDashboard(data);
                        if (_.isFunction(finishedCallback))
                            finishedCallback();
                    }
                });
            } else {
                freeboardUI.showLoadingIndicator(false);
                if (_.isFunction(finishedCallback))
                    finishedCallback();
                freeboard.emit('initialized');
            }

            freeboardUI.processResize(true, true);

            //Login
            $.ajax({
                url: "dashboard/api/account/login",
                type: "get",
                data: "",
                contentType: "application/json",
                beforeSend: function (xhr) {
                    switch (_oRMM.Login.type) {
                        case "Azure" :
                            var authorization = 'Basic ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                            xhr.setRequestHeader("Authorization", authorization);
                            xhr.setRequestHeader("Accept", "application/json");
                            break;
                        case "Self" :
                        default:
                            var authorization = 'Basic ' + $.base64.encode(_oRMM.Login.username + ':' + _oRMM.Login.password);
                            xhr.setRequestHeader("Authorization", authorization);
                            xhr.setRequestHeader("Accept", "application/json");
                            break;
                    }
                },
                success: function (data) {
                    if (data.success)
                        theFreeboardModel.LoadDashboardSheetList();
                    else
                        window.location.href = "index.html";
                },
                error: function (xhr, status, error) {
                    window.location.href = "index.html";
                }
            });

            try
            {
                $('#queryShareAccount label').attr('aid', _RMMGlobal.Get().Login.username).html(_RMMGlobal.Get().Login.username);
            }
            catch (e){}

            theFreeboardModel.themeWhite();
            /*
                        theFreeboardModel.addNewSheet();

                        var strData = '{"version":1,"allow_edit":true,"plugins":[],"panes":[{"title":"","width":1,"row":{"5":1},"col":{"4":1,"5":1},"col_width":2,"widgets":[{"type":"text","settings":{"title":"","value":"return \\"Demo_305A3A700000\\";","size":"regular","decimal":2,"comma":false,"metric_prefix":false,"units":"","animate":true,"chart_type":"line","chart_color":"#ff9900","chart_minmax_color":"#0496ff","height":2}},{"type":"picture","settings":{"title":"","blocks":4,"src":"../images/UNO-4000.png"}},{"type":"html","settings":{"title":"","value":"<iframe width=\\"100%\\" height=\\"100%\\" src=\\"https://www.youtube.com/embed/lxPfZLSRCXE?ecver=1&rel=0&autoplay=1\\" frameborder=\\"0\\" allowfullscreen></iframe>","blocks":5}}]},{"title":"","width":1,"row":{"4":13,"5":13,"6":13},"col":{"4":3,"5":3,"6":3},"col_width":2,"widgets":[{"type":"c3js","settings":{"title":"","blocks":5,"value1":"datasources[\\"History\\"]","options":""}}]},{"title":"","width":1,"row":{"4":1,"5":23,"7":23},"col":{"4":3,"5":3,"7":3},"col_width":2,"widgets":[{"type":"gauge","settings":{"title":"","blocks":5,"type":"half","value":"datasources[\\"RealTime\\"][\\"itemList\\"][\\"0\\"][\\"v\\"]","decimal":0,"comma":false,"metric_prefix":false,"animate":true,"units":"","value_fontcolor":"#d3d4d4","gauge_upper_color":"#ff0000","gauge_mid_color":"#f9c802","gauge_lower_color":"#a9d70b","gauge_color":"#edebeb","gauge_width":50,"show_minmax":true,"min_value":0,"max_value":100}}]}],"datasources":[{"name":"RealTime","type":"realtimedata","settings":{"refresh":5,"device":"00000001-0000-0000-0000-305A3A700000","plugin":"SUSIControl","source":"/Hardware Monitor/Temperature/System","did":"1","agentId":"00000001-0000-0000-0000-305A3A700000"}},{"name":"History","type":"getHistData","settings":{"refresh":5,"device":"00000001-0000-0000-0000-305A3A700000","plugin":"SUSIControl","source":"/Hardware Monitor/Temperature/System","did":"1","agentId":"00000001-0000-0000-0000-305A3A700000"}}],"columns":5}';
                        //for pcf platform
                        //strData = strData.replace('00000001-0000-0000-0000-305A3A700000', '00000001-0000-0000-0000-654A3A700000');
                        var jsonObject = JSON.parse(strData);
                        //theFreeboardModel.loadDashboard(jsonObject);
                        */
        },
        addContentPack: function () {
            logger.debug('addContentPack: show dialogbox');
            contentPackEditor.open();
        },
        newDashboard: function () {
            theFreeboardModel.loadDashboard({allow_edit: true});
        },
        loadDashboard: function (configuration, callback) {
            theFreeboardModel.loadDashboard(configuration, callback);
        },
        serialize: function () {
            return theFreeboardModel.serialize();
        },
        setEditing: function (editing, animate) {
            theFreeboardModel.setEditing(editing, animate);
        },
        isEditing: function () {
            return theFreeboardModel.isEditing();
        },
        loadDatasourcePlugin: function (plugin) {
            logger.info('loadDatasourcePlugin');
            if (_.isUndefined(plugin.display_name) || plugin.display_name === '')
                plugin.display_name = plugin.type_name;
            // Datasource name must be unique
            window.freeboard.isUniqueDatasourceName = function (field, rules, i, options) {
                var res = _.find(theFreeboardModel.datasources(), function (datasource) {
                    // except itself
                    if (datasource.isEditing() === false)
                        return datasource.name() == field.val();
                });
                if (!_.isUndefined(res))
                    return options.allrules.alreadyusedname.alertText;
            };
            // Add a required setting called name to the beginning
            plugin.settings.unshift({
                name: 'name',
                display_name: $.i18n.t('PluginEditor.datasource.given_name'),
                validate: 'funcCall[freeboard.isUniqueDatasourceName],required,custom[illegalEscapeChar],maxSize[100]',
                type: 'text',
                description: $.i18n.t('PluginEditor.datasource.given_name_desc')
            });
            theFreeboardModel.addPluginSource(plugin.source);
            datasourcePlugins[plugin.type_name] = plugin;
            theFreeboardModel._datasourceTypes.valueHasMutated();
        },
        resize: function () {
            freeboardUI.processResize(true);
        },
        loadWidgetPlugin: function (plugin) {
            logger.info('loadWidgetPlugin');
            logger.debug(plugin);
            if (_.isUndefined(plugin.display_name))
                plugin.display_name = plugin.type_name;
            theFreeboardModel.addPluginSource(plugin.source);
            widgetPlugins[plugin.type_name] = plugin;
            theFreeboardModel._widgetTypes.valueHasMutated();
        },
        // To be used if freeboard is going to load dynamic assets from a different root URL
        setAssetRoot: function (assetRoot) {
            jsEditor.setAssetRoot(assetRoot);
        },
        addStyle: function (selector, rules) {
            var styleString = selector + '{' + rules + '}';
            var styleElement = $('style#fb-styles');
            if (styleElement.length === 0) {
                styleElement = $('<style id="fb-styles" type="text/css"></style>');
                $('head').append(styleElement);
            }

            if (styleElement[0].styleSheet)
                styleElement[0].styleSheet.cssText += styleString;
            else
                styleElement.text(styleElement.text() + styleString);
        },
        showLoadingIndicator: function (show) {
            freeboardUI.showLoadingIndicator(show);
        },
        showDialog: function (contentElement, title, okTitle, cancelTitle, okCallback) {
            var db = new DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
        },
        getDatasourceSettings: function (datasourceName) {
            var datasources = theFreeboardModel.datasources();
            // Find the datasource with the name specified
            var datasource = _.find(datasources, function (datasourceModel) {
                return (datasourceModel.name() === datasourceName);
            });
            if (datasource)
                return datasource.settings();
            else
                return null;
        },
        setDatasourceSettings: function (datasourceName, settings) {
            var datasources = theFreeboardModel.datasources();
            // Find the datasource with the name specified
            var datasource = _.find(datasources, function (datasourceModel) {
                return (datasourceModel.name() === datasourceName);
            });
            if (!datasource) {
                logger.error('Datasource not found');
                return;
            }

            var combinedSettings = _.defaults(settings, datasource.settings());
            datasource.settings(combinedSettings);
        },
        getStyleString: function (name) {
            var returnString = '';
            _.each(currentStyle[name], function (value, name) {
                returnString = returnString + name + ':' + value + ';';
            });
            return returnString;
        },
        getStyleObject: function (name) {
            return currentStyle[name];
        },
        showDeveloperConsole: function () {
            developerConsole.showDeveloperConsole();
        },
        saveDashboard: function ()
        {
            theFreeboardModel.saveDashboard($("div#tabs ul li.ui-state-default").eq($.cookie('ActiveSheet')));
        }

    };
}());
$.extend(freeboard, jQuery.eventEmitter);
