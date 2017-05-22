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
        loggerName: 'plugin.wg.ADV_Warranty.js'
    });
    logger.info('plugin.wg.ADV_Warranty.js loaded');
    
    var ADV_WarrantyWidget = function (settings) {
        
        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentID = _.uniqueId('ADV_Warrantywidget_');
        var ADV_WarrantyElement = $('<div class="ADV_Warrantywidget" id="' + currentID + '"><table style="margin: 10px; width: 100%;"><tr><td style="width: 100%;"><table class="ADV_WarrantyText" cellpadding="5"></table></td></tr></table></div>');
        var currentSettings = settings;
        self.widgetType = 'ADV_Warranty';

        function setBlocks(blocks) {
            if (_.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks;
            ADV_WarrantyElement.css({
                'height': height + 'px',
                'width': '100%'
            });
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(ADV_WarrantyElement);
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
            ADV_WarrantyElement.parent().find(".section-title").html(currentSettings.title);
            
            this.updateData();
            
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue) {
            logger.info('onCalculatedValueChanged: ' + settingName);
            logger.info('newValue: ' + newValue);
            this.updateData(newValue);
        };

        this.onDispose = function () {
            ADV_WarrantyElement.remove();
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
                url: '/WebService_Warranty/index.jsp?SN=' + currentSettings.value,
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
                    xhr.setRequestHeader("Accept", "application/json");
                },
                success: function (response)
                {
                    ADV_WarrantyElement.find(".ADV_WarrantyText").find("tr").remove();
                    var strData = response.replace(/<hr\/\>/g,"");
                    var jWarranty = $.parseJSON(strData);
                    var strTR = "";
                    strTR = '<tr><td width="30%">SN : </td><td style="color: #3c8dbc;">' + jWarranty.serialNumber.value + '</td></tr>';
                    ADV_WarrantyElement.find(".ADV_WarrantyText").append(strTR);
                    strTR = '<tr><td width="30%">Product Name : </td><td style="color: #3c8dbc;">' + jWarranty.productName.value + '</td></tr>';
                    ADV_WarrantyElement.find(".ADV_WarrantyText").append(strTR);
                    strTR = '<tr><td width="30%">Shipping Date : </td><td style="color: #3c8dbc;">' + jWarranty.shippingDate.value + '</td></tr>';
                    ADV_WarrantyElement.find(".ADV_WarrantyText").append(strTR);
                    strTR = '<tr><td width="30%">Warranty : </td><td style="color: #3c8dbc;">' + jWarranty.warranty.value + '</td></tr>';
                    ADV_WarrantyElement.find(".ADV_WarrantyText").append(strTR);
                }
            });
        };
    };

    freeboard.loadWidgetPlugin({
        type_name: 'ADV_Warranty',
//        display_name: $.i18n.t('plugins_wd.html.display_name'),
//        description: $.i18n.t('plugins_wd.html.description'),
        display_name: 'ADV Warranty',
        description: 'Display Warranty by SN ',
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
            newInstanceCallback(new ADV_WarrantyWidget(settings));
        }
    });
}());