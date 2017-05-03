// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

function FreeboardModel(datasourcePlugins, widgetPlugins, freeboardUI)
{

    var self = this;
    //added by ken 2015/10/16
    var logger = log4jq.getLogger({
        loggerName: 'FreeboardModel.js'
    });
    logger.info('init FreeboardModel');
    var SERIALIZATION_VERSION = 1;
    this.version = 0;
    this.isEditing = ko.observable(false);
    this.allow_edit = ko.observable(false);
    this.allow_edit.subscribe(function (newValue) {
        if (newValue) {
            $('#main-header').show();
        } else {
            $('#main-header').hide();
            $('#datasources').hide();
        }
    });
    this.isVisibleDatasources = ko.observable(false);
    this.isVisibleBoardTools = ko.observable(false);
    this.header_image = ko.observable();
    this.plugins = ko.observableArray();
    this.datasources = ko.observableArray();
    this.panes = ko.observableArray();
    this.datasourceData = {};
    this.longPollingWebSocket = null;
    this.longPollingLastevtID = '';
    this.isLongPolling = false;
    this.sessionID = $.cookie('sessionId');
    this.processDatasourceUpdate = function (datasourceModel, newData) {

        var datasourceName = datasourceModel.name();
        logger.info('processDatasourceUpdate: ' + datasourceName);
        //update ds data
        self.datasourceData[datasourceName] = newData;
        //scan all widgets in all panes
        var currentPanesArr = self.panes();
        _.each(currentPanesArr, function (pane) {
//                _.each(pane.widgets(), function (widget) {

            var currentWidgetsArr = pane.widgets();
            _.each(currentWidgetsArr, function (widget) {
//                widget.processDatasourceUpdate(datasourceName);

                //modified by ken 2016/1/5
                //add seconed parameter: datasourceModel
                widget.processDatasourceUpdate(datasourceName, datasourceModel);
            });
        });
    };
    this._datasourceTypes = ko.observable();
    this.datasourceTypes = ko.computed({
        read: function () {
            self._datasourceTypes();
            var returnTypes = [];
            _.each(datasourcePlugins, function (datasourcePluginType) {
                var typeName = datasourcePluginType.type_name;
                var displayName = typeName;
                if (!_.isUndefined(datasourcePluginType.display_name))
                    displayName = datasourcePluginType.display_name;
                returnTypes.push({
                    name: typeName,
                    display_name: displayName
                });
            });
            return returnTypes;
        }
    });
    this._widgetTypes = ko.observable();
    this.widgetTypes = ko.computed({
        read: function () {
            self._widgetTypes();
            var returnTypes = [];
            _.each(widgetPlugins, function (widgetPluginType) {
                var typeName = widgetPluginType.type_name;
                var displayName = typeName;
                if (!_.isUndefined(widgetPluginType.display_name))
                    displayName = widgetPluginType.display_name;
                returnTypes.push({
                    name: typeName,
                    display_name: displayName
                });
            });
            return returnTypes;
        }
    });
    //added by ken 2015/11/16
    this.getFreeboardUIInstance = function () {
        logger.info('getFreeboardUIInstance');
        return freeboardUI;
    };
    this.addPluginSource = function (pluginSource) {
        if (pluginSource && self.plugins.indexOf(pluginSource) === -1)
            self.plugins.push(pluginSource);
    };
    this.serialize = function () {
        var panes = [];
        _.each(self.panes(), function (pane) {
            panes.push(pane.serialize());
        });
        var datasources = [];
        _.each(self.datasources(), function (datasource) {
            datasources.push(datasource.serialize());
        });
        return {
            version: SERIALIZATION_VERSION,
            header_image: self.header_image(),
            allow_edit: self.allow_edit(),
            plugins: self.plugins(),
            panes: panes,
            datasources: datasources,
            columns: freeboardUI.getUserColumns()
        };
    };
    this.deserialize = function (object, finishedCallback) {
        self.clearDashboard();
        function finishLoad() {
            freeboardUI.setUserColumns(object.columns);
            if (!_.isUndefined(object.allow_edit))
                self.allow_edit(object.allow_edit);
            else
                self.allow_edit(true);
            self.version = object.version || 0;
            self.header_image(object.header_image);
            _.each(object.datasources, function (datasourceConfig) {
                var datasource = new DatasourceModel(self, datasourcePlugins);
                datasource.deserialize(datasourceConfig);
                self.addDatasource(datasource);
            });
            var sortedPanes = _.sortBy(object.panes, function (pane) {
                return freeboardUI.getPositionForScreenSize(pane).row;
            });
            _.each(sortedPanes, function (paneConfig) {
                var pane = new PaneModel(self, widgetPlugins);
                pane.deserialize(paneConfig);
                self.panes.push(pane);
            });
            if (self.allow_edit() && self.panes().length === 0 && self.datasources().length === 0)
                self.setEditing(true);
            if (_.isFunction(finishedCallback))
                finishedCallback();
            freeboardUI.processResize(true, true);
        }

        // This could have been self.plugins(object.plugins), but for some weird reason head.js was causing a function to be added to the list of plugins.
        _.each(object.plugins, function (plugin) {
            self.addPluginSource(plugin);
        });
        // Load any plugins referenced in this definition
        if (_.isArray(object.plugins) && object.plugins.length > 0) {
            head.js(object.plugins, function () {
                finishLoad();
            });
        } else {
            finishLoad();
        }
    };
    this.clearDashboard = function () {
        freeboardUI.removeAllPanes();
        _.each(self.datasources(), function (datasource) {
            datasource.dispose();
        });
        _.each(self.panes(), function (pane) {
            pane.dispose();
        });
        self.plugins.removeAll();
        self.datasources.removeAll();
        self.panes.removeAll();
    };
    this.backtoHome = function () {
        $.cookie('changeType', 'true', {
            path: '/'
        });
        location.href = '/';
    };
    this.widgetTempUsage = function () {
        window.open('FreeboardHelp');
    };
    this.loadDashboard = function (dashboardData, contentsource, callback) {
        logger.info('loadDashboard');
        logger.debug(dashboardData);
//        var REFRESH_TIME_unit = 5;
//        var nItem = dashboardData.datasources.length;
//        var REFRESH_TIME = (Math.floor((nItem - 1) / 5) + 1) * REFRESH_TIME_unit;
//        for (var i = 0; i < dashboardData.datasources.length; i++) {
//            if (parseInt(dashboardData.datasources[i].settings.refresh) < REFRESH_TIME)
//            {
//                dashboardData.datasources[i].settings.refresh = REFRESH_TIME;
//            }
//        }
//        ;
        //added by ken 2015/11/23
        ConnectionPool.clear();
//        freeboardUI.showLoadingIndicator(true);
        _.delay(function () {
            self.deserialize(dashboardData, function () {
                if (_.isFunction(callback))
                    callback();
                freeboardUI.showLoadingIndicator(false);
                freeboard.emit('dashboard_loaded');
            });
        }, 10);
        if (typeof contentsource === 'undefined' || contentsource.toLowerCase() !== 'local') {
            $('body').data('Content', JSON.stringify(dashboardData));
        }
    };
    this.loadDashboardFromLocalFile = function () {

        //Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var input = document.createElement('input');
            input.id = 'myfile';
            input.type = 'file';
            $(input).css({
                'visibility': 'hidden'
            });
            $(input).on('change', function (event) {
                var files = event.target.files;
                if (files && files.length > 0) {
                    var file = files[0];
                    var reader = new FileReader();
                    reader.addEventListener('load', function (fileReaderEvent) {

                        var textFile = fileReaderEvent.target;
                        var jsonObject = JSON.parse(textFile.result);
                        self.loadDashboard(jsonObject, 'local');
                    });
                    reader.readAsText(file);
                }
                if (head.browser.ie)
                    $('#myfile').remove();
            });
            if (head.browser.ie) {
                document.body.appendChild(input);
                var evt = document.createEvent('MouseEvents');
                evt.initEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                input.dispatchEvent(evt);
            } else {
                $(input).trigger('click');
            }
        } else {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.Error_LoadFileFail');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes);
        }
    };
    this.loadDashboardFromDataBase = function () {
        //Edit by Ashley
        var activeSheet = $('#tabs').find('.ui-state-default').eq([$.cookie('ActiveSheet')]);
        var requestURL = "dashboard/api/sheet";
        $.ajax({
            url: requestURL,
            dataType: "json",
            type: "GET",
            cache: false,
            data: '',
            contentType: "application/json",
            beforeSend: function (xhr) {
                switch (_oRMM.Login.type) {
                    case "Azure" :
                        var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                        xhr.setRequestHeader("Authorization", authorization);
                        xhr.setRequestHeader("Accept", "application/json");
                        break;
                    case "AzureIII" :
                        var authorization = 'Bearer ' + _oRMM.Login.sso;
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
                logger.debug('success to load sheet as below: ');
                logger.debug(data);
                if (!TokenValidation(data))
                    return;
                if (!_.isUndefined(data.result.ErrorCode)) {

                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                } else if (data.result == 'false') {

                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_LoadingFail');
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                } else {
                    var sheetName = activeSheet.find('a').attr('title');
                    var bFound = false;
                    for (var i = 0; i < data.result.length; i++)
                    {
                        var sheetList = data.result[i].sheet;
                        var DSContent = data.result[i].content;
                        if (sheetList == sheetName) {
                            bFound = true;
                            //var jsonObject = JSON.parse(DSContent);
                            self.loadDashboard(DSContent);
                            break;
                        }
                    }
                    if (!bFound)
                    {
                        freeboardUI.showLoadingIndicator(false);
                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _no = $.i18n.t('global.no'),
                                _ask = $.i18n.t('global.dialogMsg.Info_sheetRemoved');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes, "", function (okcancel) {
                            if (okcancel == 'ok') {
                                //Reload DashBoard
                                self.refreshDashboard();
                            }
                        });
                    }
                }
            },
            error: function (xhr, status, error) {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);
            }
        });
    };
    this.LoadDashboardSheetList = function (queryByAcc, accType) {
        $.ajax({
            url: "dashboard/api/sheet",
            dataType: "json",
            type: "GET",
            cache: false,
            data: '',
            contentType: "application/json",
            beforeSend: function (xhr) {
                switch (_oRMM.Login.type) {
                    case "Azure" :
                        var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                        xhr.setRequestHeader("Authorization", authorization);
                        xhr.setRequestHeader("Accept", "application/json");
                        break;
                    case "AzureIII" :
                        var authorization = 'Bearer ' + _oRMM.Login.sso;
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
                    $("div#tabs .ui-state-default").remove();
                    if (data.result.length > 0) {
                        var DSBoardArray = data.result;
                        var sortResult = DSBoardArray.sort(function (a, b) {
                            return a.sequence - b.sequence;
                        });
                        var i = 0;
                        while (sortResult[i]) {

                            if (typeof sortResult[i].sheet == 'number') {
                                var tabLabel = self.toFixed(sortResult[i].sheet).toString();
                            } else {
                                var tabLabel = sortResult[i].sheet;
                            }

                            var did = sortResult[i].did;
                            var sq = sortResult[i].sequence;
                            var num_tabs = $("div#tabs ul li.ui-state-default").length + 1;
                            if (tabLabel.length > 11) {

                                $("<li><a title='" + tabLabel + "' href='javascript:void(0)'>" + tabLabel.slice(0, 11) + "</a><i style='line-height:32px; padding-right: 5px;' class='fa-w fa-ellipsis-h'></li>").data('did', did).data('sequence', sq).insertBefore($("#add-tab").parent());
                            } else {
                                $("<li><a title='" + tabLabel + "' href='javascript:void(0)'>" + tabLabel + "</a></li>").data('did', did).data('sequence', sq).insertBefore($("#add-tab").parent());
                            }
                            $("div#tabs").append("<div id='tab" + num_tabs + "'></div>");
                            i++;
                        }

                        $("div#tabs").tabs("refresh");
                        var currenthash = window.location.hash.substr(1);
                        var inintialSheet = decodeURI(currenthash.split('sheet=')[1]);
                        var inintialSheetCount = 0;
                        $('#tabs ul').find('.ui-state-default').each(function () {
                            var $this = $(this).children('a');
                            var eachName = $this.attr('title');
                            if (inintialSheet === eachName) {
                                inintialSheetCount = $(this).data('sequence') - 1;
                            }
                        });
                        $('div#tabs').tabs({
                            active: inintialSheetCount
                        });
                        $.cookie('ActiveSheet', inintialSheetCount, {
                            path: '/'
                        });
                        var DSContent = sortResult[$.cookie('ActiveSheet')].content;
                        //var jsonObject = JSON.parse(DSContent);
                        self.loadDashboard(DSContent);
                    } else {

                        $('<li class="newTab"><a title="NewBoard" href="javascript:void(0)">NewBoard</a></li>').insertBefore($("#add-tab").parent());
                        $('<div id="tab1"></div>').insertAfter('#tabs ul');
                        $("div#tabs").tabs("refresh");
                        //if (!$('body').data('bundleVer') && $('body').data('isEditable')) {
                        //    self.editPrivilegeCheck($("div#tabs ul li.ui-state-default").eq(0));
                        //}
                        self.saveDashboard($("div#tabs ul li.ui-state-default").eq(0));
                        $('body').data('Content', JSON.stringify(self.serialize()));
                        $('div#tabs').tabs({
                            active: 0
                        });
                        $.cookie('ActiveSheet', 0, {
                            path: '/'
                        });
                    }

                    $('#tabs li').removeClass('ui-corner-top');
                    var i = 0;
                    while ($('#tabs .ui-state-default').eq(i).length != 0) {

                        $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
                        i++;
                    }

                    $('.notificationNumber').html('0').hide();

                    window.history.pushState('', '', window.location.pathname);
            },
            error: function (xhr, status, error) {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);
            }
        });

        self.bindSortableTab();

        if ($('#queryShareAccount label').attr('aid') !== $.cookie('mobileacountId')) {

            $("#tabs .ui-tabs-nav").sortable("disable");

        }

        //if (self.longPollingWebSocket === null) {
        //    self.startNotification();
        //}
    };
    this.bindSortableTab = function () {

        $("#tabs .ui-tabs-nav").sortable({
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

                self.editPrivilegeCheck($(ui.item[0]));
            }
        });

        $('#tabs li').removeClass('ui-corner-top');

    };
    this.refreshDashboard = function () {

        freeboardUI.showLoadingIndicator(true);

        var aid = $('#queryShareAccount').find('label').attr('aid');

        self.LoadDashboardSheetList(aid, 'shareAcc');
    };
    this.privilegeCheck = function () {
//        if ($('#queryShareAccount label').attr('aid') !== $.cookie('mobileacountId')) {
//            return false;
//        }
//        ;
        return true;
    };
    this.editPrivilegeCheck = function (targetItem) {

        if (!self.privilegeCheck()) {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.info_noPrivilege');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes);
            return;

        } else {

            if ($('.notificationNumber').is(':visible')) {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _no = $.i18n.t('global.no'),
                        _ask = $.i18n.t('global.dialogMsg.info_isEdit');
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                    if (okcancel === 'ok') {
                        $('.notificationNumber').html('0').hide();
                        self.saveDashboard(targetItem);
                        return;
                    } else {
                        return;
                    }
                });
            } else {
                self.saveDashboard(targetItem);
            }
        }
    };
    this.saveDashboard = function (targetItem) {
        var requestURL = "dashboard/api/sheet";
        var method = "POST";
        var did = $('#tabs .ui-state-active').data('did');
        var sequence = $('#tabs .ui-state-active').data('sequence');
        var sheetName = $('#tabs .ui-state-active>a').attr('title');
        var content = JSON.stringify(self.serialize());
        var body = '{"sheet" : "' + sheetName + '","content" : ' + content + ',"sequence" : ' + sequence + '}';

        if (!_.isUndefined(targetItem) && targetItem[0]) {
            if (!targetItem.hasClass('newTab') && !targetItem.hasClass('SQChange')) {
                method = "PUT";
                requestURL = requestURL + "/" + did;
                did = targetItem.data('did');
                sequence = targetItem.data('sequence');
                sheetName = targetItem.find('a').attr('title');
            } else if (!targetItem.hasClass('newTab') && targetItem.hasClass('SQChange')) {
                method = "PUT";
                requestURL = requestURL + "/" + did;
                did = targetItem.data('did');
                sequence = targetItem.data('sequence');
                sheetName = targetItem.find('a').attr('title');
            } else if (targetItem.hasClass('newTab')) {
                method = "POST";
                content = '{"version":1,"allow_edit":true,"plugins":[],"panes":[],"datasources":[],"columns":3}';
                sequence = targetItem.data('sequence');
                sheetName = targetItem.find('a').attr('title');
                body = '{"sheet" : "' + sheetName + '","content" : ' + content + ',"sequence" : ' + sequence + '}';
                sheetName = targetItem.find('a').attr('title');
            }
        } else {
            method = "PUT";
            requestURL = requestURL + "/" + did;
        }

        $.ajax({
            url: requestURL,
            type: method,
            cache: false,
            data: body,
            contentType: "application/json",
            beforeSend: function (xhr) {
                switch (_oRMM.Login.type) {
                    case "Azure" :
                        var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                        xhr.setRequestHeader("Authorization", authorization);
                        xhr.setRequestHeader("Accept", "application/json");
                        break;
                    case "AzureIII" :
                        var authorization = 'Bearer ' + _oRMM.Login.sso;
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
                if (!_.isUndefined(data.result.ErrorCode)) {

                    if (data.result.ErrorCode == 1303) {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + $.i18n.t('global.dialogMsg.Info_sheetNameDuplicated');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                            if (okcancel) {
                                //Reload DashBoard
                                //location.reload();
                                self.refreshDashboard();
                                freeboardUI.showLoadingIndicator(false);
                            }
                        });
                    } else {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + $.i18n.t('global.dialogMsg.Errorcode') + data.result.ErrorCode;
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);
                    }

                } else if (data.result == 'false') {

                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_SavedFail', sheetName);
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                } else {

                    if (!_.isUndefined(targetItem) && targetItem[0]) {

                        if (targetItem.hasClass('newTab')) {

                            targetItem.data('did', data.result.did);
                            targetItem.removeClass('newTab');
                            self.loadDashboardFromDataBase();
                        }

                        if (targetItem.hasClass('SQChange')) {

                            targetItem.removeClass('SQChange');
                        }
                    } else {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Info_SavedSuccess');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);
                    }

                    $('body').data('Content', JSON.stringify(self.serialize()));
                    _.delay(function () {
                        freeboardUI.showLoadingIndicator(false);
                    }, 3000);
                }
            },
            error: function (xhr, status, error) {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);
            }
        });
    };
    this.saveDashboardtoLocalFile = function () {

        var contentType = 'application/octet-stream';
        var blob = new Blob([JSON.stringify(self.serialize())], {'type': contentType});
        var fileName = $('#tabs .ui-state-active').find('a').attr('title');
        var file = fileName + '.json';
        if (head.browser.ie) {
            window.navigator.msSaveBlob(blob, file);
        } else {
            var url = (window.URL || window.webkitURL);
            var data = url.createObjectURL(blob);
            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            var a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
            a.href = data;
            a.download = file;
            a.dispatchEvent(e);
        }
    };
    this.deleteSheet = function () {
        logger.debug('deleteSheet');
        var totalSheetCount = $('#tabs .ui-state-default').length;
        logger.debug('sheet count: ' + totalSheetCount);
        if (!self.privilegeCheck()) {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.info_noPrivilege');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes);
            return;
        }

        if ($('.notificationNumber').is(':visible')) {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _no = $.i18n.t('global.no'),
                    _ask = $.i18n.t('global.dialogMsg.info_isEdit');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                if (okcancel === 'ok') {
                    $('.notificationNumber').html('0').hide();
                    if (totalSheetCount != 1) {
                        var activeCount = $.cookie('ActiveSheet');
                        var activeSheet = $('#tabs').find('.ui-state-default').eq(activeCount);
                        var sheetName = activeSheet.find('a').attr('title');
                        logger.debug('activeSheet: ' + activeSheet + ', sheetName: ' + sheetName);
                        var _title = $.i18n.t('PluginEditor.delete.title'),
                                _yes = $.i18n.t('global.yes'),
                                _no = $.i18n.t('global.no'),
                                _ask = $.i18n.t('global.dialogMsg.Confirm_Delete', sheetName);
                        var phraseElement = $('<p>' + _ask + ' ？</p>');
                        var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                            if (okcancel === 'ok') {

                                logger.debug('start to call delete sheet API');
                                var did = activeSheet.data('did');
                                if (typeof (did) != 'undefined') {
                                    var requestURL = 'dashboard/api/sheet/' + did;
                                    var method = "DELETE";
                                    var body = '';
                                    $.ajax({
                                        url: requestURL,
                                        type: method,
                                        cache: false,
                                        data: body,
                                        contentType: "application/json",
                                        beforeSend: function (xhr) {
                                            switch (_oRMM.Login.type) {
                                                case "Azure" :
                                                    var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                                                    xhr.setRequestHeader("Authorization", authorization);
                                                    xhr.setRequestHeader("Accept", "application/json");
                                                    break;
                                                case "AzureIII" :
                                                    var authorization = 'Bearer ' + _oRMM.Login.sso;
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
                                            if (!TokenValidation(data))
                                                return;
                                            if (!_.isUndefined(data.result.ErrorCode)) {
                                                var _title = $.i18n.t('global.warning'),
                                                        _yes = $.i18n.t('global.yes'),
                                                        _ask = $.i18n.t('global.dialogMsg.Error_DeleteFail', sheetName);
                                                var phraseElement = $('<p>' + _ask + '</p>');
                                                //var db = new DialogBox(phraseElement, _title, _yes);
                                                var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                                    if (okcancel == 'ok') {
                                                        //Reload DashBoard
                                                        self.refreshDashboard();
                                                    }
                                                });
                                            } else {

                                                activeSheet.remove();
                                                $("div#tabs").tabs("refresh");
                                                $('#tabs li').removeClass('ui-corner-top');
                                                var i = 0;
                                                while ($('#tabs .ui-state-default').eq(i).length != 0) {

                                                    $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
                                                    i++;
                                                }

                                                var newActive = activeCount - 1;
                                                if (newActive < 0) {
                                                    newActive = 0;
                                                }

                                                $('div#tabs').tabs({
                                                    active: newActive
                                                });
                                                $.cookie('ActiveSheet', newActive, {
                                                    path: '/'
                                                });
                                                self.loadDashboardFromDataBase();
                                            }
                                        },
                                        error: function (xhr, status, error) {
                                            var _title = $.i18n.t('global.warning'),
                                                    _yes = $.i18n.t('global.yes'),
                                                    _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes);
                                        }
                                    });
                                } else {
                                    logger.error('CANNOT find did');
                                }

                            }
                        });
                    } else {

                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Info_sheetAmount');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);
                    }
                    return;
                } else {
                    return;
                }
            });
        } else {

            if (totalSheetCount != 1) {
                var activeCount = $.cookie('ActiveSheet');
                var activeSheet = $('#tabs').find('.ui-state-default').eq(activeCount);
                var sheetName = activeSheet.find('a').attr('title');
                logger.debug('activeSheet: ' + activeSheet + ', sheetName: ' + sheetName);
                var _title = $.i18n.t('PluginEditor.delete.title'),
                        _yes = $.i18n.t('global.yes'),
                        _no = $.i18n.t('global.no'),
                        _ask = $.i18n.t('global.dialogMsg.Confirm_Delete', sheetName);
                var phraseElement = $('<p>' + _ask + ' ？</p>');
                var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                    if (okcancel === 'ok') {
                        logger.debug('start to call delete sheet API');
                        var currentUrl = document.URL.split('dashboard.jsp')[0];
                        currentUrl = "/";
                        var did = activeSheet.data('did');
                        if (typeof (did) != 'undefined') {
                            var requestURL = 'dashboard/api/sheet/' + did;
                            var method = "DELETE";
                            var body = '';
                            $.ajax({
                                url: requestURL,
                                type: method,
                                cache: false,
                                data: body,
                                contentType: "application/json",
                                beforeSend: function (xhr) {
                                    switch (_oRMM.Login.type) {
                                        case "Azure" :
                                            var authorization = 'Bearer ' + $.base64.encode(JSON.stringify(_oRMM.Login.sso));
                                            xhr.setRequestHeader("Authorization", authorization);
                                            xhr.setRequestHeader("Accept", "application/json");
                                            break;
                                        case "AzureIII" :
                                            var authorization = 'Bearer ' + _oRMM.Login.sso;
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
                                    if (!TokenValidation(data))
                                        return;
                                    if (!_.isUndefined(data.result.ErrorCode)) {

                                        var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + $.i18n.t('global.dialogMsg.Errorcode') + data.result.ErrorCode;
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes);
                                    } else if (data.result == 'false') {

                                        var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Error_DeleteFail', sheetName);
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes);
                                    } else {

                                        activeSheet.remove();
                                        $("div#tabs").tabs("refresh");
                                        $('#tabs li').removeClass('ui-corner-top');
                                        var i = 0;
                                        while ($('#tabs .ui-state-default').eq(i).length != 0) {

                                            $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
                                            i++;
                                        }

                                        var newActive = activeCount - 1;
                                        if (newActive < 0) {
                                            newActive = 0;
                                        }

                                        $('div#tabs').tabs({
                                            active: newActive
                                        });
                                        $.cookie('ActiveSheet', newActive, {
                                            path: '/'
                                        });
                                        self.loadDashboardFromDataBase();
                                    }
                                },
                                error: function (xhr, status, error) {

                                    var _title = $.i18n.t('global.warning'),
                                            _yes = $.i18n.t('global.yes'),
                                            _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                                    var phraseElement = $('<p>' + _ask + '</p>');
                                    var db = new DialogBox(phraseElement, _title, _yes);
                                }
                            });
                        } else {
                            logger.error('CANNOT find did');
                        }

                    }
                });
            } else {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Info_sheetAmount');
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);
            }
        }
    };
    this.getThemeType = function () {
        var currentUrl = document.URL.split('dashboard.jsp')[0];
        currentUrl = "/";
        var accountId = $.cookie('mobileacountId');
        var requestURL = encodeURI(currentUrl + 'webresources/AccountMgmt/');
        var method = "GET";
        $.ajax({
            url: requestURL,
            type: method,
            cache: false,
            data: '',
            contentType: "application/json",
            beforeSend: function (xhr) {
                var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                xhr.setRequestHeader("Authorization", authorization);
                xhr.setRequestHeader("Accept", "application/json");
            },
            success: function (data) {
                if (!TokenValidation(data))
                    return;
                var eachAcc = '';
                var themeType = 1;
                for (var i = 0; i < data.result.totalsize; i++) {
                    if (data.result.item[i]) {
                        eachAcc = data.result.item[i].aid.toString();
                        if (eachAcc === accountId) {
                            themeType = data.result.item[i].theme;
                            self.longPollingLastevtID = data.result.item[i].lasteventid;
                            $.cookie('themeType', themeType, {
                                path: '/'
                            });
                            switch (themeType) {

                                case 0:
                                    $('body').addClass('theme_white');
                                    $('#themeWhite').hide();
                                    $('#themeBlack').show();
                                    break;
                                case 1:
                                    break;
                            }
                            continue;
                        }
                    } else {
                        eachAcc = data.result.item.aid.toString();
                        if (eachAcc === accountId) {
                            themeType = data.result.item.theme;
                            self.longPollingLastevtID = data.result.item.lasteventid;
                            $.cookie('themeType', themeType, {
                                path: '/'
                            });
                            switch (themeType) {

                                case 0:
                                    $('body').addClass('theme_white');
                                    $('#themeWhite').hide();
                                    $('#themeBlack').show();
                                    break;
                                case 1:
                                    break;
                            }
                            break;
                        }
                    }
                }
            },
            error: function (xhr, status, error) {

            }
        });
    };
    this.queryShareAccount = function () {
        if ($('.dropdownMenu').length === 0) {
            var currentUrl = document.URL.split('dashboard.jsp')[0];
            currentUrl = "/";
            var requestURL = encodeURI(currentUrl + 'webresources/ShareMgmt/getShareAccount/');
            var method = "GET";
            $.ajax({
                url: requestURL,
                type: method,
                cache: false,
                data: '',
                contentType: "application/json",
                beforeSend: function (xhr) {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("Accept", "application/json");
                },
                success: function (data) {
                    if (!TokenValidation(data))
                        return;
                    if (data.result.totalsize !== 0) {
                        var item = data.result.item;
                        var shareSrcAccount = '';
                        var shareSrcAid;
                        var shareAccountMenu = "";
                        if ($.isArray(item) === true) {
                            for (var i = 0; i < item.length; i++) {

                                shareSrcAccount = item[i].srcaccountname;
                                shareSrcAid = item[i].srcaccountid;
                                shareAccountMenu = shareAccountMenu + '<li aid="' + shareSrcAid + '">' + shareSrcAccount + '</li>';
                            }
                        } else {
                            shareSrcAccount = item.srcaccountname;
                            shareSrcAid = item.srcaccountid;
                            shareAccountMenu = shareAccountMenu + '<li aid="' + shareSrcAid + '">' + shareSrcAccount + '</li>';
                        }

                        var dropdownMenu = $('<div class="dropdownMenu"><ul class="collapse"></ul></div>');
                        var $shareAccountMenu = $(shareAccountMenu).click(
                                function () {
                                    freeboardUI.showLoadingIndicator(true);
                                    var $this = $(this);
                                    var shareAcc = $this.attr('aid');
                                    var shareName = $this.html();
                                    $.cookie('preShareAcc', $('#queryShareAccount label').attr('aid'), {
                                        path: '/'
                                    });
                                    $.cookie('preShareAccName', $('#queryShareAccount label').html(), {
                                        path: '/'
                                    });

                                    //Save first
                                    $('.notificationNumber').html("0").hide();
                                    var prevData = JSON.parse($('body').data('Content'));
                                    var content = freeboard.serialize();
                                    if (Object.equals(prevData, content) == false) {
                                        self.editPrivilegeCheck();
                                    }

                                    //Load
                                    self.LoadDashboardSheetList(shareAcc, 'shareAcc');
                                    $('#queryShareAccount label').attr('aid', shareAcc).html(shareName);
                                    _.delay(function () {
                                        freeboardUI.showLoadingIndicator(false);
                                    }, 1000);
                                });
                        $('#queryShareAccount').addClass('buttonActived');
                        $('#queryShareAccount').append(dropdownMenu);
                        $('#queryShareAccount .dropdownMenu').find('ul').append($shareAccountMenu);
                        var items = $('#queryShareAccount .dropdownMenu li').get();
                        items.sort(function (a, b) {
                            var keyA = $(a).text();
                            var keyB = $(b).text();
                            if (keyA < keyB)
                                return -1;
                            if (keyA > keyB)
                                return 1;
                            return 0;
                        });
                        var ul = $('#queryShareAccount ul');
                        shareSrcAccount = decryption($.cookie('selectedTabPageaccount'));
                        shareSrcAid = $.cookie('mobileacountId');
                        ul.append($('<li class="rootAcc" aid="' + shareSrcAid + '">' + shareSrcAccount + '</li>').click(
                                function () {
                                    freeboardUI.showLoadingIndicator(true);
                                    var $this = $(this);
                                    var shareAcc = $this.attr('aid');
                                    var shareName = $this.html();
                                    $.cookie('preShareAcc', $('#queryShareAccount label').attr('aid'), {
                                        path: '/'
                                    });
                                    $.cookie('preShareAccName', $('#queryShareAccount label').html(), {
                                        path: '/'
                                    });

                                    //Save first
                                    $('.notificationNumber').html("0").hide();
                                    var prevData = JSON.parse($('body').data('Content'));
                                    var content = freeboard.serialize();
                                    if (Object.equals(prevData, content) == false) {
                                        self.editPrivilegeCheck();
                                    }

                                    //Load
                                    self.LoadDashboardSheetList(shareAcc, 'shareAcc');
                                    $('#queryShareAccount label').attr('aid', shareAcc).html(shareName);
                                    _.delay(function () {
                                        freeboardUI.showLoadingIndicator(false);
                                    }, 1000);
                                }));
                        $.each(items, function (i, li) {
                            ul.append(li);
                        });
                    }

                },
                error: function (xhr, status, error) {

                }
            });
        } else {
            $('#queryShareAccount').removeClass('buttonActived');
            $('.dropdownMenu').remove();
        }
    };
    this.resetShareAcc = function () {

        $('#queryShareAccount label').attr('aid', $.cookie('preShareAcc')).html($.cookie('preShareAccName'));
    };
    this.themeWhite = function () {
        $('body').toggleClass('theme_white');
        $('#themeWhite').hide();
        $('#themeBlack').show();
        $.cookie('themeType', 0, {
            path: '/'
        });
    };
    this.themeBlack = function () {
        $('body').toggleClass('theme_white');
        $('#themeBlack').hide();
        $('#themeWhite').show();
        $.cookie('themeType', 1, {
            path: '/'
        });
    };
    this.exitDashboard = function () {
        switch (_oRMM.Login.type) {
            case "Azure" :
                if (m_AzureUser != null)
                {
                    if (typeof m_AzureUser.profile != "undefined")
                    {
                        m_AzureAuthContext.logOut();
                    }
                }
                break;
            case "AzureIII" :
                $.ajax({
                    url: GLOBAL_CONFIG.hostUrl + '/sso/auth',
                    method: 'DELETE'
                }).done(function() {
                    var redirectUrl = 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=' + GLOBAL_CONFIG.hostUrl + '/web/index.html';
                    window.location.href = redirectUrl;
                });
                break;
            case "Self" :
            default:
                window.location.href = "/";
                break;
        }
    };
    this.toFixed = function (x) {
        if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                x *= Math.pow(10, e - 1);
                x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
        } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                e -= 20;
                x /= Math.pow(10, e);
                x += (new Array(e + 1)).join('0');
            }
        }
        return x;
    };
    this.addDatasource = function (datasource) {
        self.datasources.push(datasource);
    };
    this.deleteDatasource = function (datasource) {
        delete self.datasourceData[datasource.name()];
        datasource.dispose();
        self.datasources.remove(datasource);
    };
    //added by ken 2015/10/19
    this.getDatasouceByName = function (datasourceName) {
        logger.info('getDatasouceByName');
        logger.debug('datasourceName: ' + datasourceName);
        var targetDs = null;
        _.each(self.datasources(), function (datasource) {
            logger.debug('check ds name: ' + datasource.name());
            if (datasource.name() === datasourceName) {
                logger.debug('find ds with: ' + datasourceName);
                targetDs = datasource;

            }
        });
        return targetDs;
    };
    //added by ken 2015/11/03
    this.addContentPack = function () {
        logger.info('addContentPack');
        if (!self.privilegeCheck()) {

            var _title = $.i18n.t('global.warning'),
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.info_noPrivilege');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes);
            return;
        } else {
            if ($('.notificationNumber').is(':visible')) {

                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _no = $.i18n.t('global.no'),
                        _ask = $.i18n.t('global.dialogMsg.info_isEdit');
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                    if (okcancel === 'ok') {
                        $('.notificationNumber').html('0').hide();
                        freeboardUI.addContentPack();
                        return;
                    } else {
                        return;
                    }
                });
            } else {
                freeboardUI.addContentPack();
            }
        }
    };
    this.addNewSheet = function () {
        logger.info('create an New tab');

        if (!self.privilegeCheck()) {

            var _title = $.i18n.t('global.warning'),
                _yes = $.i18n.t('global.yes'),
                _ask = $.i18n.t('global.dialogMsg.info_noPrivilege');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes);

            return;
        }

        if ($('.notificationNumber').is(':visible')) {

            var _title = $.i18n.t('global.warning'),
                _yes = $.i18n.t('global.yes'),
                _no = $.i18n.t('global.no'),
                _ask = $.i18n.t('global.dialogMsg.info_isRefresh');
            var phraseElement = $('<p>' + _ask + '</p>');
            var db = new DialogBox(phraseElement, _title, _yes, _no, function (okcancel) {
                if (okcancel === 'ok') {
                    $('.notificationNumber').html('0').hide();
                    //Reload DashBoard
                    self.refreshDashboard();
                    return;
                } else {
                    return;
                }
            });
        } else {

            if ($("div#tabs ul li.ui-state-default").length <= 7) {
                var overlay = $('<div id="modal_overlay"></div>');
                $('body').append(overlay);
                freeboardUI.showLoadingIndicator(true);

                var prevData = JSON.parse($('body').data('Content'));
                var content = freeboard.serialize();

                if (Object.equals(prevData, content) == false) {

                    self.saveDashboard($("div#tabs ul li.ui-state-default").eq($.cookie('ActiveSheet')));
                }

                var num_tabs = $("div#tabs ul li.ui-state-default").length + 1;
                var comparePass = 1;
                var compareFail = 1;

                while (compareFail != 0) {

                    comparePass = 0;
                    compareFail = 0;

                    var newName = 'NewBoard(' + num_tabs + ')';

                    $('#tabs .ui-state-default').find('a').each(function () {

                        var eachName = $(this).attr('title');

                        if (eachName == newName) {

                            num_tabs++;
                            compareFail++;

                        } else {

                            comparePass++;

                        }
                    });
                }
                ;

                var newTab = $('<li class="newTab"><a title="NewBoard(' + num_tabs + ')" href="javascript:void(0)">NewBoard(' + num_tabs + ')</a></li>');
                newTab.insertBefore($("#add-tab").parent());
                $('<div id="tab' + num_tabs + '"></div>').insertAfter('#tabs ul');
                $("div#tabs").tabs("refresh");

                var i = 0;
                while ($('#tabs .ui-state-default').eq(i).length != 0) {

                    $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
                    i++;
                }

                $('#tabs li').removeClass('ui-corner-top');

                var sheetLength = $("div#tabs ul li.ui-state-default").length;

                $('div#tabs').tabs({
                    active: sheetLength - 1
                });

                $.cookie('ActiveSheet', sheetLength - 1, {
                    path: '/'
                });

                self.saveDashboard($("div#tabs ul li.ui-state-default").eq($.cookie('ActiveSheet')));

            } else {

                var _title = $.i18n.t('global.warning'),
//                        'Warning',
                    _yes = $.i18n.t('global.yes'),
                    _ask = $.i18n.t('global.dialogMsg.Info_sheetAmountMax');
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);

            }
        }
    };
    this.createPane = function () {
        var paneReady = true;
        $('.gs_w').each(function () {

            var $this = $(this);
            var opacity = $this.css('opacity');
            if (typeof opacity === 'undefined') {

                opacity = $this.attr('style').indexOf('opacity');
            } else if (opacity === '1') {

                opacity = -1;
            } else {

                opacity = 1;
            }
            if (opacity > -1) {

                paneReady = false;
            }
        });
        if (paneReady === true) {
//        
//        if($('#add-pane').attr('disabled') === 'disabled'){
//            return;
//        }
//        $('#add-pane').attr('disabled', true);
            logger.info('createPane');
            var newPane = new PaneModel(self, widgetPlugins);
            self.addPane(newPane);
        }
    };
    this.startNotification = function () {

        //logger.info('startNotification');
        if (self.longPollingLastevtID === '') {
            self.getThemeType();
            setTimeout(function () {
                self.startNotification();
            }, 1000);
            return;
        }

        try {
            var strServer = document.URL;
            var strHost = "ws://" + strServer.split("/")[2] + "/websocket/" + $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':'
                    + decryption($.cookie('selectedTabPagepassword'))) + "/" + self.longPollingLastevtID;
            if (location.protocol === 'https:')
                strHost = "wss://" + strServer.split("/")[2] + "/websocket/" + $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':'
                        + decryption($.cookie('selectedTabPagepassword'))) + "/" + self.longPollingLastevtID;

            logger.info('strHost : ' + strHost);
            self.longPollingWebSocket = new WebSocket(strHost);
            self.longPollingWebSocket.onopen = function () {
                logger.info('WebSocket opened');
            };

            self.longPollingWebSocket.onmessage = function (msg) {
                logger.info('onmessage : ' + msg.data);
                self.processNotification(msg.data);
            };

            self.longPollingWebSocket.onclose = function () {
                logger.info('WebSocket close');
            };

            self.longPollingWebSocket.onerror = function () {
                logger.info('WebSocket onerror ');
            };
        } catch (exception) {
            self.longPollingWebSocket = null;
        }

        self.isLongPolling = false;
        setTimeout(function () {
            self.longPolling();
        }, 3000);
    };
    this.longPolling = function () {

        if (self.longPollingWebSocket === null)
        {
            if (self.isLongPolling === false)
            {
                logger.info('LongPolling submit');
                self.isLongPolling = true;
                var currentUrl = document.URL.split('dashboard.jsp')[0];
                currentUrl = "/";
                var requestURL = encodeURI(currentUrl + 'webresources/EventMgmt/long-polling/');
                var data = $.parseXML('<request><item name="lasteventid" value="' + self.longPollingLastevtID + '"></item></request>');
                $.ajax({
                    url: requestURL,
                    type: "post",
                    cache: false,
                    data: data,
                    async: true,
                    dataType: 'text',
                    contentType: 'application/xml',
                    beforeSend: function (xhr) {
                        var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                        xhr.setRequestHeader("Authorization", authorization);
                    },
                    success: function (data) {
                        if (!TokenValidation(data))
                            return;
                        if ($(data).find('result').text() === 'false')
                        {
                            return;
                        }
                        self.processNotification(data);
                    },
                    error: function (xhr, status, error) {
                    }
                });
            }
        }

        setTimeout(function () {
            self.longPolling();
        }, 1000);
    };
    this.processNotification = function (xmlResponse) {

        logger.info('processNotification');
        $(xmlResponse).find("item").each(function ()
        {
            //console.log("Type : " + $(this).find("type").text() + " , SubType : " + $(this).find("subtype").text() + " Session id(web) : " + frmServer_m_SessionID + " Session id(db) : " + $(this).find("sessionid").text());
            //update eventID 
            self.longPollingLastevtID = parseInt($(this).find("eventID").text());
            var strType = $(this).find("type").text();
            var strSubType = $(this).find("subtype").text();
            var strSessionID = $(this).find("sessionid").text();
            var strAccountName = $(this).find("accountName").text();
            if (strType === "Operation")
            {
                if ((strSessionID !== self.sessionID) && (strAccountName == $('#queryShareAccount label').html()))
                {
                    if (strSubType.toLowerCase().indexOf('dashboard') > -1)
                    {
                        var notificationNumber = parseInt($('.notificationNumber').html());
                        notificationNumber++;
                        $('.notificationNumber').html(notificationNumber);
                    }
                }
            }

        });
        if (parseInt($('.notificationNumber').html()) !== 0) {
            $('.notificationNumber').show();
            $("#tabs .ui-tabs-nav").sortable("disable");
        }
    };
    this.addGridColumnLeft = function () {
        freeboardUI.addGridColumnLeft();
    };
    this.addGridColumnRight = function () {
        freeboardUI.addGridColumnRight();
    };
    this.subGridColumnLeft = function () {
        freeboardUI.subGridColumnLeft();
    };
    this.subGridColumnRight = function () {
        freeboardUI.subGridColumnRight();
    };
    this.addPane = function (pane) {
        self.panes.push(pane);
//        setTimeout(function () {
//            $('#add-pane').removeAttr("disabled");
//        }, 500);
    };
    this.deletePane = function (pane) {
        logger.info('deletePane');
        pane.dispose();
        self.panes.remove(pane);
    };
    this.deleteWidget = function (widget) {
        ko.utils.arrayForEach(self.panes(), function (pane) {
            pane.widgets.remove(widget);
        });
        widget.dispose();
    };
    this.updateDatasourceNameRef = function (newDatasourceName, oldDatasourceName) {
        _.each(self.panes(), function (pane) {
            _.each(pane.widgets(), function (widget) {
                widget.updateDatasourceNameRef(newDatasourceName, oldDatasourceName);
            });
        });
    };
    $.fn.transform = function (axis) {
        var ret = 0;
        var elem = this;
        var matrix = elem.css('transform').replace(/[^0-9\-.,]/g, '').split(',');
        if (axis == 'y')
            ret = matrix[13] || matrix[5];
        else if (axis == 'x')
            ret = matrix[12] || matrix[4];
        if (_.isUndefined(ret))
            ret = 0;
        return ret;
    };
    this.setEditing = function (editing, animate) {
        // Don't allow editing if it's not allowed
        if (!self.allow_edit() && editing)
            return;
        self.isEditing(editing);
        if (editing === false) {
            if (self.isVisibleDatasources())
                self.setVisibilityDatasources(false);
            if (self.isVisibleBoardTools())
                self.setVisibilityBoardTools(false);
        }

        var barHeight = $('#admin-bar').outerHeight();
        var headerHeight = $('#main-header').outerHeight();
        if (!editing) {
            if (!$('body').data('bundleVer')) {
                $("#tabs .ui-tabs-nav").sortable("disable");
                $('.editLink').hide();
            }
            freeboardUI.disableGrid();
            $('#toggle-header-icon').addClass('fa-wrench').removeClass('fa-chevron-up');
            $('.sub-section-tools').css('display', '');
            $('.gridster .gs_w').css({cursor: 'default'});
            if (head.browser.ie) {
                $('#main-header').css('top', '-' + barHeight + 'px');
                $('#board-content').css('top', '80px');
            } else {
                $('#main-header').css('transform', 'translateY(-' + barHeight + 'px)');
                $('#board-content').css('transform', 'translateY(80px)');
                _.delay(function () {
//                    $('#admin-menu').css('display', 'none');
                }, 200);
            }
            $('.sub-section').unbind();
        } else {
            if (!$('body').data('bundleVer')) {
                $("#tabs .ui-tabs-nav").sortable("enable");
                $('.editLink').show();
            }
            $('#toggle-header-icon').addClass('fa-chevron-up').removeClass('fa-wrench');
            $('.gridster .gs_w').css({cursor: 'pointer'});
            if (head.browser.ie) {
                $('#main-header').css('top', '0px');
                $('#board-content').css('top', headerHeight + 'px');
            } else {
                $('#main-header').css('transform', 'translateY(0px)');
                $('#board-content').css('transform', 'translateY(' + headerHeight + 'px)');
            }
//            $('#admin-menu').css('display', 'block');
            freeboardUI.attachWidgetEditIcons($('.sub-section'));
            freeboardUI.enableGrid();
        }

        freeboardUI.showPaneEditIcons(editing, true);
    };
    this.setVisibilityDatasources = function (visibility, animate) {
        // Don't allow editing if it's not allowed
        if (!self.allow_edit())
            return;
        self.isVisibleDatasources(visibility);
        var ds = $('#datasources');
        var width = ds.outerWidth();
        if (visibility === true) {
            ds.css('display', 'block');
            ds.css('transform', 'translateX(-' + width + 'px)');
            $('#datasources').data('DSvisibility', true);
            var calHeight =
                    $('.datasource-container').css('height').split('px')[0] -
                    $('.datasource-container-header').css('height').split('px')[0] -
                    $('.datasource-container-header').css('padding-top').split('px')[0] -
                    $('.datasource-container-header').css('padding-bottom').split('px')[0] -
                    $('.datasource-toolbar').css('height').split('px')[0] -
                    $('.datasource-toolbar').css('padding-top').split('px')[0] -
                    $('.datasource-toolbar').css('padding-bottom').split('px')[0];
            $('.datasource-container-list').css('max-height', calHeight + 'px');
        } else {
            ds.css('transform', 'translateX(' + width + 'px)');
            _.delay(function () {
                ds.css('display', 'none');
            }, 300);
            $('#datasources').data('DSvisibility', false);
        }

    };
    this.setVisibilityBoardTools = function (visibility, animate) {
        // Don't allow editing if it's not allowed
        if (!self.allow_edit())
            return;
        self.isVisibleBoardTools(visibility);
        var mh = $('#main-header');
        var bc = $('#board-content');
        var bt = $('#board-tools');
        var mhHeight = mh.outerHeight();
        var width = bt.outerWidth();
        var debounce = _.debounce(function () {
            // media query max-width : 960px
            if ($('#hamburger').css('display') == 'none') {
                self.setVisibilityBoardTools(false);
                $(window).off('resize', debounce);
            }
        }, 500);
        if (visibility === true) {
            $('html').addClass('boardtools-opening');
            $('#board-actions > ul').removeClass('collapse');
            if (head.browser.ie) {
                mh.offset({top: 0, left: width});
                bc.offset({top: mhHeight, left: width});
            } else {
                mh.css('transform', 'translate(' + width + 'px, ' + mh.transform('y') + 'px)');
                bc.css('transform', 'translate(' + width + 'px, ' + bc.transform('y') + 'px)');
            }

            $(window).resize(debounce);
        } else {
            $('html').removeClass('boardtools-opening');
            $('#board-actions > ul').addClass('collapse');
            if (head.browser.ie) {
                mh.offset({top: 0, left: 0});
                bc.offset({top: mhHeight, left: 0});
            } else {
                mh.css('transform', 'translate(0px, ' + mh.transform('y') + 'px)');
                bc.css('transform', 'translate(0px, ' + bc.transform('y') + 'px)');
            }

            $(window).off('resize', debounce);
        }
    };
    this.toggleEditing = function () {
        self.setEditing(!self.isEditing());
    };
    this.toggleDatasources = function () {
        self.setVisibilityDatasources(!self.isVisibleDatasources());
    };
    this.toggleBoardTools = function () {
        self.setVisibilityBoardTools(!self.isVisibleBoardTools());
    };
    this.toggleSetting = function () {
        if ($('#plugin-editor .advancedSetting').is(':visible')) {

            $('.advancedSetting').hide();
            $('#plugin-toggleSetting .fa-caret-square-o-up').hide();
            $('#plugin-toggleSetting .fa-caret-square-o-down').show();
        } else {

            $('.advancedSetting').show();
            $('#plugin-toggleSetting .fa-caret-square-o-up').show();
            $('#plugin-toggleSetting .fa-caret-square-o-down').hide();
        }
    };

}
