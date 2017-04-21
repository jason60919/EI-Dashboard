// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

PluginEditor = function (jsEditor, valueEditor) {

    'use strict';

    //added by ken 2015/09/15
    var pluginEditorLog = log4jq.getLogger({
        loggerName: 'PluginEditor.js'
    });

    //Added by Ashley
    function _getlistfn(name, getlistfn, accept, appendpath, data, currentValues) {
        var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
        loadingIndicator.removeClass('hide').appendTo('body').addClass('show');
        var strURL = currentValues.serverUrl + getlistfn.url;

        $.ajax({
            url: strURL,
            type: getlistfn.method,
            data: data,
            contentType: accept,
            beforeSend: function (xhr) {
                try {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("Accept", "application/json");
                }
                catch (e) {}
            },
            success: function (data) {
                if (!TokenValidation(data)) return;
                if (typeof data.ErrorCode == "undefined") 
                {
                    var i = 0;
                    switch (name) {
                        case "device":
                            while (i < data.devices.length) {
                                $("<option></option>").text(data.devices[i].name).attr("did", data.devices[i].did).attr("value", data.devices[i].agentId).appendTo(appendpath);
                                i++;
                            }
                            appendpath.parents().eq(2).show();
                            if ((typeof currentValues != 'undefined') && (typeof currentValues.device != 'undefined'))
                            {
                                $('#setting-row-device select').val(currentValues.device);
                                $('#setting-row-device select').trigger("change");
                            }
                            
                            _.delay(function () {
                                loadingIndicator.removeClass('show').addClass('hide');
                                _.delay(function () {
                                    loadingIndicator.remove();
                                }, 500);
                            }, 500);
                            break;
                        case "plugin":
                            while (i < data.Plugins.length) {
                                $("<option></option>").text(data.Plugins[i].plugin).attr("value", data.Plugins[i].plugin).appendTo(appendpath);
                                i++;
                            }
                            appendpath.parents().eq(2).show();
                            if ((typeof currentValues != 'undefined') && (typeof currentValues.plugin != 'undefined'))
                            {
                                $('#setting-row-plugin select').val(currentValues.plugin);
                                $('#setting-row-plugin select').trigger("change");
                            }
                            
                            _.delay(function () {
                                loadingIndicator.removeClass('show').addClass('hide');
                                _.delay(function () {
                                    loadingIndicator.remove();
                                }, 500);
                            }, 500);
                            break;
                        case "source":
                            while (i < data.sensorIds.length) {
                                $("<option></option>").text(data.sensorIds[i].sensorId).attr("value", data.sensorIds[i].sensorId).appendTo(appendpath);
                                i++;
                            }
                            appendpath.parents().eq(2).show();
                            if ((typeof currentValues != 'undefined') && (typeof currentValues.source != 'undefined'))
                                $('#setting-row-source select').val(currentValues.source);
                            
                            _.delay(function () {
                                loadingIndicator.removeClass('show').addClass('hide');
                                _.delay(function () {
                                    loadingIndicator.remove();
                                }, 500);
                            }, 500);
                            break;
                    }
                } else {
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + $.i18n.t('global.dialogMsg.Errorcode') + data.result.ErrorCode;
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                    _.delay(function () {
                        loadingIndicator.removeClass('show').addClass('hide');
                        _.delay(function () {
                            loadingIndicator.remove();
                        }, 500);
                    }, 500);
                }
            },
            error: function (xhr, status, error) {
                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Error') + '! ' + xhr.statusText;
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes);

                _.delay(function () {
                    loadingIndicator.removeClass('show').addClass('hide');
                    _.delay(function () {
                        loadingIndicator.remove();
                    }, 500);
                }, 500);
            }
        });
    }

    function _removeSettingsRows() {
        if ($('#setting-row-instance-name').length)
            $('#setting-row-instance-name').nextAll().remove();
        else
            $('#setting-row-plugin-types').nextAll().remove();
    }

    function _toValidateClassString(validate, type) {
        var ret = '';
        if (!_.isUndefined(validate)) {
            var types = '';
            if (!_.isUndefined(type))
                types = ' ' + type;
            ret = 'validate[' + validate + ']' + types;
        }
        return ret;
    }

    function _isNumerical(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    //create calculated field
    function _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, includeRemove) {
        //input field of data source 
        var input = $('<textarea></textarea>').addClass(_toValidateClassString(settingDef.validate, 'text-input')).attr('style', settingDef.style);

        if (settingDef.multi_input) {

            input.change(function () {
                var arrayInput = [];
                $(valueCell).find('textarea').each(function () {
                    var thisVal = $(this).val();
                    if (thisVal)
                        arrayInput = arrayInput.concat(thisVal);
                });
                newSettings.settings[settingDef.name] = arrayInput;
            });

        } else {
            input.change(function () {
                newSettings.settings[settingDef.name] = $(this).val();
            });
        }

        if (currentValue)
            input.val(currentValue);

        valueEditor.createValueEditor(input);

        var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');
        var wrapperDiv = $('<div class="calculated-setting-row"></div>');

        wrapperDiv.append(input).append(datasourceToolbox);

        //
        // data soruce select
        //
        var datasourceTool = $('<li><i class="fa-w fa-plus"></i><label>' + $.i18n.t('PluginEditor.datasource_tool') + '</label></li>')
                .mousedown(function (e) {

                    pluginEditorLog.info('click data source BUTTON');

                    e.preventDefault();
                    $(input).val('').focus().insertAtCaret('datasources[\"').trigger('freeboard-eval');
                });
        datasourceToolbox.append(datasourceTool);

        //
        // data soruce viewer
        // added by ken 2015/09/15
        var datasouceViewer = $('<li><i class="fa-w fa-eye"></i><label>' + $.i18n.t('PluginEditor.datasource_viewer') + '</label></li>')
                .mousedown(function (e) {

                    pluginEditorLog.info('click data source viewer BUTTON');

                    e.preventDefault();

                    jsEditor.displayJSEditor(input.val(), 'jsonviewer', function (result) {
                        //result callback
                        input.val(result);
                        input.change();
                    });

                });
        datasourceToolbox.append(datasouceViewer);

        //
        //
        // js editor
        //
//        var jsEditorTool = $('<li><i class="fa-w fa-edit"></i><label>.JS EDITOR</label></li>')
        var jsEditorTool = $('<li><i class="fa-w fa-edit"></i><label>' + $.i18n.t('PluginEditor.js_editor') + '</label></li>')

                .mousedown(function (e) {
                    e.preventDefault();

                    pluginEditorLog.info('click jsEditor BUTTON');

                    jsEditor.displayJSEditor(input.val(), 'javascript', function (result) {
                        input.val(result);
                        input.change();
                    });
                });
        datasourceToolbox.append(jsEditorTool);

        if (includeRemove) {
            var removeButton = $('<li class="remove-setting-row"><i class="fa-w fa-minus"></i><label></label></li>')
                    .mousedown(function (e) {
                        e.preventDefault();
                        wrapperDiv.remove();
                        $(valueCell).find('textarea:first').change();
                    });
            datasourceToolbox.prepend(removeButton);
        }

        $(valueCell).append(wrapperDiv);
    }

    //Added by Ashley 20150807
    function indexInParent(node)
    {
        var children = node.parent().children();
        var num = 0;
        for (var i = 0; i < children.length; i++) {
            if (children[i].id == node[0].id)
                return num;
            if (children[i].nodeType == 1)
                num++;
        }
        return -1;
    }

    function createSettingRow(form, name, displayName, initial, addClass) {

        //Edit by Ashley

        if (_.isUndefined(initial) || initial)
        {
            var tr = $('<div id="setting-row-' + name + '" class="form-row' + addClass + '"></div>').appendTo(form);
        } else {
            var tr = $('<div id="setting-row-' + name + '" class="form-row' + addClass + '" style="display: none;"></div>').appendTo(form);
        }

        tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
        return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);

//        var tr = $('<div id="setting-row-' + name + '" class="form-row"></div>').appendTo(form);
//
//        tr.append('<div class="form-label"><label class="control-label">' + displayName + '</label></div>');
//        return $('<div id="setting-value-container-' + name + '" class="form-value"></div>').appendTo(tr);
    }

    function appendArrayCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        var subTableDiv = $('<div class="form-table-value-subtable"></div>').appendTo(valueCell);

        var subTable = $('<table class="table table-condensed sub-table"></table>').appendTo(subTableDiv);
        var subTableHead = $('<thead></thead>').hide().appendTo(subTable);
        var subTableHeadRow = $('<tr></tr>').appendTo(subTableHead);
        var subTableBody = $('<tbody></tbody>').appendTo(subTable);

        var currentSubSettingValues = [];

        // Create our headers
        _.each(settingDef.settings, function (subSettingDef) {
            var subsettingDisplayName = subSettingDef.name;

            if (!_.isUndefined(subSettingDef.display_name))
                subsettingDisplayName = subSettingDef.display_name;

            $('<th>' + subsettingDisplayName + '</th>').appendTo(subTableHeadRow);
        });

        if (settingDef.name in currentSettingsValues)
            currentSubSettingValues = currentSettingsValues[settingDef.name];

        var processHeaderVisibility = function () {
            (newSettings.settings[settingDef.name].length > 0) ? subTableHead.show() : subTableHead.hide();
        };

        var createSubsettingRow = function (subsettingValue) {
            var subsettingRow = $('<tr></tr>').appendTo(subTableBody);

            var newSetting = {};

            if (!_.isArray(newSettings.settings[settingDef.name]))
                newSettings.settings[settingDef.name] = [];

            newSettings.settings[settingDef.name].push(newSetting);

            _.each(settingDef.settings, function (subSettingDef) {
                var subsettingCol = $('<td></td>').appendTo(subsettingRow);
                var subsettingValueString = '';

                if (!_.isUndefined(subsettingValue[subSettingDef.name]))
                    subsettingValueString = subsettingValue[subSettingDef.name];

                newSetting[subSettingDef.name] = subsettingValueString;

                $('<input class="table-row-value" type="text">')
                        .addClass(_toValidateClassString(subSettingDef.validate, 'text-input'))
                        .attr('style', settingDef.style)
                        .appendTo(subsettingCol).val(subsettingValueString).change(function () {
                    newSetting[subSettingDef.name] = $(this).val();
                });
            });

            subsettingRow.append($('<td class="table-row-operation"></td>').append($('<ul class="board-toolbar"></ul>').append($('<li></li>').append($('<i class="fa-w fa-trash"></i>').click(function () {
                var subSettingIndex = newSettings.settings[settingDef.name].indexOf(newSetting);

                if (subSettingIndex !== -1) {
                    newSettings.settings[settingDef.name].splice(subSettingIndex, 1);
                    subsettingRow.remove();
                    processHeaderVisibility();
                }
            })))));

            subTableDiv.scrollTop(subTableDiv[0].scrollHeight);

            processHeaderVisibility();
        };

        $('<div class="table-operation text-button">' + $.i18n.t('PluginEditor.table_operation') + '</div>').appendTo(valueCell).click(function () {
            var newSubsettingValue = {};

            _.each(settingDef.settings, function (subSettingDef) {
                newSubsettingValue[subSettingDef.name] = '';
            });

            createSubsettingRow(newSubsettingValue);
        });

        // Create our rows
        _.each(currentSubSettingValues, function (currentSubSettingValue, subSettingIndex) {
            createSubsettingRow(currentSubSettingValue);
        });
    }

    function appendBooleanCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        var onOffSwitch = $('<div class="onoffswitch"><label class="onoffswitch-label" for="' + settingDef.name + '-onoff"><div class="onoffswitch-inner"><span class="on">' + $.i18n.t('global.yes') + '</span><span class="off">' + $.i18n.t('global.no') + '</span></div><div class="onoffswitch-switch"></div></label></div>').appendTo(valueCell);

        var input = $('<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="' + settingDef.name + '-onoff">').prependTo(onOffSwitch).change(function () {
            newSettings.settings[settingDef.name] = this.checked;
        });

        if (settingDef.name in currentSettingsValues)
            input.prop('checked', currentSettingsValues[settingDef.name]);
    }

    function appendOptionCell(form, valueCell, settingDef, currentSettingsValues, newSettings, tmpAllSettings) {

        //Edit by Ashley
        if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata' || newSettings.type == 'getHistData') {

            $('#dialog-ok').hide();

        }

        var defaultValue = currentSettingsValues[settingDef.name];


//        var input = $('<select class="required"><option value="undefined">Please select...</option></select>')
        var input = $('<select class="required"><option value="undefined">' + $.i18n.t('PluginEditor.first_option') + '</option></select>')
                .appendTo($('<div class="styled-select"></div>').appendTo(valueCell))
                .change(function ()
                {
                    if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata' || newSettings.type == 'getHistData') {
                        $('#dialog-ok').hide();
                    }
                    $(".validation-error").remove();

                    var $this = $(this);
                    var selectedValue = $(this).val();
                    newSettings.settings[settingDef.name] = selectedValue;

                    if ($('#setting-value-container-plugin-types select').val() == 'dataAnalyze' || $('#setting-value-container-plugin-types select').val() == 'realtimedata' || $('#setting-value-container-plugin-types select').val() == 'getHistData') {
                        var rowData = $(this).parents().eq(2);
                        var clearData = rowData.nextAll('.form-row');

                        clearData.hide();
                        clearData.find('select').val('undefined');

                        var appendpath = $('.modal').find('.form-row').eq(indexInParent(rowData) - 1).find('select');
                        var nextData = tmpAllSettings[indexInParent(rowData) - 1];

                        if (nextData && nextData.options == "") {
                            appendpath.find('option:not(:first)').remove();
                        }

                        if (selectedValue != 'undefined') {
                            if (settingDef.name == "device") {
                                var optSelected = $("option:selected", this);
                                newSettings.settings["did"] = optSelected.attr("did");
                                newSettings.settings["agentId"] = optSelected.val();
                                var m_AgentID = optSelected.val();
                                var m_Did = optSelected.attr("did");
                                var m_AgentID = newSettings.settings["agentId"];
                                var m_Did = newSettings.settings["did"];
                                var dNow = new Date();
                                dNow = new Date(dNow.setDate(dNow.getDate() + 1));
                                var strendTs = dNow.getUTCFullYear() + "-" + (dNow.getUTCMonth() + 1) + "-" + dNow.getUTCDate() + " " + dNow.getUTCHours() + ":" + dNow.getUTCMinutes() + ":" + dNow.getUTCSeconds() + ":000";
                                var dPre = new Date();
                                dPre = new Date(dPre.setDate(dPre.getDate() - 1));
                                var strbeginTs = dPre.getUTCFullYear() + "-" + (dPre.getUTCMonth() + 1) + "-" + dPre.getUTCDate() + " " + dPre.getUTCHours() + ":" + dPre.getUTCMinutes() + ":" + dPre.getUTCSeconds() + ":000";
                                var strParameter = "agentId=" + m_AgentID + "&beginTs=" + strbeginTs + "&endTs=" + strendTs + "&amount=60&order=desc";
                                var oListFun = nextData.getlistfn;
                                oListFun.url = oListFun.url.replace("{did}", m_Did);
                                _getlistfn(nextData.name, oListFun, nextData.accept, appendpath, strParameter, currentSettingsValues);
                            } else if (settingDef.name == "plugin") {
                                var optSelected = $("option:selected", this);
                                var m_AgentID = newSettings.settings["agentId"];
                                var m_Did = newSettings.settings["did"];
                                var m_plugin = optSelected.val();
                                var dNow = new Date();
                                dNow = new Date(dNow.setDate(dNow.getDate() + 1));
                                var strendTs = dNow.getUTCFullYear() + "-" + (dNow.getUTCMonth() + 1) + "-" + dNow.getUTCDate() + " " + dNow.getUTCHours() + ":" + dNow.getUTCMinutes() + ":" + dNow.getUTCSeconds() + ":000";
                                var dPre = new Date();
                                dPre = new Date(dPre.setDate(dPre.getDate() - 1));
                                var strbeginTs = dPre.getUTCFullYear() + "-" + (dPre.getUTCMonth() + 1) + "-" + dPre.getUTCDate() + " " + dPre.getUTCHours() + ":" + dPre.getUTCMinutes() + ":" + dPre.getUTCSeconds() + ":000";
                                var strParameter = "agentId=" + m_AgentID + "&plugin=" + m_plugin + "&beginTs=" + strbeginTs + "&endTs=" + strendTs + "&amount=60&order=desc";
                                var oListFun = nextData.getlistfn;
                                oListFun.url = oListFun.url.replace("{did}", m_Did);
                                _getlistfn(nextData.name, oListFun, nextData.accept, appendpath, strParameter, currentSettingsValues);
                            } else if (settingDef.name == "source") {
                                appendpath.parents().eq(2).show();
                                $('#dialog-ok').show();
                            } else if (settingDef.name == "method") {
                                $('#setting-row-timerange').show();
                                $('#setting-value-container-timerange input').eq(0).trigger('click');
                                $('#dialog-ok').show();
                            }

                            if (settingDef.required) {
                                if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata' || newSettings.type == 'getHistData') {
                                    $('#dialog-ok').show();
                                }
                            }
                        }
                    }
                });

        if (_.isUndefined(settingDef.dynamiclist) || !settingDef.dynamiclist)
        {
            _.each(settingDef.options, function (option)
            {
                var optionName;
                var optionValue;

                if (_.isObject(option))
                {
                    optionName = option.name;
                    optionValue = option.value;
                }
                else
                {
                    optionName = option;
                }

                if (_.isUndefined(optionValue))
                {
                    optionValue = optionName;
                }

                if (_.isUndefined(defaultValue))
                {
                    defaultValue = optionValue;
                }

                $("<option></option>").text(optionName).attr("value", optionValue).appendTo(input);
            });

        } else {
            if ($('body').data($('#setting-value-container-name input').val()) == 'edit') {
                $('#dialog-ok').show();
            }
            if (_.isUndefined(settingDef.initial) || settingDef.initial) {
                var data;
                if (settingDef.name == "user") {
                    var currentSettings = currentSettingsValues;
                    data = "";
                } else if (settingDef.name == "device") {
                    var accoundid = $('#setting-row-user').find('select').val();
                    data = '{"request":{"clause":{"item": [{"@name": "account_id","@value": "' + accoundid + '"}]}, "like": {"item": [{"@name": "condition","@value": ""},{"@name": "field","@value": "name"}]},"orderby": {"item": {"@name": "name","@value": "ASC"}},"resultfilter": {"item": [{"@name": "page size","@value": "100"},{"@name": "page no","@value": "1"}]}}}';
                    data = "";
                } else if (settingDef.name == "source") {
                    var agentId = $('#setting-row-device').find('select').val();
                    var handler = $('#setting-row-handler').find('select').val();
                    data = '{"request":{"agentId": "' + agentId + '", "handler": "' + handler + '"}}';
                }
                _getlistfn(settingDef.name, settingDef.getlistfn, settingDef.accept, input, data, currentSettingsValues);
            }
        }
        newSettings.settings[settingDef.name] = defaultValue;
        if (currentSettingsValues['device']) {
        } else {
            if (settingDef.name in currentSettingsValues)
            {
                input.val(currentSettingsValues[settingDef.name]);
            }
        }
    }

    //Added by Ashley
    function appendRadioCell(form, valueCell, settingDef, currentSettingsValues, newSettings, tmpAllSettings) {

        var defaultValue = currentSettingsValues[settingDef.name];

        if (_.isUndefined(settingDef.dynamiclist) || !settingDef.dynamiclist)
        {
            _.each(settingDef.radios, function (radio)
            {
                var radioName;
                var radioValue;

                if (_.isUndefined(radio.calenderPicker) || !radio.calenderPicker) {
                    if (_.isObject(radio))
                    {
                        radioName = radio.name;
                        radioValue = radio.value;
                    }
                    else
                    {
                        radioName = radio;
                    }

                    if (_.isUndefined(radioValue))
                    {
                        radioValue = radioName;
                    }

                    if (_.isUndefined(defaultValue))
                    {
                        defaultValue = radioValue;
                    }

                    $("<input style='width: 30px;' type='radio' name='range' value='" + radioValue + "' />" + radioName + "<br>").appendTo(valueCell);

                } else {

                    $("<input id='customDate' style='width: 30px;' type='radio' name='range' value='' /><input style='width: 30%;' type='text' id='startdate'> to <input style='width: 30%;' type='text' id='enddate'><br>").appendTo(valueCell);
                    $("#startdate").attr('disabled', 'disabled').datepicker(
                            {
                                showOtherMonths: true,
                                inline: true,
                                dateFormat: 'yy-mm-dd',
                                onSelect: function () {

                                    var start = $(this).val();
                                    var end = $("#enddate").val();
                                    var startDate = new Date(start.split('-')[0], start.split('-')[1], start.split('-')[2]);
                                    var endDate = new Date(end.split('-')[0], end.split('-')[1], end.split('-')[2]);

                                    if ($("#startdate").val() == '') {


                                        var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Info_StartDateSelect');
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                            if (okcancel) {
                                                $("#enddate").val('');
                                            }
                                        });

                                    } else {
                                        if (endDate < startDate) {

                                            var _title = $.i18n.t('global.warning'),
                                                    _yes = $.i18n.t('global.yes'),
                                                    _ask = $.i18n.t('global.dialogMsg.Info_EndDateSelect');
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                                if (okcancel) {
                                                    $("#enddate").val('');
                                                }
                                            });

                                        } else {
                                            $('#customDate').val(start + '&' + end);
                                            newSettings.settings[settingDef.name] = $('#customDate').val();

                                            if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata') {
                                                $('#dialog-ok').show();

                                            }

                                        }
                                    }
                                }
                            });

                    $("#enddate").attr('disabled', 'disabled').datepicker(
                            {
                                showOtherMonths: true,
                                inline: true,
                                dateFormat: 'yy-mm-dd',
                                onSelect: function () {

                                    var start = $("#startdate").val();
                                    var end = $(this).val();
                                    var startDate = new Date(start.split('-')[0], start.split('-')[1], start.split('-')[2]);
                                    var endDate = new Date(end.split('-')[0], end.split('-')[1], end.split('-')[2]);

                                    if ($("#startdate").val() == '') {


                                        var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Info_StartDateSelect');
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                            if (okcancel) {
                                                $("#enddate").val('');
                                            }
                                        });

                                    } else {
                                        if (endDate < startDate) {

                                            var _title = $.i18n.t('global.warning'),
                                                    _yes = $.i18n.t('global.yes'),
                                                    _ask = $.i18n.t('global.dialogMsg.Info_EndDateSelect');
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                                                if (okcancel) {
                                                    $("#enddate").val('');
                                                }
                                            });

                                        } else {
                                            $('#customDate').val(start + '&' + end);
                                            newSettings.settings[settingDef.name] = $('#customDate').val();

                                            if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata') {
                                                $('#dialog-ok').show();

                                            }

                                        }
                                    }
                                }
                            });
                }
            });

        }

        $('#setting-value-container-timerange input[type=radio]').on("click", function () {

            $(".validation-error").remove();

            if ($(this).is(':checked')) {

                newSettings.settings[settingDef.name] = $(this).val();

                if ($(this).attr('id') == 'customDate') {

                    $("#startdate").removeAttr('disabled');
                    $("#enddate").removeAttr('disabled');

                    if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata') {

                        $('#dialog-ok').hide();

                    }


                } else {

                    $("#startdate").attr('disabled', 'disabled');
                    $("#enddate").attr('disabled', 'disabled');

                    if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata') {
                        $('#dialog-ok').show();

                    }


                }
            }

        });

        newSettings.settings[settingDef.name] = defaultValue;

        if (settingDef.name in currentSettingsValues)
        {

            if (currentSettingsValues['timerange'].indexOf('&') >= 0) {

                $("#startdate").val(currentSettingsValues['timerange'].split('&')[0]).removeAttr('disabled');
                $("#enddate").val(currentSettingsValues['timerange'].split('&')[1]).removeAttr('disabled');
                $('#customDate').attr("checked", true);

            } else {
                $('#setting-row-' + settingDef.name).find('input').each(function () {

                    if ($(this).val() == currentSettingsValues['timerange']) {

                        $(this).attr("checked", true);

                    }
                });
            }


            if (newSettings.type == 'dataAnalyze' || newSettings.type == 'realtimedata') {

                $('#dialog-ok').show();

            }

            $('#setting-row-timerange').show();
        }
    }

    function appendColorCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        var curColorPickerID = _.uniqueId('picker-');
        var thisColorPickerID = '#' + curColorPickerID;
        var defaultValue = currentSettingsValues[settingDef.name];
        var input = $('<input id="' + curColorPickerID + '" type="text">').addClass(_toValidateClassString(settingDef.validate, 'text-input')).appendTo(valueCell);

        newSettings.settings[settingDef.name] = defaultValue;

        $(thisColorPickerID).css({
            'border-right': '30px solid green',
            'width': '80px'
        });

        $(thisColorPickerID).css('border-color', defaultValue);

        var defhex = defaultValue;
        defhex.replace('#', '');

        $(thisColorPickerID).colpick({
            layout: 'hex',
            colorScheme: 'dark',
            color: defhex,
            submit: 0,
            onChange: function (hsb, hex, rgb, el, bySetColor) {
                $(el).css('border-color', '#' + hex);
                newSettings.settings[settingDef.name] = '#' + hex;
                if (!bySetColor) {
                    $(el).val('#' + hex);
                }
            }
        }).keyup(function () {
            $(this).colpickSetColor(this.value);
        });

        if (settingDef.name in currentSettingsValues) {
            input.val(currentSettingsValues[settingDef.name]);
        }
    }


    function appendJsonCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        var input = $('<textarea class="calculated-value-input" style="z-index: 3000"></textarea>')
                .addClass(_toValidateClassString(settingDef.validate, 'text-input'))
                .attr('style', settingDef.style)
                .appendTo(valueCell).change(function () {
            newSettings.settings[settingDef.name] = $(this).val();
        });

        if (settingDef.name in currentSettingsValues)
            input.val(currentSettingsValues[settingDef.name]);

        valueEditor.createValueEditor(input);

        var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');

        var jsEditorTool = $('<li><i class="fa-w fa-edit"></i><label>.JSON EDITOR</label></li>').mousedown(function (e) {
            e.preventDefault();

            jsEditor.displayJSEditor(input.val(), 'json', function (result) {
                input.val(result);
                input.change();
            });
        });

        $(valueCell).append(datasourceToolbox.append(jsEditorTool));
    }

    function appendHtmlMixedCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        var input = $('<textarea class="calculated-value-input" style="z-index: 3000"></textarea>')
                .addClass(_toValidateClassString(settingDef.validate, 'text-input'))
                .attr('style', settingDef.style)
                .appendTo(valueCell).change(function () {
            newSettings.settings[settingDef.name] = $(this).val();
        });

        if (settingDef.name in currentSettingsValues)
            input.val(currentSettingsValues[settingDef.name]);

        valueEditor.createValueEditor(input);

        var datasourceToolbox = $('<ul class="board-toolbar datasource-input-suffix"></ul>');

        var jsEditorTool = $('<li><i class="fa-w fa-edit"></i><label>.HTML EDITOR</label></li>').mousedown(function (e) {
            e.preventDefault();

            jsEditor.displayJSEditor(input.val(), 'htmlmixed', function (result) {
                input.val(result);
                input.change();
            });
        });

        $(valueCell).append(datasourceToolbox.append(jsEditorTool));
    }

    function appendTextCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        var input = $('<input type="text">')
                .addClass(_toValidateClassString(settingDef.validate, 'text-input'))
                .attr('style', settingDef.style)
                .appendTo(valueCell).change(function () {

            if (settingDef.type == 'number')
            {
                if ($(this).val() == "")
                    newSettings.settings[settingDef.name] = "";
                else
                    newSettings.settings[settingDef.name] = Number($(this).val());
            }
            else
                newSettings.settings[settingDef.name] = $(this).val();

        }).keyup(function () {

//            if (settingDef.name == 'serverurl') {
//
//                $('#setting-value-container-account input').val('');
//                $('#setting-value-container-password input').val('');
//
//            } else 

            if (settingDef.name == 'account') {

                $('#setting-value-container-password input').val('');

            }

        });

        if (settingDef.name in currentSettingsValues) {
            input.val(currentSettingsValues[settingDef.name]);
        }
    }

    function appendPasswordCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {
        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        var input = $('<input type="password">')
                .addClass(_toValidateClassString(settingDef.validate, 'text-input'))
                .attr('style', settingDef.style)
                .appendTo(valueCell).change(function () {
            if (settingDef.type == 'number')
                newSettings.settings[settingDef.name] = Number($(this).val());
            else
                newSettings.settings[settingDef.name] = $(this).val();
        });

        if (settingDef.name in currentSettingsValues)
            input.val(currentSettingsValues[settingDef.name]);
    }

    //add datasource
    function appendCalculatedCell(form, valueCell, settingDef, currentSettingsValues, newSettings) {

        newSettings.settings[settingDef.name] = currentSettingsValues[settingDef.name];

        if (settingDef.name in currentSettingsValues) {
            var currentValue = currentSettingsValues[settingDef.name];
            if (settingDef.multi_input && _.isArray(currentValue)) {
                var includeRemove = false;
                for (var i = 0; i < currentValue.length; i++) {
                    _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue[i], includeRemove);
                    includeRemove = true;
                }
            } else {
                _appendCalculatedSettingRow(valueCell, newSettings, settingDef, currentValue, false);
            }
        } else {
            _appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, false);
        }

        //genereate mutli-data source
        if (settingDef.multi_input) {
            var inputAdder =
                    $('<ul class="board-toolbar"><li class="add-setting-row"><i class="fa-w fa-plus"></i><label>'
                            + $.i18n.t('global.plugins_wd.tableOperation') + '</label></li></ul>')

                    .mousedown(function (e) {
                        e.preventDefault();
                        _appendCalculatedSettingRow(valueCell, newSettings, settingDef, null, true);
                    });
            $(valueCell).siblings('.form-label').append(inputAdder);
        }
    }

    function createPluginEditor(title, pluginTypes, currentTypeName, currentSettingsValues, settingsSavedCallback, cancelCallback) {

        pluginEditorLog.info('createPluginEditor: ' + title + ', start to create  plugin form');
        pluginEditorLog.debug(currentSettingsValues);//if current widget is new, currentSettingsValues equals {}
        var newSettings = {
            type: currentTypeName,
            settings: {}
        };

        var selectedType;
        var form = $('<form id="plugin-editor"></form>');

        var pluginDescriptionElement = $('<div id="plugin-description"></div>').hide();
        form.append(pluginDescriptionElement);

        //create settings form of widget/datasoruce
        //@param settingsDefs: settings variable
        function createSettingsFromDefinition(settingsDefs) {
            pluginEditorLog.info('createSettingsFromDefinition: settingsDefs as below');
//            pluginEditorLog.debug(settingsDefs);
            var tmpAllSettings = settingsDefs;

            _.each(settingsDefs, function (settingDef) {
                // Set a default value if one doesn't exist
                if (!_.isUndefined(settingDef.default_value) && _.isUndefined(currentSettingsValues[settingDef.name]))
                    currentSettingsValues[settingDef.name] = settingDef.default_value;

                var displayName = settingDef.name;

                if (!_.isUndefined(settingDef.display_name))
                    displayName = settingDef.display_name;

                settingDef.style = _.isUndefined(settingDef.style) ? '' : settingDef.style;
                settingDef.addClass = _.isUndefined(settingDef.addClass) ? '' : settingDef.addClass;

                // modify required field name
                if (!_.isUndefined(settingDef.validate)) {
                    if (settingDef.validate.indexOf('required') != -1) {
                        displayName = '* ' + displayName;
                    }
                }
                // unescape text value
                if (settingDef.type === 'text')
                    currentSettingsValues[settingDef.name] = _.unescape(currentSettingsValues[settingDef.name]);

                var valueCell = createSettingRow(form, settingDef.name, displayName, settingDef.initial, ' ' + settingDef.addClass);
                var input, defaultValue;

                switch (settingDef.type) {
                    case 'array':
                        appendArrayCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'boolean':
                        appendBooleanCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'option':
                        appendOptionCell(form, valueCell, settingDef, currentSettingsValues, newSettings, tmpAllSettings);
                        break;
                    case 'radio':
                        appendRadioCell(form, valueCell, settingDef, currentSettingsValues, newSettings, tmpAllSettings);
                        break;
                    case 'color':
                        appendColorCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'htmlmixed':
                        appendHtmlMixedCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'json':
                        appendJsonCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'text':
                        appendTextCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'password':
                        appendPasswordCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    case 'calculated':
                        appendCalculatedCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                    default:
                        appendTextCell(form, valueCell, settingDef, currentSettingsValues, newSettings);
                        break;
                }

                if (!_.isUndefined(settingDef.suffix))
                    valueCell.append($('<div class="input-suffix">' + settingDef.suffix + '</div>'));

                if (!_.isUndefined(settingDef.description))
                    valueCell.append($('<div class="setting-description">' + settingDef.description + '</div>'));
            });


            if ($('#plugin-editor .advancedSetting').length > 0) {

                var pluginToggleadVancedSetting = $('<div id="plugin-toggleSetting" style="display: block;" class="form-row"><ul class="board-toolbar"><li id="toggleSetting" data-bind="click: toggleSetting"><i class="fa-w fa-caret-square-o-down"></i><i class="fa-w fa-caret-square-o-up"></i><label>' + $.i18n.t('PluginEditor.widget.advancedSetting') + '</label></li></ul></div>');
                pluginToggleadVancedSetting.insertBefore($('#plugin-editor .advancedSetting').first());

                $('.advancedSetting').hide();
                $('#plugin-toggleSetting .fa-caret-square-o-up').hide();

            }
        }

        //create db dialogbox
        pluginEditorLog.debug('create db dialog instance');
//        console .log(form);
        var db = new DialogBox(form, title, $.i18n.t('PluginEditor.dialog.yes'), $.i18n.t('PluginEditor.dialog.no'), function (okcancel) {
            if (okcancel === 'ok') {
                // escape text value
                _.each(selectedType.settings, function (def) {
                    if ((def.type === 'text') && (def.name !== 'title'))
                        newSettings.settings[def.name] = _.escape(newSettings.settings[def.name]);
                    if ((def.type === 'number') && (newSettings.settings[def.name] === ''))
                            newSettings.settings[def.name] = def.default_value;
                });

                if (_.isFunction(settingsSavedCallback))
                    settingsSavedCallback(newSettings);


            } else if (okcancel === 'cancel') {
                if (_.isFunction(cancelCallback))
                    cancelCallback();
            }
            // Remove colorpick dom objects
            $('[id^=collorpicker]').remove();
        });

        // Create our body
        var pluginTypeNames = _.keys(pluginTypes);
        var typeSelect;

        if (pluginTypeNames.length > 1) {
            //create first type Of ROW
            var typeRow = createSettingRow(form, 'plugin-types', $.i18n.t('PluginEditor.type'));
            typeSelect = $('<select></select>').appendTo($('<div class="styled-select"></div>').appendTo(typeRow));

            typeSelect.append($('<option>' + $.i18n.t('PluginEditor.first_option') + '</option>').attr('value', 'undefined'));

            //get all widgets/data sources 
            _.each(pluginTypes, function (pluginType) {
//                 pluginEditorLog.debug('pluginType(widgets/data sources) as below');
//                 pluginEditorLog.debug( pluginType);

                typeSelect.append($('<option></option>').text(pluginType.display_name).attr('value', pluginType.type_name));
            });

            typeSelect.change(function () {
                var pluginType = $(this).val();

                pluginEditorLog.debug('select type( widget/datasource): ' + pluginType);
                newSettings.type = pluginType;
                newSettings.settings = {};

                // Remove all the previous settings
                _removeSettingsRows();

                selectedType = pluginTypes[typeSelect.val()];
                if (_.isUndefined(selectedType)) {
                    $('#setting-row-instance-name').hide();

                    $('#dialog-ok').hide();

                } else {

                    $('#setting-row-instance-name').show();

                    if (selectedType.description && selectedType.description.length > 0)
                        pluginDescriptionElement.html(selectedType.description).show();
                    else
                        pluginDescriptionElement.hide();

                    $('#dialog-ok').show();


                    createSettingsFromDefinition(selectedType.settings);
                }
            });

        } else if (pluginTypeNames.length === 1) {
            selectedType = pluginTypes[pluginTypeNames[0]];
            newSettings.type = selectedType.type_name;
            newSettings.settings = {};
            createSettingsFromDefinition(selectedType.settings);
        }

        if (typeSelect) {
            if (_.isUndefined(currentTypeName)) {
                $('#setting-row-instance-name').hide();

                $('#dialog-ok').hide();

            } else {

                $('#dialog-ok').show();


                typeSelect.val(currentTypeName).trigger('change');
            }
        }

    }

    // Public API (CORE)
    return {
        createPluginEditor: function (
                title,
                pluginTypes,
                currentInstanceName,
                currentTypeName,
                currentSettingsValues,
                settingsSavedCallback) {
            //title=> widget or datasoruce
            pluginEditorLog.info('createPluginEditor: ' + title);
            createPluginEditor(title, pluginTypes, currentInstanceName, currentTypeName, currentSettingsValues, settingsSavedCallback);
        }
    };
};