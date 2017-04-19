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
        loggerName: 'plugin.wg.RFIDSingle.js'
    });
    logger.info('plugin.wg.RFIDSingle.js loaded');
    
    var RFIDSingleWidget = function (settings) {
        
        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentID = _.uniqueId('RFIDSinglewidget_');
        var RFIDSingleElement = $('<div class="RFIDSinglewidget" id="' + currentID + '"><table style="margin: 10px; width: 100%;"><tr><td style="width: 60%;"><table class="RFIDSingleText" cellpadding="5"></table></td><td><table class="RFIDSingleImage"></table></td></tr></table></div>');
        var currentSettings = settings;
        self.widgetType = 'RFIDSingle';

        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks;
            RFIDSingleElement.css({
                'height': height + 'px',
                'width': '100%'
            });
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(RFIDSingleElement);
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
            RFIDSingleElement.parent().find(".section-title").html(currentSettings.title);
            
            this.updateData();
            
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.info('newValue: ' + newValue);
            this.updateData(newValue);
        };

        this.onDispose = function () {
            RFIDSingleElement.remove();
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        //this.onSettingsChanged(settings);
        this.updateData = function (newValue) {
            RFIDSingleElement.find(".RFIDSingleText").find("tr").remove();
            RFIDSingleElement.find(".RFIDSingleImage").find("tr").remove();
            var oRFID = null;
            for (var i=0; i<aRFIDList.length; i++)
            {
                if (aRFIDList[i].RFID == newValue)
                {
                    oRFID = aRFIDList[i];
                    break;
                }
            }
            if (oRFID != null)
            {
                var strTR = "";
                strTR = '<tr><td width="30%">RFID : </td><td style="color: #3c8dbc;">' + oRFID.RFID + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Name : </td><td style="color: #3c8dbc;">' + oRFID.Name + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Sex : </td><td style="color: #3c8dbc;">' + oRFID.Sex + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Citizenship : </td><td style="color: #3c8dbc;">' + oRFID.Citizenship + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td style="color: #3c8dbc; text-align:center; vertical-align:middle;"><img src="js/FreeBoard/plugins/freeboard/wg/Customization/images/' + oRFID.image + '" style="width: 120px;"/></td></tr>';
                RFIDSingleElement.find(".RFIDSingleImage").append(strTR);
            }
            else
            {
                var strTR = "";
                strTR = '<tr><td width="30%">RFID : </td><td style="color: #3c8dbc;">' + newValue + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Name : </td><td style="color: #3c8dbc;">' + "unknown" + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Sex : </td><td style="color: #3c8dbc;">' + "unknown" + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td width="30%">Citizenship : </td><td style="color: #3c8dbc;">' + "unknown" + '</td></tr>';
                RFIDSingleElement.find(".RFIDSingleText").append(strTR);
                strTR = '<tr><td style="color: #3c8dbc; text-align:center; vertical-align:middle;"></td></tr>';
                RFIDSingleElement.find(".RFIDSingleImage").append(strTR);
            }
        };
    };

    freeboard.loadWidgetPlugin({
        type_name: 'RFIDSingle',
//        display_name: $.i18n.t('plugins_wd.html.display_name'),
//        description: $.i18n.t('plugins_wd.html.description'),
        display_name: 'RFID Single',
        description: 'Display current RFID',
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
            newInstanceCallback(new RFIDSingleWidget(settings));
        }
    });
}());