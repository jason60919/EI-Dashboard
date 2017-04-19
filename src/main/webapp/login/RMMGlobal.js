/*
--Get RMMGlobal
var oRMM = $.RMMGlobal();

--Set RMMGlobal
var oRMM = {};
oRMM.RMMDebugMode = false; 
var bRet = $.RMMGlobal(oRMM);

 */
var _InValidCharReg = /['"\'\");&<#%]+/g;

RMMGlobal = function()
{
    this.Get = function () {
        var oRMM = {};
        if (typeof(Storage) !== "undefined") {
            if (typeof(localStorage.RMMGlobal) != "undefined")
                oRMM = JSON.parse(localStorage.RMMGlobal);
            else
                localStorage.setItem("RMMGlobal", JSON.stringify(oRMM));
                
        } 
        return oRMM;
    };
    this.Set = function (value) {
        // set
        var bRet = true;
        if(typeof value == 'object') {
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem("RMMGlobal", JSON.stringify(value));
            } 
        } else {
            bRet = false;
        }
        return bRet;
    };
}

RMMUtility = function()
{
    this.Decryption = function (data) {
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
    };
    
    this.Encryption = function (data) {
        var key = CryptoJS.enc.Latin1.parse('TYScottSephiroth');
        var iv = CryptoJS.enc.Latin1.parse('TYScottSephiroth');

        var encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.ZeroPadding
        });
        return encrypted.toString();
    };
}

// object comparison
Object.equals = function (x, y) {
    if (x === y)
        return true;
    // if both x and y are null or undefined and exactly the same

    if (!(x instanceof Object) || !(y instanceof Object))
        return false;
    // if they are not strictly equal, they both need to be Objects

    if (x.constructor !== y.constructor)
        return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for (var p in x) {

        if (!x.hasOwnProperty(p))
            continue;
        // other properties were tested using x.constructor === y.constructor

        if (typeof x[ p ] === "undefined")
            continue;

        if (!y.hasOwnProperty(p))
            return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if (x[ p ] === y[ p ])
            continue;
        // if they have the same strict value or identity then they are equal

        if (typeof (x[ p ]) !== "object")
            return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if (!Object.equals(x[ p ], y[ p ]))
            return false;
        // Objects and Arrays must be tested recursively
    }

    for (p in y) {
        if (typeof y[ p ] === "undefined")
            continue;

        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p))
            return false;
    }
    return true;
};

var _RMMGlobal = new RMMGlobal();
var _RMMUtility = new RMMUtility();


