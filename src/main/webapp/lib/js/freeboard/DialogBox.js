// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

/*
 * 
 * @param {type} contentElement
 * @param {type} title
 * @param {type} okTitle
 * @param {type} cancelTitle
 * @param {type} closeCallback
 * @param {type} initCallback : added by ken
 * @returns {undefined}
 */
function DialogBox(contentElement, title, okTitle, cancelTitle, closeCallback, initCallback) {
    'use strict';
    //added by ken 2015/09/15
    var dialogBoxLog = log4jq.getLogger({
        loggerName: 'DialogBox.js'
    });
    var self = this;
    var modal_width = 900;

    // Initialize our modal overlay
    var overlay = $('<div id="modal_overlay"></div>');

    var modalDialog = $('<div class="modal"></div>');

    function closeModal()
    {
        dialogBoxLog.info('closeModal: click ok of dialog');
        if (head.browser.ie) {
            overlay.remove();
        } else {
            overlay.removeClass('show').addClass('hide');
            _.delay(function () {
                overlay.remove();
            }, 300);
        }
    }

    // Create our header
    modalDialog.append('<header><h2 class="title">' + title + "</h2></header>");

    $('<section></section>').appendTo(modalDialog).append(contentElement);

    // Create our footer
    var footer = $('<footer></footer>').appendTo(modalDialog);

    if (okTitle)
    {
        $('<span id="dialog-ok" class="text-button">' + okTitle + '</span>').appendTo(footer).click(function (e)
        {
            dialogBoxLog.info('click ok of dialog');
            e.preventDefault();
            var $link = $(e.target);
            if (!$link.data('lockedAt') || +new Date() - $link.data('lockedAt') > 300) {
                var hold = false;
                if (title != $.i18n.t('global.warning')) {
                    if (!$('#plugin-editor').validationEngine('validate'))
                        return false;
                    switch ($('.styled-select select').val())
                    {
                        case "SrvStatus" :
                            var loadingIndicator = $('<div class="wrapperloading"><div class="loading up" ></div><div class="loading down"></div></div>');
                            loadingIndicator.removeClass('hide').appendTo('body').addClass('show');
                            var currentUrl = document.URL;
                            var httpsLength = currentUrl.toLowerCase().indexOf("https");
                            currentUrl = $('#setting-value-container-serverurl input').val();
                            if (httpsLength >= 0 && currentUrl.toLowerCase().indexOf("http:") >= 0) {
                                var _title = $.i18n.t('global.warning'),
                                    _yes = $.i18n.t('global.yes'),
                                    _ask = $.i18n.t('global.dialogMsg.Info_httpsConnection');
                                var phraseElement = $('<p>' + _ask + '</p>');
                                var db = new DialogBox(phraseElement, _title, _yes);
                                _.delay(function () {
                                    loadingIndicator.removeClass('show').addClass('hide');
                                    _.delay(function () {
                                        loadingIndicator.remove();
                                    }, 500);
                                }, 500);
                            } else {
                                var accountVeirfy;
                                var errorStage = 0;
                                var body = '{ "request" : { "item" : [ { "@name" : "username","@value" : "' + $('#setting-value-container-account input').val() + '"},{ "@name" : "password","@value" : "' + $('#setting-value-container-password input').val() + '"}] } }';
                                var lastWord = currentUrl.substr(currentUrl.length - 1, currentUrl.length);
                                if (lastWord != '/') {
                                    var URL = currentUrl + '/webresources/AccountMgmt/login';
                                } else {
                                    var URL = currentUrl + 'webresources/AccountMgmt/login';
                                }
                                $.ajax({
                                    url: URL,
                                    dataType: (errorStage == 1) ? "JSONP" : "JSON",
                                    type: 'POST',
                                    contentType: "application/json",
                                    data: body,
                                    xhrFields: {
                                        withCredentials: true
                                    },
                                    beforeSend: function (xhr) {
                                        var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                                        xhr.setRequestHeader("Authorization", authorization);
                                        xhr.setRequestHeader("Accept", "application/json");
                                    },
                                    success: function (data) {
                                        if (!TokenValidation(data)) return;
                                        if (!_.isUndefined(data.result.ErrorCode)) {
                                            accountVeirfy = false;
                                        } else {
                                            accountVeirfy = true;
                                        }
                                        $('#plugin-editor').data('settingVerification', accountVeirfy);
                                        if ($('#plugin-editor').data('settingVerification')) {
                                            if (_.isFunction(closeCallback))
                                                hold = closeCallback('ok');
                                            if (!hold) {
                                                closeModal();
                                            }
                                        } else {
                                            var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Error_WrongAuth');
                                            switch (data.result.ErrorCode)
                                            {
                                                case 1305:
                                                    _ask = $.i18n.t('global.dialogMsg.Error_WrongAuth');
                                                    break;
                                                case 1006:
                                                    _ask = $.i18n.t('global.dialogMsg.Error_NotMaster');
                                                    break;
                                                default:
                                                    _ask = $.i18n.t('global.dialogMsg.Error_WrongAuth');
                                                    break;
                                            }
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes);
                                        }
                                        _.delay(function () {
                                            loadingIndicator.removeClass('show').addClass('hide');
                                            _.delay(function () {
                                                loadingIndicator.remove();
                                            }, 500);
                                        }, 500);
                                        return;
                                    },
                                    error: function (xhr, status, error) {
                                        if (xhr.status == 404 || xhr.status == 0) {
                                            var _title = $.i18n.t('global.warning'),
                                                _yes = $.i18n.t('global.yes'),
                                                _ask = $.i18n.t('global.dialogMsg.Error_ServerNotFound');
                                            var phraseElement = $('<p>' + _ask + '</p>');
                                            var db = new DialogBox(phraseElement, _title, _yes);
                                        }
                                        _.delay(function () {
                                            loadingIndicator.removeClass('show').addClass('hide');
                                            _.delay(function () {
                                                loadingIndicator.remove();
                                            }, 500);
                                        }, 500);
                                        return;
                                    }
                                });
                            }
                            break;
                        case "NRwebsocket" :
                            var URL = $('#setting-row-wsUrl input').val();
                            try {
                                var oWebSocket = new WebSocket(URL);
                                oWebSocket.onmessage = function (msg) {
                                };
                                oWebSocket.onclose = function (evt) {
                                };
                                oWebSocket.onopen = function (evt) {
                                    oWebSocket.close();
                                    if (_.isFunction(closeCallback))
                                        hold = closeCallback('ok');
                                    if (!hold) {
                                        closeModal();
                                    }
                                };
                                oWebSocket.onerror = function (evt) {
                                    var _title = $.i18n.t('global.warning'),
                                        _yes = $.i18n.t('global.yes'),
                                        _ask = $.i18n.t('global.dialogMsg.Error_ServerNotFound');
                                    var phraseElement = $('<p>' + _ask + '</p>');
                                    var db = new DialogBox(phraseElement, _title, _yes);
                                };
                            }
                            catch (e) {
                                var _title = $.i18n.t('global.warning'),
                                    _yes = $.i18n.t('global.yes'),
                                    _ask = e.message;
                                var phraseElement = $('<p>' + _ask + '</p>');
                                var db = new DialogBox(phraseElement, _title, _yes);
                            }
                            break;
                        case "nodeRedThreshold" :
                            var authorization = 'Basic ' + $.base64.encode(decryption($.cookie('selectedTabPageaccount')) + ':' + decryption($.cookie('selectedTabPagepassword')));
                            jQuery.support.cors = true;
                            var ajaxOpts = {
                                cache: false,
                                type: 'get',
                                //contentType: 'application/json',
                                url: '/webresources/HttpMgmt?url=' + $('#setting-value-container-url input').val() + "flows&authorization=" + authorization,
                                async: false,
                                timeout: 60 * 1000,
                                error: function (jqXHR, textStatus, errorThrown) {
                                    var _title = $.i18n.t('global.warning'),
                                        _yes = $.i18n.t('global.yes'),
                                        _ask = $.i18n.t('global.dialogMsg.Error_Occurred');
                                    var phraseElement = $('<p>' + _ask + '</p>');
                                    var db = new DialogBox(phraseElement, _title, _yes);
                                },
                                beforeSend: function (xhr) {
                                    var authorization = 'Basic ' + $.base64.encode(_RMMGlobal.Get().Login.username + ':' + _RMMGlobal.Get().Login.password);
                                    xhr.setRequestHeader("Authorization", authorization);
                                    xhr.setRequestHeader("Accept", "application/json");
                                },
                                success: function (response, textStatus, xhr) {
                                    if (response == null)
                                    {
                                        var _title = $.i18n.t('global.warning'),
                                            _yes = $.i18n.t('global.yes'),
                                            _ask = $.i18n.t('global.dialogMsg.Error_ServerNotFound');
                                        var phraseElement = $('<p>' + _ask + '</p>');
                                        var db = new DialogBox(phraseElement, _title, _yes);
                                    }
                                    else
                                    {
                                        if (_.isFunction(closeCallback))
                                            hold = closeCallback('ok');
                                        if (!hold) {
                                            closeModal();
                                        }
                                    }
                                }
                            };
                            $.ajax(ajaxOpts);
                            break;
                        default:
                            if (_.isFunction(closeCallback))
                                hold = closeCallback('ok');
                            if (!hold) {
                                closeModal();
                            }
                            break;
                    }
                } else {
                    if (_.isFunction(closeCallback))
                        hold = closeCallback('ok');
                    if (!hold) {
                        closeModal();
                    }
                }
            } else {
                dialogBoxLog.warn('cannot support double-click');
            }
            $link.data('lockedAt', +new Date());
        });
    }

    if (cancelTitle)
    {
        $('<span id="dialog-cancel" class="text-button">' + cancelTitle + '</span>').appendTo(footer).click(function ()
        {
            closeCallback('cancel');
            closeModal();
        });
    }

    overlay.append(modalDialog);
    $('body').append(overlay);
    if (!head.browser.ie)
        overlay.removeClass('hide').addClass('show');

    if (_.isFunction(initCallback)) {
        initCallback(overlay);
    }
    // ValidationEngine initialize
    $.validationEngine.defaults.autoPositionUpdate = true;
    // media query max-width : 960px
    $.validationEngine.defaults.promptPosition = ($('#hamburger').css('display') == 'none') ? 'topRight' : 'topLeft';
    $('#plugin-editor').validationEngine();

    return self;
}
