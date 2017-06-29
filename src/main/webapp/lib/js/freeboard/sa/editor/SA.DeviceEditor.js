/* 
 * Device Editor
 * @date 2015/11/03
 * @required
 * FreeBoard/lib/js/thirdparty/selectivity-full.js
 */

DeviceEditor = function (theFreeboardModel, packSettings, callback) {

    var self = this;
    var logger = log4jq.getLogger({
        loggerName: 'SA.DeviceEditor.js'
    });
    logger.debug('pack as below: ');
    logger.debug(packSettings);

//    Selectivity.Locale.noResults = $.i18n.t('PluginEditor.device_editor.no_device_result')
    var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');

    var freeboardUI = theFreeboardModel.getFreeboardUIInstance();

    var pack_type = packSettings.pack_type;

    self.generatedContentPackEventCallback = null;
    self.setGeneratedContentPackEventCallback = function (newCallback) {
        logger.info('setGeneratedContentPackEventCallback');
        self.generatedContentPackEventCallback = newCallback;
    };


    var endpoint = '';

    //
    //dialog
    //
    var db = null;
    var form = '';
    var title = packSettings.display_name + ' - ' + $.i18n.t('PluginEditor.device_editor.title');
//            'Please select device';

    var userRole = '<div id="setting-row-user" class="form-row"><div class="form-label"><label class="control-label">'
    + $.i18n.t('PluginEditor.datasource.user') + '</label></div><div id="setting-value-container-user" class="form-value"><div class="styled-select"><select class="required"><option value="undefined">' + 
        $.i18n.t('PluginEditor.device_editor.select') + '</option></select></div></div></div>';
    var $userRole = $(userRole);
    var $roleSelect = null;
    var deviceList = '<div id="setting-row-device" class="form-row" style=""><div class="form-label"><label class="control-label">'
    + $.i18n.t('PluginEditor.datasource.device') + '</label></div><div id="setting-value-container-device" class="form-value"><div class="styled-select"><select class="selectivity-input required"></select></div></div></div>';
    var $deviceList = $(deviceList);
    var $selectivityOfDevice = null;

    //store device
    var devicesStore = {};

    function appendGroupAndAccount(success, error) {

        logger.info('appendGroupAndAccount');
        openIndicator();
        REST.send({
            url: '/DeviceGroupMgmt/getGroupAndAccount',
            method: 'GET',
            data: ''
        }, function (data) {
            logger.debug('success to get group and group data');
            closeIndicator();
            success(data);

        }, function () {
            logger.debug('fail to get group and group data');
            closeIndicator();
            error();
        });
    }
    ;

    function appendDeviceList(fuzzyOpts, success, error) {

                //alert("appendDeviceList");

        logger.info('appendDeviceList');
        openIndicator();
        //         freeboardUI.showLoadingIndicator(true);
        var postBody =
                {"request": {"clause": {"item": [{"@name": "showSensorHub", "@value": "true"}, {"@name": "account_id", "@value": fuzzyOpts.account_id}]}, "like": {"item": [{"@name": "condition", "@value": ""}, {"@name": "field", "@value": "name"}]}, "orderby": {"item": {"@name": "name", "@value": "ASC"}}, "resultfilter": {"item": [{"@name": "page size", "@value": "100"}, {"@name": "page no", "@value": "1"}]}}};
        REST.send({
            url: '/DeviceMgmt/fuzzySearch',
            method: 'POST',
            data: JSON.stringify(postBody)
        }, function (data) {
            logger.debug('success to get fuzzySearch data');
            //             freeboardUI.showLoadingIndicator(false);
            closeIndicator();
            success(data);


        }, function () {
            logger.debug('fail to get fuzzySearch data');
//  freeboardUI.showLoadingIndicator(false);
            closeIndicator();
            error();

        });
    }

    var openIndicator = function () {
        logger.info('openIndicator');
        loadingIndicator.removeClass('hide').appendTo('body').addClass('show');
    };

    var closeIndicator = function () {
        logger.info('closeIndicator');
        _.delay(function () {
            loadingIndicator.removeClass('show').addClass('hide');
            _.delay(function () {
                loadingIndicator.remove();
            }, 500);
        }, 500);
    };

    self.open = function () {

        logger.info('open');
        logger.debug('create db dialog instance');

        appendGroupAndAccount(function (data) {
            logger.debug('sucess callback of appendGroupAndAccount');
            logger.debug(data);
            /*
             {
             "result" : {
             "Account" : {
             "type" : "self",
             "accountid" : 2,
             "accountname" : "admin",
             "description" : "System admin",
             "rootTotalDev" : 4,
             "rootErrorDev" : 3
             }
             }
             }
             */

            $roleSelect = $userRole.find('select');
            if (data.hasOwnProperty('result')) {
                var accountList = data.result.Account;
                logger.debug(accountList);
                if (!$.isArray(accountList)) {
                    logger.debug('Account Obj');
                    $roleSelect.append('<option value="' + accountList.accountid + '">' + accountList.accountname + '</option>');
                } else {
                    logger.debug('Account Array');
                    var optsHtml = '';
                    for (var i = 0; i < accountList.length; i++) {
                        var tmpAccount = accountList[i];
                        logger.debug(tmpAccount);

                        $roleSelect.append('<option value="' + tmpAccount.accountid + '">' + tmpAccount.accountname + '</option>');
                    }
                }

                form += '<form id="device-editor-plugin">' + $userRole.html() + '</form>';
                db = new DialogBox(
                        form,
                        title,
                        $.i18n.t('PluginEditor.dialog.yes'),
                        $.i18n.t('PluginEditor.dialog.no'),
                        function (okcancel) {
                            if (okcancel === 'ok') {
                                //user select
                                var roleId = $('#setting-value-container-user select').val();
                                var agentId = $('.selectivity-single-selected-item').attr('data-item-id');
                                var deviceObj = devicesStore[agentId];

                                if (typeof (deviceObj) != 'undefined' && typeof (deviceObj) != 'undefined') {
                                    logger.debug('select role id ' + roleId);
                                    logger.debug('select device name: ' + deviceObj.name);
                                    if (typeof (callback) === 'function') {
                                        openIndicator();
                                        ContentPackGenerator.create(packSettings, deviceObj, function (config) {
                                            closeIndicator();
                                            callback(packSettings, deviceObj, config);
                                        });


                                    } else {
                                        logger.warn('CANNOT trigger generatedContentPackEventCallback');
                                    }
                                } else {

                                    var errDb = new DialogBox(
//                                            'Please select device',
                                            $.i18n.t('PluginEditor.device_editor.title'),
                                            $.i18n.t('global.error'),
                                            $.i18n.t('global.yes')

                                            );
                                }


                            } else if (okcancel === 'cancel') {

                            }
                        }, function ($overlay) {

                    var $form = $overlay.find('#device-editor-plugin');
                    //role change
                    $overlay.find('select').change(function () {

                        devicesStore = {};

                        var accountId = $(this).val();
                        logger.debug('role change: ' + accountId);
                        //append device list
                        var fuzzySearcy = {
                            account_id: accountId
                        };
                        if ($('#setting-row-device').length === 0) {
                            $form.append($deviceList);
                            //
                            //bind device list
                            //
                        } else {
//                             $selectivityOfDevice.selectivity('destroy');
                            $('#setting-value-container-device').remove();
                            $('#setting-row-device').append('<div id="setting-value-container-device" class="form-value"><div class="styled-select"><select class="selectivity-input required"></select></div></div>');
                        }


                        appendDeviceList(fuzzySearcy,
                                function (data) {
                                    logger.debug('add device list');
                                    //reset
                                    var $select = $deviceList.find('select');
                                    $select.find('option').remove();
                                    if (data.result.hasOwnProperty('item')) {

                                        var deviceList = data.result.item;
                                        if(!$.isArray(data.result.item)){
                                            deviceList = [data.result.item];
                                        }
                                        var optsHtml = '';
                                        for (var i = 0; i < deviceList.length; i++) {
                                            var device = deviceList[i];
                                            devicesStore[device.agentId ] = device;
                                            optsHtml += '<option value="' + device.agentId + '">' + device.name + '</option>';
                                        }
                                        $select.append(optsHtml);

                                        //
                                        // selectivity componemt
                                        //
//                                        Selectivity.Locale.noResults = $.i18n.t('PluginEditor.device_editor.no_device_result')
                                        $selectivityOfDevice =
                                                $deviceList.find('select').selectivity({
                                                    allowClear: true,
                                                    searchInputPlaceholder: 
                                                            $.i18n.t('PluginEditor.device_editor.no_device_selected')
//                                                    'No device selected'
                                        });

                                        $('div.selectivity-input').on('change', function (event) {
                                            
                                            logger.debug('selectivity change');
                                            
                                            var agentId =
                                                    $(event.target).find('.selectivity-single-selected-item').attr('data-item-id');

                                        });
                                    } else {

                                        logger.debug('selectivity clear');
                                        $selectivityOfDevice = $deviceList.find('select').selectivity();
                                    }
                                },
                                function () {

                                });

                    });
                });


            } else {
                logger.error('CANNOT find result property of resposne');
            }
        }, function () {

        });


    };


};
