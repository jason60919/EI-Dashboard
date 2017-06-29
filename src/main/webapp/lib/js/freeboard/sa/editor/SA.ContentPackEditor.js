/* 
 * Content Pack Editor
 * @date 2015/11/03
 */


var ContentPackEditor = function (theFreeboardModel) {

    'use strict';

    var self = this;

    var SHEETS_LIMIT = 8;

    var logger = log4jq.getLogger({
        loggerName: 'SA.ContentPackEditor.js'
    });
    logger.info('init ContentPackEditor');


    var freeboardUI = theFreeboardModel.getFreeboardUIInstance();

    //
    // content pack 
    //
    var contentPackForm = '';//content pack html
    var contentPackTitle = $.i18n.t('PluginEditor.contentpack.title');
//            'Content Packs';
    var contentPacks = [];
    contentPacks.push({
        type_name: 'serverOverview',
        display_name: $.i18n.t('PluginEditor.contentpack.server_overview')
        , url: 'js/FreeBoard/img/server_overview.png'
//                'Server Overview'
    });
    contentPacks.push({
        type_name: 'deviceSystemInfo',
        display_name: $.i18n.t('PluginEditor.contentpack.device_system_info')
//                'Device System Info'
        , url: 'js/FreeBoard/img/system_info.png'
    });
    contentPacks.push({
        type_name: 'deviceHardwareStatus',
        display_name: $.i18n.t('PluginEditor.contentpack.device_hardware_status')
//                'Device Hardware Status'
        , url: 'js/FreeBoard/img/hwm_status.png'
    });
    contentPacks.push({
        type_name: 'deviceNetworkStatus',
        display_name: $.i18n.t('PluginEditor.contentpack.device_network_status')
//                'Device Network Status'
        , url: 'js/FreeBoard/img/network.png'
    });
    contentPacks.push({
        type_name: 'deviceHDDStatus',
        display_name: $.i18n.t('PluginEditor.contentpack.device_hdd_status')
//                'Device HDD Status'
        , url: 'js/FreeBoard/img/hdd_status.png'
    });

    function generateContentPackHtml() {
        logger.info('generateContentPackHtml');
        contentPackForm = '<ul id="content-pack-list">';
        var lenOfPacks = contentPacks.length;
        for (var i = 0; i < lenOfPacks; i++) {
            var pack = contentPacks[i];
            contentPackForm += appendRowOfPack(pack);
        }
        contentPackForm += '<ul>';
    }
    ;

    function appendRowOfPack(pack) {
        //return '<li><a href="javascript:void(0)" data-packtype="' + pack.type_name + '">'
        return '<li><a data-packtype="' + pack.type_name + '">'
                + '<img class="content-pack-img" src="' + pack.url + '" />'
//                '<i class="fa fa-tachometer fa-5x"></i>'
                + '<div>' + pack.display_name + '</div></a></li>';
    }
    ;

    function getContentPack(pack_type) {
        logger.info('getContentPack: ' + pack_type);
        var lenOfPacks = contentPacks.length;
        for (var i = 0; i < lenOfPacks; i++) {
            var pack = contentPacks[i];
            if (pack_type === pack.type_name) {
                return pack;
            }
        }
    }
    ;

    generateContentPackHtml();

    function createSheetOfContentPack(packSettings, config) {

        logger.info('createSheetOfContentPack');
        if (!$('body').data('bundleVer')) {

            logger.debug('start to call create sheet API');

            freeboardUI.showLoadingIndicator(true);

            var totalSheets = $('#tabs .ui-state-default').length;
            if (totalSheets < SHEETS_LIMIT) {
                //
                //  add dashboard's sheet
                //
                //var accountId = $.cookie('mobileacountId');
                var accountId = $('#queryShareAccount label').attr('aid');
                var sequence = $('.ui-tabs-nav li').length - 3;
                var sheetRange = (sequence <= 0) ? 1 : sequence + 1;
                var sheet_name = packSettings.sheet_name + '(' + sheetRange + ')';
//                    + moment().format("YYYY/MM/DD hh:mm:ss ms");

                var comparePass = 1;
                var compareFail = 1;

                while (compareFail !== 0) {

                    comparePass = 0;
                    compareFail = 0;
                    $('#tabs').find('.ui-state-default').each(function () {

                        var eachName = $(this).find('a').attr('title');

                        if (eachName == sheet_name) {

                            sheetRange++;
                            compareFail++;

                        } else {

                            comparePass++;

                        }
                    });
                    sheet_name = packSettings.sheet_name + '(' + sheetRange + ')';
                }
                ;

                var postSheet = {
                    request: {
                        item: {
                            accountid: accountId,
                            sheet: sheet_name,
                            content: config,
                            sequence: sequence
                        }
                    }
                };
                postSheet = JSON.stringify(postSheet);

                REST.send({
                    url: '/DashboardMgmt',
                    method: 'POST',
                    data: postSheet
                }, function (data) {

//                    freeboardUI.showLoadingIndicator(false);
                    /*
                     * 
                     {
                     "result" : {
                     "did" : 20
                     }
                     }
                     */
                    if (data.result.hasOwnProperty('did')) {
                        saveOringinalSheet(data.result, sheet_name);
                    } else {
                        logger.debug('(success callback) create \"' + sheet_name + '\" ERROR');

                        freeboardUI.checkMaxSheets();
                    }


                }, function () {
                    logger.error('(error callback) create \"' + sheet_name + '\" ERROR');
                    freeboardUI.showLoadingIndicator(false);
                    freeboardUI.checkMaxSheets();
                });
            }
        } else {
            logger.debug('start to replace default sheet with ContentPack');
            var sheet_name = packSettings.sheet_name;
            var $firstTab = $('#tabs .ui-state-default').find('a');
            $firstTab.attr('title', sheet_name).html(sheet_name.slice(0, 11));
            //load sheet from local
            theFreeboardModel.loadDashboard(config, function () {

            });
        }
    }
    ;

    function saveOringinalSheet(sheetData, sheet_name) {

        //var accountId = $.cookie('mobileacountId');
        var accountId = $('#queryShareAccount label').attr('aid')
        var sequence = $('#tabs .ui-state-active').data('sequence');
        var preSheet_name = $('#tabs .ui-state-active').find('a').attr('title');
        var did = $('#tabs .ui-state-active').data('did');

        var postSheet = {
            request: {
                item: {
                    accountid: accountId,
                    sheet: preSheet_name,
                    content: theFreeboardModel.serialize(),
                    sequence: sequence
                }
            }
        };
        postSheet = JSON.stringify(postSheet);

        if (typeof did != "undefined")
        {
            REST.send({
                url: '/DashboardMgmt/' + did,
                method: 'PUT',
                data: postSheet
            }, function (data) {

                freeboardUI.showLoadingIndicator(false);
                /*
                 * 
                 {
                 "result" : {
                 "did" : 20
                 }
                 }
                 */
    //            if (data.result.hasOwnProperty('did')) {
    //                saveOringinalSheet(data.result, sheet_name);
    //            } else {
    //                logger.debug('(success callback) create \"' + sheet_name + '\" ERROR');
    //            }
                jumpToSheet(sheetData, sheet_name);

            }, function () {
                logger.error('(error callback) create \"' + sheet_name + '\" ERROR');
                freeboardUI.showLoadingIndicator(false);
            });
        }
        else
        {
            jumpToSheet(sheetData, sheet_name);
        }

    }

    function jumpToSheet(sheetData, sheet_name) {
        logger.info('jumpToSheet');
        logger.debug('jump to sheet: ' + sheet_name);

        //add New Sheet
        var num_tabs = $("div#tabs ul li.ui-state-default").length + 1;
        var comparePass = 1;
        var compareFail = 1;

        while (compareFail != 0) {

            comparePass = 0;
            compareFail = 0;

            var newName = 'NewBoard(' + num_tabs + ')';

            $('#tabs .ui-state-default').find('a').each(function () {

                var eachName = $(this).text();

                if (eachName == newName) {

                    num_tabs++;
                    compareFail++;

                } else {

                    comparePass++;

                }
            });
        }
        ;

//        var $newTab = $('<li class="newTab"><a href="javascript:void(0)" title="' + sheet_name + '">' + sheet_name + '</a></li>');

        var did = sheetData.did;
        var $newTab = null;
        if (sheet_name.length > 11) {
            $newTab = $('<li><a title="' + sheet_name + '" href="javascript:void(0)">'
                    + sheet_name.slice(0, 11)
                    + '</a><i style="line-height:32px; padding-right: 5px;" class="fa-w fa-ellipsis-h"></li>')
                    .data('did', did)
                    .data('sequence', 1)
                    .insertBefore($("#add-tab").parent());
        } else {
            $newTab = $('<li><a title="'
                    + sheet_name
                    + '" href="javascript:void(0)">'
                    + sheet_name
                    + '</a></li>').data('did', did).data('sequence', 1).insertBefore($("#add-tab").parent());
        }
        $newTab.data(sheetData);
        $newTab.insertBefore($("#add-tab").parent());
        $('<div id="tab' + num_tabs + '"></div>').insertAfter('#tabs ul');
        $("div#tabs").tabs("refresh");

        var i = 0;
        while ($('#tabs .ui-state-default').eq(i).length != 0) {

            $('#tabs .ui-state-default').eq(i).data('sequence', i + 1);
            i++;
        }

        $('#tabs li').removeClass('ui-corner-top');



        //find last NEW
        var $contentPackSheet = $("#add-tab").parent().prev();
        var contentPackIndex = $contentPackSheet.index();
        $('div#tabs').tabs({
            active: contentPackIndex
        });

        $.cookie('ActiveSheet', contentPackIndex, {
            path: '/'
        });

        //load sheet
        theFreeboardModel.loadDashboardFromDataBase();

    }

    self.open = function () {

        logger.info('open');
        logger.debug('create db dialog instance');
        var db = new DialogBox(
                contentPackForm,
                contentPackTitle,
                '',
                $.i18n.t('PluginEditor.dialog.no'),
                function (okcancel) {
                    if (okcancel === 'ok') {

                    } else if (okcancel === 'cancel') {

                    }
                });

        //action bind
        var $packItems = $(contentPackForm).find('a');
        logger.debug('pack count: ' + $packItems.length);
        $('#content-pack-list').find('a').click(function () {
            var $pack = $(this);
            var pack_type = $pack.attr('data-packtype');
            logger.debug('click content pack: ' + pack_type);

            //close current  
            $('#dialog-cancel').click();

            var packSettings = getContentPack(pack_type);
//            {type_name: "deviceHardwareStatus", display_name: "設備硬體狀態 (SUSI Control)", url: "js/FreeBoard/img/hwm_status.png"}
//            
            //
            // choose ContentPackGenerator
            //
            if (pack_type == 'serverOverview') {

                logger.debug('direct to execute ContentPackGenerator');


                ContentPackGenerator.create(packSettings, {}, function (config) {

                    logger.debug('ContentPackGenerator create callback');
                    packSettings.sheet_name = packSettings.display_name;
                    createSheetOfContentPack(packSettings, config);

                });

            } else {
                logger.debug('open device edit plugin');
                logger.debug(packSettings);
                var deviceEdit = new DeviceEditor(theFreeboardModel, packSettings, function (packSettings, deviceObj, config) {
                    logger.debug('DeviceEditor callback');
                    logger.debug('pack_type: ' + packSettings.display_name + ' has created config');
                    logger.debug(config);
                    //update dispaly name with device name
                    packSettings.sheet_name = deviceObj.name + ' ' + packSettings.display_name;

                    if (config.datasources.length > 0) {
                        createSheetOfContentPack(packSettings, config);
                    } else {
                        logger.debug('cannot find sensorIds');

                        var _title = $.i18n.t('global.warning'),
                                //                        'Warning',
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('PluginEditor.contentpack.error');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);

                    }
                });


                deviceEdit.open();
            }
        });
    };

};