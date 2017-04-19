// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

//modified by ken 2015/09/16
//pass theFreeboardModel 
JSEditor = function (theFreeboardModel) {
    'use strict';

    var jsEditorLog = log4jq.getLogger({
        loggerName: 'JSEditor.js'
    });
    var _veDatasourceRegex =
            /datasources\[\"([^"]+)/;
//            new RegExp('datasources\[\"([^"]+)');
    //extend by ken
    var currDatasource = null;
    var setDatasourceName = null;
    var selectDatasources = null;
    var dataPath = '';

    var assetRoot = '';
    var codeWindow = null;
    var codeMirrorWrapper = null;
    var codeWindowFooter = null;
    var codeWindowHeader = null;

    function setAssetRoot(_assetRoot) {
        assetRoot = _assetRoot;
    }

    /*
     * 
     * @param {String} value: data source(datasources["test"]["result"]["hardisk"]["item"])  from widget setting dialog
     * @param {String} mode: json editor mode
     * @param {function} callback: reutrn jseditor value for data source
     * @returns {undefined}
     */
    function displayJSEditor(value, mode, callback) {
        jsEditorLog.info('displayJSEditor');
        dataPath = '';
        jsEditorLog.debug('value: ' + value + ', mode: ' + mode);

        //
        //parse data source
        //
        if (value.indexOf('datasources') > -1) {
            var dsMatch = _veDatasourceRegex.exec(value);
//            console.log(dsMatch);
//            for (var i = 0; i < dsMatch.length; i++) {
//                console.log(dsMatch[i]);
//            }

            if (dsMatch != null) {
                var ischeck = dsMatch[1];
                jsEditorLog.debug('dispaly match ds: ' + ischeck);
                if (typeof (ischeck) != 'undefined') {
                    setDatasourceName = dsMatch[1];
                }
            }

        } else {
            jsEditorLog.debug('CANNOT detect data source');
        }

        jsEditorLog.debug('data source from widget dialog: ' + setDatasourceName);

        var exampleText;
        codeWindow = $('<div class="code-window"></div>');
        codeMirrorWrapper = $('<div class="code-mirror-wrapper" style="top: 80px;"></div>');
        codeWindowFooter = $('<div class="code-window-footer"></div>');
        codeWindowHeader = $('<div class="code-window-header cm-s-ambiance"></div>');
        var config = {};

        switch (mode) {

            case 'javascript':
                exampleText = $.i18n.t('JSEditor.javascript.exampleText');
                codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">' + $.i18n.t('JSEditor.javascript.codeWindowHeader') + '</div>');

                // If value is empty, go ahead and suggest something
                if (!value)
                    value = exampleText;

                config = {
                    value: value,
                    mode: 'javascript',
                    theme: 'ambiance',
                    indentUnit: 4,
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    gutters: ['CodeMirror-lint-markers'],
                    lint: true
                };
                break;

            case 'json':
                exampleText = $.i18n.t('JSEditor.json.exampleText');
                codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">' + $.i18n.t('JSEditor.json.codeWindowHeader') + '</div>');

                config = {
                    value: value,
                    mode: 'application/json',
                    theme: 'ambiance',
                    indentUnit: 4,
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    gutters: ['CodeMirror-lint-markers'],
                    lint: true
                };
                break;

                //extend by ken
                //2015/09/16
            case 'jsonviewer':
                selectDatasources =
                        $('<div class="styled-select"><select class="required"><option value="undefined">' + $.i18n.t('PluginEditor.DS_option') + '</option></select></div>');

                codeMirrorWrapper.css({
                    margin: '20px',
                    'box-shadow': 'none',
                    'background-color': 'transparent'
//                    ,overflow: 'auto'
                });

                codeWindowHeader =
                        $('<div class="code-window-header cm-s-ambiance">'
                                + $.i18n.t('JSEditor.jsonviewer.codeWindowHeader') + '</div>');


                _renderOptionsOfDatasources(theFreeboardModel.datasources());
                
                break;

            case 'htmlmixed':
                exampleText = '';

                codeWindowHeader = $('<div class="code-window-header cm-s-ambiance">'
                        + $.i18n.t('JSEditor.htmlmixed.codeWindowHeader') + '</div>');

                config = {
                    value: value,
                    mode: 'htmlmixed',
                    theme: 'ambiance',
                    indentUnit: 4,
                    lineNumbers: true,
                    matchBrackets: true,
                    autoCloseBrackets: true
                };
                break;
        }

        //combine window componemnts (header,rapper,footer)
        codeWindow.append([codeWindowHeader, codeMirrorWrapper, codeWindowFooter]);

        //append js editor window
        $('body').append(codeWindow);


        //modified by ken 2015/09/16
        var codeMirrorEditor = null;
        var windowClickEvent = null;
        var jsonViewerEditorClickEvent = function () {
            var newValue = '';
            if (currDatasource == null) {
                //keep original
                newValue = value;
            } else {
                var currDSName = currDatasource.name();

                jsEditorLog.info('jsonViewerEditorClickEvent: currDSName: ' + currDSName + ', data path: ' + dataPath);
//            ["result", "hardisk", "item", "0", "usedSpace"]

                if (dataPath === '') {
                    //keep original
                    newValue = value;
                } else {

                    //
                    // combine data source format
                    //
                    var splitDataPathArr = dataPath.split('/');
                    var dataPathArrLen = splitDataPathArr.length;
//            console.log(splitDataPathArr);
                    jsEditorLog.debug('dataPathArrLen: ' + dataPathArrLen);
                    var datasourceFormat = 'datasources[\"' + currDSName + '\"]';
                    for (var i = 0; i < dataPathArrLen; i++) {
                        var tmpValue = '[\"';
                        tmpValue += splitDataPathArr[i];
                        tmpValue += '\"]';
//                console.log(tmpValue);
                        datasourceFormat += tmpValue;
                    }
                    newValue = datasourceFormat;
                }
            }



            //call callback
            callback(newValue);
            codeWindow.remove();
        };

        var codeMirrorEditorClickEvent = function () {
            jsEditorLog.info('codeMirrorEditorClickEvent');
            var newValue = codeMirrorEditor.getValue();

            if (newValue === exampleText)
                newValue = '';

            var error = null;
            switch (mode) {
                case 'json':
                    if (JSHINT.errors.length > 0) {

                        var _title = 'Warning',
                                _yes = $.i18n.t('global.yes'),
                                _ask = $.i18n.t('JSEditor.json.error');
                        var phraseElement = $('<p>' + _ask + '</p>');
                        var db = new DialogBox(phraseElement, _title, _yes);

//                            alert($.i18n.t('JSEditor.json.error'));
                        return;
                    }
                    break;
            }
            callback(newValue);
            codeWindow.remove();
        };

        if (mode === 'jsonviewer') {
            jsEditorLog.debug('init json viewer');
            windowClickEvent = jsonViewerEditorClickEvent;

            if (setDatasourceName != null) {
                var selectedOption = selectDatasources.find('option:selected');
//            console.log(selectedOption);
                if (selectedOption != null) {
//                selectDatasources.trigger('change');
                    //            alert('change');
                    selectDatasources.find('select').change();
                    
                }
            }

        } else {
            //init code mirror editor
            jsEditorLog.debug('init code mirror editor');
            codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0), config);
            windowClickEvent = codeMirrorEditorClickEvent;
        }

        //create close button of window
        var closeButton = $('<span id="dialog-cancel" class="text-button">' + $.i18n.t('JSEditor.cancel') + '</span>')
                .click(function () {
                    jsEditorLog.debug('click close button of code window');

                    if (callback) {
                        windowClickEvent();
                    } else {
                        jsEditorLog.warn('cannot find callback');
                    }
                });

        codeWindowFooter.append(closeButton);
    }

    function _renderOptionsOfDatasources(datasouces, setDatasouces) {
        jsEditorLog.info('_renderOptionsOfDatasources');
//        jsEditorLog.debug(datasouces);
//        console.log(datasouces);

        var codeWidonwToolbar = $('<div class="code-window-toolbar" style="margin-top: 25px;"></div>');

//        selectDatasources.change(function () {
        selectDatasources.find('select').on('change', function () {
            var selectDSOpt = $(this);
            var dsIndex = selectDSOpt.val();
            jsEditorLog.debug('change data source: ' + dsIndex);
            currDatasource = datasouces[dsIndex];
            if (typeof (currDatasource) != 'undefined') {

                //get resposne
                var lastestResp = currDatasource.latestData();
                jsEditorLog.debug(lastestResp);

                //init json viewer
                codeMirrorWrapper.html(JSON.stringify(lastestResp));

                codeMirrorWrapper.jsonFrill({toolbar: true, clickNodeCallback: function (dPath) {

                        dataPath = dPath;
                        
                    }});
                layoutAdjust();
                
            } else {
                jsEditorLog.error('cannot find data source');
                codeMirrorWrapper.empty();
            }
        });

        //data source row
        var datasoruceRow = $(_renderToolbarRow());
        datasoruceRow.append(selectDatasources);
        codeWidonwToolbar.append(datasoruceRow);

        var dsIndex = 0;
        _.each(datasouces, function (datasource) {
//             console.log(datasource);
            jsEditorLog.debug('ds name: ' + datasource.name());
            var options = null;
            if (setDatasourceName != null) {
                if (setDatasourceName === datasource.name()) {
                    options = $('<option value="' + dsIndex + '">' + datasource.name() + '</options>');
                } else {
                    options = $('<option value="' + dsIndex + '">' + datasource.name() + '</options>');
                }
            } else {
                options = $('<option value="' + dsIndex + '">' + datasource.name() + '</options>');
            }
//            console.log(options);
            selectDatasources.find('select').append(options);
            dsIndex++;
        });
        codeWindowHeader.append(codeWidonwToolbar);
        
    }

    function _renderToolbarRow() {
        return '<div class="code-window-toolbar-row"></div>';
    }

    function layoutAdjust() {

        codeWindowFooter.find('textarea').remove();
        
        codeMirrorWrapper.find('textarea').css({
            resize: 'none',
            'margin-left': '0px'
        });

        codeMirrorWrapper.find('textarea').insertAfter('.code-window #jf-expand-all');

        codeMirrorWrapper.find('#jf-formattedJSON').css({
            padding: '10px',
           'margin-top': '0px' 
        });
        
        codeWindowHeader.find('.code-window-toolbar').css({
           'margin-top': '25px' 
        });
        
    }

    // Public API
    return {
        displayJSEditor: function (value, mode, callback) {
            displayJSEditor(value, mode, callback);
        },
        setAssetRoot: function (assetRoot) {
            setAssetRoot(assetRoot);
        }
    };
};