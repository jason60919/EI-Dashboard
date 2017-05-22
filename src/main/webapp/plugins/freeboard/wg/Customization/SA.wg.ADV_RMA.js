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
        loggerName: 'plugin.wg.ADV_RMA.js'
    });
    logger.info('plugin.wg.ADV_RMA.js loaded');
    
    var ADV_RMAWidget = function (settings) {
        
        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentID = _.uniqueId('ADV_RMAwidget_');
        var ADV_RMAElement = $('<div class="ADV_RMAwidget" id="' + currentID + '"><table style="margin: 10px; width: 100%;"><tr><td style="width: 100%;"><table class="ADV_RMAText" cellpadding="5" style="width: 100%;"></table></td></tr></table></div>');
        var currentSettings = settings;
        self.widgetType = 'ADV_RMA';

        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks;
            ADV_RMAElement.css({
                'height': height + 'px',
                'width': '100%'
            });
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(ADV_RMAElement);
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
            ADV_RMAElement.parent().find(".section-title").html(currentSettings.title);
            
            this.updateData();
            
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.info('newValue: ' + newValue);
            this.updateData(newValue);
        };

        this.onDispose = function () {
            ADV_RMAElement.remove();
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        //this.onSettingsChanged(settings);
        this.updateData = function (newValue) {
            $.ajax({
                cache: false,
                type: 'get',
                //url: '/WebService_RMA/index.jsp?SN=AKA0815747',
                url: '/WebService_RMA/index.jsp?SN=' + currentSettings.value,
                async: true,
                timeout: 30000,
                xhrFields: {
                    withCredentials: true
                },
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
                    xhr.setRequestHeader("Accept", "application/json");
                },
                success: function (response)
                {
                    ADV_RMAElement.find(".ADV_RMAText").find("tr").remove();
                    var jRma = $.parseJSON(response);
                    var strTR = "";
                    strTR = '<th><tr><td style="background-color: #eeeeee;">No</td><td style="background-color: #eeeeee;">rmano</td><td style="background-color: #eeeeee;">currentStage</td><td style="background-color: #eeeeee;">repairFee</td><td style="background-color: #eeeeee;">status</td></tr></th>';
                    ADV_RMAElement.find(".ADV_RMAText").append(strTR);
                    for (var i = 0; i < jRma.length; i++ ) {
                        var strTR = "";
                        strTR = '<tr><td style="color: #3c8dbc; border-bottom-style: solid; border-width: 1px;">' + (i + 1).toString() + '</td><td style="color: #3c8dbc; border-bottom-style: solid; border-width: 1px;">' + jRma[i].rmano.value + '</td><td style="color: #3c8dbc; border-bottom-style: solid; border-width: 1px;">' + jRma[i].currentStage.value + '</td><td style="color: #3c8dbc; border-bottom-style: solid; border-width: 1px;">' + jRma[i].repairFee.value + '</td><td style="color: #3c8dbc; border-bottom-style: solid; border-width: 1px;">' + jRma[i].status.value + '</td></tr>';
                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
                    }
                    
//                    for (var i = 0; i < jRma.length; i++ ) {
//                        var strTR = "";
//                        strTR = '<tr><td width="30%">No : </td><td style="color: #3c8dbc;">' + (i + 1).toString() + '</td></tr>';
//                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
//                        strTR = '<tr><td width="30%">rmano : </td><td style="color: #3c8dbc;">' + jRma[i].rmano.value + '</td></tr>';
//                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
//                        strTR = '<tr><td width="30%">currentStage : </td><td style="color: #3c8dbc;">' + jRma[i].currentStage.value + '</td></tr>';
//                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
//                        strTR = '<tr><td width="30%">repairFee : </td><td style="color: #3c8dbc;">' + jRma[i].repairFee.value + '</td></tr>';
//                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
//                        strTR = '<tr><td width="30%">status : </td><td style="color: #3c8dbc;">' + jRma[i].status.value + '</td></tr>';
//                        ADV_RMAElement.find(".ADV_RMAText").append(strTR);
//                    }
                }
            });
        };
    };

    freeboard.loadWidgetPlugin({
        type_name: 'ADV_RMA',
//        display_name: $.i18n.t('plugins_wd.html.display_name'),
//        description: $.i18n.t('plugins_wd.html.description'),
        display_name: 'ADV RMA',
        description: 'Display RMA by SN',
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
                type: 'text',
                default_value: 'AKA0815747',
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
            newInstanceCallback(new ADV_RMAWidget(settings));
        }
    });
}());