/*
 * Template widget 
 * Integration with SA Fans
 * @author: ken.tsai@advantech.com.tw
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.nodeRedThreshold.js'
    });
    logger.info('SA.wg.nodeRedThreshold.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'nodeRedThreshold',
        display_name: $.i18n.t('plugins_wd.nodeRedThreshold.display_name'),
        description: $.i18n.t('plugins_wd.nodeRedThreshold.description'),
        fill_size: true,
        settings: [
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
                type: 'text'
            },
            {
                name: 'url',
                display_name: $.i18n.t('plugins_wd.nodeRedThreshold.nodeURL'),
                type: 'text',
                default_value: 'http://localhost:1880/',
            },
            {
                name: 'value',
                display_name: $.i18n.t('global.data'),
                type: 'number',
                description: 'function',
                default_value: 0,
            },
            {
                name: 'nodeName',
                display_name: $.i18n.t('plugins_wd.nodeRedThreshold.nodeName'),
                type: 'text'
            },
            {
                name: 'interval',
                display_name: $.i18n.t('plugins_wd.nodeRedThreshold.interval'),
                type: 'number',
                style: 'width:100px',
                validate: 'required,custom[number],min[1],max[10000]',
                default_value: 5,
                addClass: 'advancedSetting'
            },
            {
                name: 'min_value',
                display_name: $.i18n.t('global.plugins_wd.min_max_value'),
                //$.i18n.t('plugins_wd.gauge.min_value'),
                type: 'number',
                style: 'width:100px',
                validate: 'required,custom[number],min[-100000000000],max[100000000000]',
                default_value: 0,
                addClass: 'advancedSetting'
            },
            {
                name: 'max_value',
                display_name: $.i18n.t('global.plugins_wd.min_max_value'),
//                        $.i18n.t('plugins_wd.gauge.max_value'),
                type: 'number',
                style: 'width:100px',
                validate: 'required,custom[number],min[-100000000000],max[100000000000]',
                default_value: 100,
                description: $.i18n.t('global.plugins_wd.min_max_value_desc'),
                addClass: 'advancedSetting'
                        //$.i18n.t('plugins_wd.gauge.max_value_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: nodeRedThresholdWidget newInstance');
            newInstanceCallback(new nodeRedThresholdWidget(settings));
        }
    });


    var nodeRedThresholdWidget = function (settings)
    {
        logger.info('nodeRedThresholdWidget init');
        var self = this;
        var currentSettings = settings;
        var mainContainer;
        var timValueChange;
        var oNodeRed = "";
        self.widgetType = 'nodeRedThreshold';

        self.render = function (containerElement)
        {
            logger.info('nodeRedThresholdWidget : render');
            mainContainer = $(containerElement);
            mainContainer.append('<h2 class="section-title"></h2>');
            var strSlider = '<input class="single-slider" type="hidden" value="0.0"/>';
            mainContainer.append('<div class="widget-nodeRedThreshold" alifg="center" style="margin: 20px;">' + strSlider + '</div>');
            self.onSettingsChanged(currentSettings);
        };

        self.onSettingsChanged = function (newSettings)
        {
            logger.info('nodeRedThresholdWidget : onSettingsChanged');
            currentSettings = newSettings;
            //title
            mainContainer.find(".section-title").html(currentSettings.title);
            self.createSlider();
            self.getNodeRed();
            
            //ValueChange
            clearTimeout(timValueChange);
            timValueChange = setTimeout(function () {
                 self.ValueChange();
            }, parseInt(currentSettings.interval)*1000);
        };

        self.createSlider = function ()
        {
            var bChanged = false;
            var oOption = mainContainer.find('.widget-nodeRedThreshold .single-slider').jRange('getOptions');

            bChanged = (bChanged || (oOption.width != $('.widget-nodeRedThreshold').width()));
            bChanged = (bChanged || (oOption.from != currentSettings.min_value));
            bChanged = (bChanged || (oOption.to != currentSettings.max_value));
            if (bChanged)
            {
                var nMax = Math.max(currentSettings.min_value, currentSettings.max_value);
                var nMin = Math.min(currentSettings.min_value, currentSettings.max_value);
                mainContainer.find('.widget-nodeRedThreshold').remove()
                var strSlider = '<input class="single-slider" type="hidden" value="0.0"/>';
                mainContainer.append('<div class="widget-nodeRedThreshold" alifg="center" style="margin: 20px;">' + strSlider + '</div>');
                mainContainer.find('.widget-nodeRedThreshold .single-slider').jRange({
                    from: nMin,
                    to: nMax,
                    //step: 1,
                    //scale: [-2.0,-1.0,0.0,1.0,2.0],
                    format: '%s',
                    width: mainContainer.find('.widget-nodeRedThreshold').width(),
                    showLabels: true,
                    snap: true
                });
                //mainContainer.find('.widget-nodeRedThreshold .single-slider').jRange('setValue', currentSettings.value);
            }
        }

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
            logger.info('nodeRedThresholdWidget : onCalculatedValueChanged: name : ' + settingName + ' value : ' + newValue);
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !mainContainer.find(".section-title").hasClass('agentDisconnect')) || (agentConnection === true && mainContainer.find(".section-title").hasClass('agentDisconnect'))) {
                mainContainer.find(".section-title").toggleClass('agentDisconnect');
                mainContainer.find(".section-title").removeAttr('title');
            }
        };

        this.onDispose = function () {
            clearTimeout(timValueChange);
        };
        self.getNodeRed = function ()
        {
            logger.info('nodeRedThresholdWidget : getNodeRed');
            var authorization = 'Basic ' + $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':' + decryption($.cookie('selectedTabPagepassword')));
            jQuery.support.cors = true;
            var ajaxOpts = {
                cache: false,
                type: 'get',
                //contentType: 'application/json',
                url: '/webresources/HttpMgmt?url=' + currentSettings.url + "flows&authorization=" + authorization,
                async: false,
                timeout: 60 * 1000,
                error: function (jqXHR, textStatus, errorThrown) {
                    try {
                        var xmlDoc = $.parseXML(jqXHR.responseText);
                        var $oXml = $(xmlDoc);
                        var oResponse = {};
                        var oResult = {};
                        oResult.ErrorCode = $oXml.find("ErrorCode").text();
                        oResult.Description = $oXml.find("Description").text();
                        oResult.Field = $oXml.find("Field").text();
                        oResult.FieldValue = $oXml.find("FieldValue").text();
                        oResponse.result = oResult;
                        if (!TokenValidation(oResponse)) return;
                    }
                    catch (e){}
                    
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                    //Auto hide
                    _.delay(function () {
                        if ($('#modal_overlay').length) {
                            var overlay = $('#modal_overlay');
                            _.delay(function () {
                                _.delay(function () {
                                    overlay.remove();
                                }, 500);
                            }, 500);
                        } else {
                            _.delay(function () {
                                loadingIndicator.removeClass('show').addClass('hide');
                                _.delay(function () {
                                    loadingIndicator.remove();
                                }, 500);
                            }, 500);
                        }
                    }, 3000);
                },
                beforeSend: function (xhr) {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    //xhr.setRequestHeader('Accept', 'applicaton/json');
                },
                success: function (response, textStatus, xhr) {
                    if (!TokenValidation(response)) return;
                    try {
                        oNodeRed = response;
                        for (var i = 0; i < oNodeRed.length; i++) {
                            var oNode = oNodeRed[i];
                            if ((oNode.type.indexOf('function') > -1) && (oNode.name.toLowerCase().indexOf(currentSettings.nodeName.toLowerCase()) > -1))
                            {
                                var aTemp = oNode.func;
                                if (aTemp.length > 0)
                                {
                                    var aTemp2 = aTemp.split("=")[1].split(';')[0];
                                    currentSettings.value = parseInt(aTemp2).toString();
                                    mainContainer.find('.widget-nodeRedThreshold .single-slider').jRange('setValue', currentSettings.value);
                                    break;
                                }
                            }
                        }
                    }
                    catch (e) {};
                }
            };
            $.ajax(ajaxOpts);
        };

        self.setNodeRed = function ()
        {
            var authorization = 'Basic ' + $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':' + decryption($.cookie('selectedTabPagepassword')));
            var oData = {};
            oData.request = {};
            oData.request.url = currentSettings.url + "flows";
            oData.request.authorization = authorization;
            oData.request.content = oNodeRed;
            jQuery.support.cors = true;
            var ajaxOpts = {
                cache: false,
                type: 'post',
                contentType: 'application/json',
                url: '/webresources/HttpMgmt/node-red',
                async: false,
                timeout: 60 * 1000,
                error: function (jqXHR, textStatus, errorThrown) {
                    try {
                        var xmlDoc = $.parseXML(jqXHR.responseText);
                        var $oXml = $(xmlDoc);
                        var oResponse = {};
                        var oResult = {};
                        oResult.ErrorCode = $oXml.find("ErrorCode").text();
                        oResult.Description = $oXml.find("Description").text();
                        oResult.Field = $oXml.find("Field").text();
                        oResult.FieldValue = $oXml.find("FieldValue").text();
                        oResponse.result = oResult;
                        if (!TokenValidation(oResponse)) return;
                    }
                    catch (e){}
                    
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                    var phraseElement = $('<p>' + _ask + '</p>');
                    var db = new DialogBox(phraseElement, _title, _yes);
                    //Auto hide
                    _.delay(function () {
                        if ($('#modal_overlay').length) {
                            var overlay = $('#modal_overlay');
                            _.delay(function () {
                                _.delay(function () {
                                    overlay.remove();
                                }, 500);
                            }, 500);
                        } else {
                            _.delay(function () {
                                loadingIndicator.removeClass('show').addClass('hide');
                                _.delay(function () {
                                    loadingIndicator.remove();
                                }, 500);
                            }, 500);
                        }
                    }, 3000);
                },
                beforeSend: function (xhr) {
                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                    xhr.setRequestHeader("Authorization", authorization);
                    //xhr.setRequestHeader('Accept', 'applicaton/json');
                },
                success: function (response, textStatus, xhr) {
                    if (!TokenValidation(response)) return;
                    if (response.httpStatusCode != 204)
                    {
                        var _title = $.i18n.t('global.warning'),
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);
                    }
                }
            };

            ajaxOpts.data = JSON.stringify(oData);
            $.ajax(ajaxOpts);
        };
        
        self.ValueChange = function ()
        {
            if (mainContainer.find('.widget-nodeRedThreshold .single-slider').val() != currentSettings.value)
            {
                for (var i = 0; i < oNodeRed.length; i++) {
                    var oNode = oNodeRed[i];
                    if ((oNode.type.indexOf('function') > -1) && (oNode.name.toLowerCase().indexOf(currentSettings.nodeName.toLowerCase()) > -1))
                    {
                        var aTemp = oNode.func;
                        if (aTemp.length > 0)
                        {
                            var aTemp2 = aTemp.split("=")[1].split(';')[0];
                            var nValue = parseInt(aTemp2).toString();
                            oNode.func = oNode.func.replace(nValue, mainContainer.find('.widget-nodeRedThreshold .single-slider').val());
                            self.setNodeRed();
                            currentSettings.value = mainContainer.find('.widget-nodeRedThreshold .single-slider').val();
                            break;
                        }
                    }
                }
            }
            else
            {
                self.getNodeRed();
            }
            
            //ValueChange
            clearTimeout(timValueChange);
            timValueChange = setTimeout(function () {
                 self.ValueChange();
            }, parseInt(currentSettings.interval)*1000);
        }
    };
}());