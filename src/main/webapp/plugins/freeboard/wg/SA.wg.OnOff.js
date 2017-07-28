/*
 * Template widget 
 * Integration with SA Fans
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.OnOff.js'
    });
    logger.info('SA.wg.OnOff.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'OnOff',
        display_name: $.i18n.t('plugins_wd.OnOff.display_name'),
        description: $.i18n.t('plugins_wd.OnOff.description'),
        fill_size: true,
        settings: [
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
                type: 'text'
            },
            {
                name: 'value',
                display_name: $.i18n.t('global.data'),
//                        $.i18n.t('plugins_wd.progressbar.value'),
                type: 'calculated'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: OnOffWidget newInstance');
            newInstanceCallback(new OnOffWidget(settings));
        }
    });


    var OnOffWidget = function (settings)
    {
        logger.info('OnOffWidget init');
        var self = this;
        var currentSettings = settings;
        var mainContainer;
        var bChangeValue = false;
        var timChange;
        var nChangeInterval = 30;
        self.widgetType = 'OnOff';
        self.render = function (containerElement)
        {
            logger.info('OnOffWidget : render');
            var strLoading = '<div class="circularGObj" style="display: none;">';
            strLoading = strLoading + '<div class="circularG circularG_1"></div>';
            strLoading = strLoading + '<div class="circularG circularG_2"></div>';
            strLoading = strLoading + '<div class="circularG circularG_3"></div>';
            strLoading = strLoading + '<div class="circularG circularG_4"></div>';
            strLoading = strLoading + '<div class="circularG circularG_5"></div>';
            strLoading = strLoading + '<div class="circularG circularG_6"></div>';
            strLoading = strLoading + '<div class="circularG circularG_7"></div>';
            strLoading = strLoading + '<div class="circularG circularG_8"></div>';
            strLoading = strLoading + '</div>';
            mainContainer = $(containerElement);
            mainContainer.append('<h2 class="section-title"></h2>');
            mainContainer.append('<div class="widget-OnOff" alifg="center"><label class="switch switch-light"><input class="switch-input" type="checkbox"><span class="switch-label" data-on="' + $.i18n.t('plugins_wd.OnOff.On') + '" data-off="' + $.i18n.t('plugins_wd.OnOff.Off') + '"></span><span class="switch-handle"></span></label></div>');
            mainContainer.append(strLoading);

            //mainContainer.append('<div class="widget-OnOff"><label class="switch switch-light"><input class="switch-input" type="checkbox" checked=true><span class="switch-label" data-on="On" data-off="Off"></span><span class="switch-handle"></span></label></div>');
            self.onSettingsChanged(currentSettings);
            mainContainer.on('click', '.switch-input', function (e) {
                var setCheckBox = $(this).is(':checked');
                //send command to IO
                var aValue = currentSettings.value.split(/"/g);
                var bSet = false;
                if (currentSettings.value.indexOf("datasources") == 0)
                {
                    if (aValue.length > 1)
                    {
                        var oDataSource = freeboard.serialize().datasources;
                        for (var i = 0; i < oDataSource.length; i++)
                        {
                            if (oDataSource[i].name == aValue[1])
                            {
                                bSet = true;
                                var strID = oDataSource[i].settings.device;
                                if (typeof oDataSource[i].settings.senhub != "undefined"){
                                    if (oDataSource[i].settings.senhub.toUpperCase() != "NULL")
                                        strID = oDataSource[i].settings.senhub;
                                }
                                self.setDeviceData(oDataSource[i].settings.handler, strID, oDataSource[i].settings.source, setCheckBox, $(this));
                                
                                //Prevent update from ValueChanged while change value
                                bChangeValue = true
                                clearTimeout(timChange);
                                timChange = setTimeout(function () {
                                     bChangeValue = false;
                                }, nChangeInterval*1000);
                                break;
                            }
                        }
                    }
                }
                if (!bSet)
                {
                    var bVal = setCheckBox;
                    if (bVal === true)
                        bVal = 1;
                    else
                        bVal = 0;
                    self.rollBackCheckBox(bVal, $(this));
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('plugins_wd.OnOff.unableToSet');
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                }
            });
        };

        self.onSettingsChanged = function (newSettings)
        {
            logger.info('OnOffWidget : onSettingsChanged');
            currentSettings = newSettings;
            //title
            mainContainer.find(".section-title").html(currentSettings.title);
            mainContainer.find(".section-title").prop('title', currentSettings.title);
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
            logger.info('OnOffWidget : onCalculatedValueChanged: name : ' + settingName + ' value : ' + newValue);
            if (bChangeValue)
            {
                return;
            }

            //Add icon to specify agent connect or not
            if ((agentConnection === false && !mainContainer.find(".section-title").hasClass('agentDisconnect')) || (agentConnection === true && mainContainer.find(".section-title").hasClass('agentDisconnect'))) {
                mainContainer.find(".section-title").toggleClass('agentDisconnect');
                mainContainer.find(".section-title").removeAttr('title');
            }
            //value
            if (newValue == "1")
            {
                mainContainer.find(".widget-OnOff .switch-input").prop('checked', true);
            }
            else
            {
                mainContainer.find(".widget-OnOff .switch-input").removeAttr('checked');
            }
        };

        self.setDeviceData = function (handler, agentId, sensorId, bVal, oCheckBox)
        {
            mainContainer.find(".circularGObj").show();
            oCheckBox.addClass('ui-disabled').attr('disabled', 'disabled');
//            if (bVal === true)
//                bVal = 1;
//            else
//                bVal = 0;

            var strURL = "";
            var data = '{"request" : { "item" : { "agentId" : "' + agentId + '","handler" : "' + handler + '","sensorId" : { "n" : "' + sensorId + '","bv" : ' + bVal + '}}}}';
            $.ajax({
                cache: false,
                type: 'post',
                url: strURL + '/webresources/DeviceCtl/setDeviceData',
                data: data,
                contentType: 'application/json',
                async: true,
                timeout: 30000,
                xhrFields: {
                    withCredentials: true
                },
                error: function (xhr, exception)
                {
                    self.rollBackCheckBox(bVal, oCheckBox);
                    mainContainer.find(".circularGObj").hide();
                    oCheckBox.removeClass('ui-disabled').removeAttr('disabled', 'disabled');
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            //_ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + " : " + "Device disconected or busy!";
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                },
                beforeSend: function (xhr)
                {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    xhr.setRequestHeader("Accept", "application/json");
                },
                success: function (response)
                {
                    if (!TokenValidation(response)) return;
                    mainContainer.find(".circularGObj").hide();
                    oCheckBox.removeClass('ui-disabled').removeAttr('disabled', 'disabled');
                    if (typeof response.result.ErrorCode !== 'undefined')
                    {
                        self.rollBackCheckBox(bVal, oCheckBox);
                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                //_ask = $.i18n.t('global.dialogMsg.Error_Occurred') + " : " + response.result.Description;
                                _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + " : " + "Device disconected or busy!";
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);
                    }
                    else
                    {
                        var bSuccess = false;
                        var strError = "";
                        if (typeof response.result.itemList !== 'undefined')
                        {
                            if (response.result.itemList.v === 'Success')
                                bSuccess = true;
                            else
                                strError = response.result.itemList.v;
                        }
                        if (!bSuccess)
                        {
                            self.rollBackCheckBox(bVal, oCheckBox);
                            var _title = $.i18n.t('global.warning'),
                                    _yes = $.i18n.t('global.yes'),
//                                    _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
//                                    if (strError != "")
//                                        _ask = _ask + ":" + strError;
                                    _ask = $.i18n.t('global.dialogMsg.Error_Occurred') + " : " + "Device disconected or busy!";
                            var phraseElement = $('<p>' + _ask + '</p>');
                            var db = new DialogBox(phraseElement, _title, _yes);
                        }
                    }
                }
            });
        }

        self.rollBackCheckBox = function (bVal, oCheckBox)
        {
//            switch (bVal) {
//                case 0:
//                    oCheckBox.prop('checked', true);
//                    break;
//                case 1:
//                    oCheckBox.removeAttr('checked');
//                    break;
//            }
            oCheckBox.prop('checked', !bVal);
        }
    };
}());