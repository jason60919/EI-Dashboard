function decryption(data)
{
    var key = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
    var iv = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
    var decrypted;
    try
    {
        decrypted = CryptoJS.AES.decrypt(data, key, {
            iv: iv,
            padding: CryptoJS.pad.ZeroPadding
        });
        return decrypted.toString(CryptoJS.enc.Utf8).replace(/^\s+|\s+$/g, '');
    }
    catch (e)
    {
        return '';
    }
}

function encryption(data)
{
    var key = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
    var iv = CryptoJS.enc.Latin1.parse('TYScottSephiroth');

    var encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.ZeroPadding
    });
    return encrypted.toString();
}

function TokenValidation(data)
{
    return true;
    if (_.isUndefined(data.result))
    {
        return true;
    }
    if (!_.isUndefined(data.result.ErrorCode)) {
        if ((data.result.ErrorCode == "1305") && (data.result.Field == "token")) {
            if (data.result.FieldValue != null)
            {
                $.cookie('Auth', data.result.FieldValue, {path: '/', expires: myCookieExpiresDate});
            }
            else
            {
                var _title = $.i18n.t('global.warning'),
                        _yes = $.i18n.t('global.yes'),
                        _ask = $.i18n.t('global.dialogMsg.Token_Expired');
                var phraseElement = $('<p>' + _ask + '</p>');
                var db = new DialogBox(phraseElement, _title, _yes, '', function (okcancel) {
                    if (okcancel == 'ok') {
                        //Clear cookies
                        var cookies = document.cookie.split(";");
                        for (var i = 0; i < cookies.length; i++) {
                            var equals = cookies[i].indexOf("=");
                            var name = equals > -1 ? cookies[i].substr(0, equals) : cookies[i];
                            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                        }
                        //redirect to login
                        //window.location.href = "index.jsp";
                    }
                });
            }
            return false;
        }
    }
    return true;
}
