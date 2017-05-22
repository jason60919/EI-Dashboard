// ┌─────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                │ \\
// ├─────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                       │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                             │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                  │ \\
// ├─────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                  │ \\
// └─────────────────────────────────────────┘ \\

(function() {
    
    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.RFIDStatus.js'
    });
    logger.info('plugin.wg.RFIDStatus.js loaded');
    
    var RFIDStatusWidget = function (settings) {
        
        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentID = _.uniqueId('RFIDStatuswidget_');
        var RFIDStatusElement = $('<div class="RFIDStatuswidget" id="' + currentID + '"></div>');
        var currentSettings = settings;
        self.widgetType = 'RFIDStatus';

        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks;
            RFIDStatusElement.css({
                'height': height + 'px',
                'width': '100%'
            });
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(RFIDStatusElement);
            self.onSettingsChanged(currentSettings);
            setBlocks(currentSettings.blocks);
        };

        this.onSettingsChanged = function (newSettings) {
            
            logger.info('onSettingsChanged');
            setBlocks(newSettings.blocks);

            var updateCalculate = false;
            if (currentSettings.value != newSettings.value){
                updateCalculate = true;
            }
            currentSettings = newSettings;
            //title
            RFIDStatusElement.parent().find(".section-title").html(currentSettings.title);
            
            //this.updateData();
            
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.info('newValue: ' + newValue);
            
            //this.updateData(newValue);
            var aValue = currentSettings.value.split(/"/g);
            if (currentSettings.value.indexOf("datasources") == 0)
            {
                if (aValue.length > 1)
                {
                    var oDataSource = freeboard.serialize().datasources;
                    for (var i = 0; i < oDataSource.length; i++)
                    {
                        if (oDataSource[i].name == aValue[1])
                        {
                            //getCountHistData 
                            //console.log(oDataSource[i].settings);
                            this.getData(oDataSource[i].settings);
                            break;
                        }
                    }
                }
            }
            
        };

        this.onDispose = function () {
            RFIDStatusElement.remove();
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        //this.onSettingsChanged(settings);
        this.getData = function (oDataSource) {
            var strURL = '/webresources/DeviceCtl/getCountHistDataBySV';
            var nOffset = 3;
            var oDateStart = new Date();
            var oDateEnd = oDateStart;
            oDateStart =  new Date(oDateStart - nOffset * 1000);
            var strBeginTs = oDateStart.getUTCFullYear() + "-" + (oDateStart.getUTCMonth() + 1) + "-" + oDateStart.getUTCDate() + " " + oDateStart.getUTCHours() + ":" + oDateStart.getUTCMinutes() + ":" + oDateStart.getUTCSeconds() + ":000";
            var strEndTs = oDateEnd.getUTCFullYear() + "-" + (oDateEnd.getUTCMonth() + 1) + "-" + oDateEnd.getUTCDate() + " " + oDateEnd.getUTCHours() + ":" + oDateEnd.getUTCMinutes() + ":" + oDateEnd.getUTCSeconds() + ":999";
            var oData = {};
            var oRequest = {};
            var oItem = {};
            oItem.agentId = oDataSource.device;
            oItem.handler = oDataSource.handler;
            oItem.sensorId = oDataSource.source;
            //oRequest.beginTs = "2016-09-29 9:10:26:000";
            //oRequest.endTs = "2016-09-29 9:10:26:999";
            oRequest.beginTs = strBeginTs;
            oRequest.endTs = strEndTs;
            oRequest.item = oItem;
            oData.request = oRequest;
            $.ajax({
                cache: false,
                type: 'post',
                url: strURL,
                data: JSON.stringify(oData),
                contentType: 'application/json',
                async: true,
                timeout: 30000,
                xhrFields: {
                    withCredentials: true
                },
                error: function (xhr, exception)
                {
                    var _title = $.i18n.t('global.warning'),
                            _yes = $.i18n.t('global.yes'),
                            _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
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
                    if (typeof response.result.itemList == "undefined")
                    {
                        RFIDStatusElement.find("a").remove();
                        return;
                    }
                    var aExitedID = [];
                    //Remove unexisted user
                    RFIDStatusElement.find("a").each(function() {
                        var bFound = false;
                        if ($.isArray(response.result.itemList))
                        {
                            for(var i=0; i<response.result.itemList.length; i++)
                            {
                                var oItem = response.result.itemList[i];
                                if ($(this).attr("RFID") == oItem.sv)
                                {
                                    aExitedID.push(oItem.sv);
                                    bFound = true;
                                    break;
                                }
                            }
                        }
                        else
                        {
                            var oItem = response.result.itemList;
                            if ($(this).attr("RFID") == oItem.sv)
                            {
                                aExitedID.push(oItem.sv);
                                bFound = true;
                            }
                        }
                        if (!bFound)
                        {
                            $(this).remove();
                        }
                    });                    
                    
                    //RFIDStatusElement.find("a").remove();
                    if ($.isArray(response.result.itemList))
                    {
                        for(var i=0; i<response.result.itemList.length; i++)
                        {
                            var oItem = response.result.itemList[i];
                            if ($.inArray(oItem.sv, aExitedID) > -1)
                                continue;
                            addRFIDUser(oItem);
                            aExitedID.push(oItem.sv);
                        }    
                    }
                    else
                    {
                        var oItem = response.result.itemList;
                        if ($.inArray(oItem.sv, aExitedID) == -1)
                        {
                            addRFIDUser(oItem);
                            aExitedID.push(oItem.sv);
                        }
                    }
                    RFIDStatusElement.find(".fa-user").draggable();
                    RFIDStatusElement.find("[data-toggle=tooltip]").tooltip();
                }
            });
        }
        
        addRFIDUser = function (oItem) {
            if (oItem.sv != null)
            {
                var oRFID = null;
                for (var j=0; j<aRFIDList.length; j++)
                {
                    if (aRFIDList[j].RFID == oItem.sv)
                        oRFID = aRFIDList[j];
                };
                if (oRFID != null)
                {
                    var oUser = $('<a class="fa fa-user fa-2x">');
                    oUser.attr("RFID", oItem.sv);
                    oUser.attr("data-toggle", "tooltip");
                    oUser.attr("data-placement", "right");
                    oUser.attr("data-html", "true");
                    oUser.attr("title", "RFID: " + oItem.sv + " <br> " + "Name: " + oRFID.Name + " <br> Sex : " + oRFID.Sex + "<br> Citizenship: " + oRFID.Citizenship + '<br><img src="js/FreeBoard/plugins/freeboard/wg/Customization/images/' + oRFID.image + '"style="width: 64px;"/>');
                    oUser.css({
                        left: (10 + Math.random()*60) + "%",
                        top: (10 + Math.random()*60) + "%"
                    });
                    if (oRFID.Sex == "Female")
                    {
                        oUser.css("color", "red");
                    }
                    RFIDStatusElement.append(oUser);
                }
                else
                {
                    var oUser = $('<a class="fa fa-user fa-2x">');
                    oUser.attr("RFID", oItem.sv);
                    oUser.attr("data-toggle", "tooltip");
                    oUser.attr("data-placement", "right");
                    oUser.attr("data-html", "true");
                    oUser.attr("title", "RFID: " + oItem.sv + " <br> " + "Name: " + "unknown" + " <br> " + "unknown" + ": Male <br> Citizenship: " + "unknown" + '<br>');
                    oUser.css({
                        left: (10 + Math.random()*60) + "%",
                        top: (10 + Math.random()*60) + "%"
                    });
                    RFIDStatusElement.append(oUser);
                }
            }
        };
        
        this.updateData = function (newValue) {
            RFIDStatusElement.find("a").remove();
            for (var i=0; i<aRFIDList.length; i++)
            {
                var oRFID = aRFIDList[i];
                var oUser = $('<a class="fa fa-user fa-2x">');
                oUser.attr("data-toggle", "tooltip");
                oUser.attr("data-placement", "right");
                oUser.attr("data-html", "true");
                oUser.attr("title", "Name: " + oRFID.Name + " <br> " + oRFID.Sex + ": Male <br> Citizenship: " + oRFID.Citizenship + '<br><img src="js/FreeBoard/plugins/freeboard/wg/Customization/images/' + oRFID.image + '"style="width: 64px;"/>');
                oUser.css({
                    left: (20 + Math.random()*30) + "%",
                    top: (20 + Math.random()*30) + "%"
                });
                if (oRFID.Sex == "Female")
                {
                    oUser.css("color", "red");
                }
                RFIDStatusElement.append(oUser);
            }
            RFIDStatusElement.find(".fa-user").draggable();
            RFIDStatusElement.find("[data-toggle=tooltip]").tooltip();
        };
    };

    freeboard.loadWidgetPlugin({
        type_name: 'RFIDStatus',
//        display_name: $.i18n.t('plugins_wd.html.display_name'),
//        description: $.i18n.t('plugins_wd.html.description'),
        display_name: 'RFID Status',
        description: 'Display current RFID status',
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
                type: 'calculated'
            },
            {
                name: 'blocks',
                display_name: $.i18n.t('global.plugins_wd.blocks'),
                type: 'number',
                validate: 'required,custom[integer],min[1],max[20]',
                style: 'width:100px',
                default_value: 4,
                description: $.i18n.t('global.plugins_wd.blocks_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new RFIDStatusWidget(settings));
        }
    });
}());