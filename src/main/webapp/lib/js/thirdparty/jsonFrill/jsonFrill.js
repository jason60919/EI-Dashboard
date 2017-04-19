/*!
 * jQuery jsonFrill plugin v0.1
 * https://github.com/sparuvu/jsonFrill
 *
 * Released under the MIT license
 * https://raw.github.com/sparuvu/jsonFrill/master/LICENSE
 *
 * Date: 2014-1-9
 */

;
(function ($, window, document, undefined) {
    var jsonFrillLog = log4jq.getLogger({
        loggerName: 'jsonFrill.js'
    });
    $.fn.jsonFrill = function (options, jsonSource) {
        jsonFrillLog.info('init jsonFrill');
        var jf = jf || {};
        jf.settings = $.extend({
            collapse: false,
            toolbar: false,
            displayPath: true,
            tabSize: 2,
            clickNodeCallback: function (nodePath) {
                jsonFrillLog.info('clickNode: ' + nodePath);
            }
        }, options);

        var _indentationLevel = 1,
                lineBreak = "</br>",
                seperator = " : ",
                parentBrace = '<span class="jf-open-brace jf-parent-brace">{</span>',
                collapsedClass = jf.settings.collapse ? "jf-collapsed" : "",
                braces = {
                    "object": {
                        open: '<span class="jf-open-brace">{</span>',
                        close: '<span class="jf-close-brace">}</span>'
                    },
                    "array": {
                        open: '<span class="jf-open-brace">[</span>',
                        close: '<span class="jf-close-brace">]</span>'
                    }
                },
        $ellipses = '<span class="jf-ellipses jf-hide">...</span>',
                TAB_SIZE = new Array(jf.settings.tabSize > 0 ? jf.settings.tabSize : 0).join(' '),
                SPACES = addSpaces(_indentationLevel);



        function addSpaces(level) {
//             jsonFrillLog.info('addSpaces: ' + level);
            return '<span class="jf-spaces">' + new Array(level + 1).join("| " + TAB_SIZE) + '</span>';
        }

        function getKey(key, jfClass, parentPath) {
            jsonFrillLog.info('getKey key:' + key + ', parentPath:' + parentPath);
            if (jfClass) {
//                return '<span class="' + jfClass + '">' + SPACES + '<span class="jf-key jf-collapse">'  + key + '</span></span>';
                return '<span class="' + jfClass + '">' + SPACES + '<span class="jf-key jf-collapse"><span class="jf-key-action"></span><span class="js-key-text" data-path="' + parentPath + '">' + key + '</span></span></span>';
            }
//            return '<span class="jf-key">' + SPACES + key + '</span>';
            return '<span class="jf-key">' + SPACES + '<span class="js-key-text" data-path="' + parentPath + '">' + key + '</span></span>';
        }

        /*
         * 
         * @param {String} key: key of json
         * @param {String} value: value of key
         * @param {String} type: boolean/string/number
         * @returns {String}
         */
        function processPrimitive(key, value, type, parentPath) {
            jsonFrillLog.info('processPrimitive: ' + key, ' parentPath: ' + parentPath);

            return '<div class="jf-prop jf-item ' + collapsedClass + ' " >' + getKey(key, false, parentPath) + seperator + '<span class="jf-value jf-' + type + '">' + value + '</span></div>';
        }

        function processNonPrimitive(openBrace, closeBrace, key, value, parentPath) {

            jsonFrillLog.info('processNonPrimitive: ' + key, ' parentPath: ' + parentPath);
            var temp = "";


            SPACES = addSpaces(++_indentationLevel);
            //recursive
            temp = process(value, parentPath);
            SPACES = addSpaces(--_indentationLevel);
            if (temp) {
                temp = getKey(key, "jf-collapsible-title", parentPath) + seperator + openBrace + $ellipses + lineBreak + temp + SPACES + closeBrace;
            } else {
                temp = getKey(key, false, parentPath) + seperator + openBrace + " " + closeBrace;
            }
            return '<div class="jf-collapsible jf-item ' + collapsedClass + ' ">' + temp + '</div>';
        }

        var keyPath = '';
        var currPath = '';
        function process(obj, parentPath) {
            jsonFrillLog.info('process: obj as below');

            var str = "";
            if ($.isEmptyObject(obj)) {
                return false;
            }

            for (var key in obj) {
                var type = $.type(obj[key]);

                if (parentPath == '') {
                    currPath = key;
                } else {
                    currPath = parentPath + '/' + key;
                }


                if (type == "object" || type == "array") {
                    //recursive 
                    str += processNonPrimitive(braces[type].open, braces[type].close, escape(key), obj[key], currPath);

                } else {
                    //leaf
                    jsonFrillLog.info('process leaf:' + key);
                    str += processPrimitive(escape(key), ($.type(obj[key]) === "string" ? escape(obj[key]) : obj[key]), type, currPath);

                    //back to parent path
//                        keyPath= keyPath.replace('/' + key,'');
                }
            }
            return str;
        }

        function escape(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function jfShow($obj, $key, animate) {
            (animate ? $obj.slideDown(40) : $obj.show()).removeClass('jf-collapsed').siblings('.jf-ellipses').fadeOut('fast');
            $key.addClass('jf-collapse');
        }

        function jfHide($obj, $key, animate) {
            (animate ? $obj.slideUp(40) : $obj.hide()).addClass('jf-collapsed').siblings('.jf-ellipses').fadeIn('fast');
            $key.removeClass('jf-collapse');
        }

        function bindings() {
            jsonFrillLog.info('bindings');

            var $title = $('span.jf-collapsible-title'),
                    elements = {
                        collapsibleDivs: $title.siblings('div.jf-item'),
                        collapsibleKeys: $title.children('span.jf-key'),
                        formattedJSON: $('div#jf-formattedJSON')
                    };

//          


            elements.formattedJSON.on('click', 'span.js-key-text', function (e) {
                jsonFrillLog.debug('click item to select (span.js-key-text)');
                e.preventDefault();
//                 event.stopPropagation();
                var clickItem = $(this);
                var dataPath = clickItem.attr('data-path');
                $('#jf-data-path').text(dataPath);
                jf.settings.clickNodeCallback(dataPath);
            });

//          elements.formattedJSON.on('click', 'span.jf-collapsible-title', function (e) {
//                jsonFrillLog.debug('click item(jf-collapsible-title)');
//                e.preventDefault();
//                var clickItem  = $(this);
//                console.log(clickItem);
//                var $divs = clickItem.siblings('div'), $key =clickItem.children('span.jf-key');
//                $divs.hasClass('jf-collapsed') ? jfShow($divs, $key, true) : jfHide($divs, $key, true);
//                          
//            });



            elements.formattedJSON.on('click', 'span.jf-key-action', function (e) {
                jsonFrillLog.debug('click item(jf-key-action)');
                e.preventDefault();
                var clickItem = $(this);
                var collapsibleTitleOfClickItem = clickItem.parent().parent();
//                console.log(collapsibleTitleOfClickItem);
                var $divs = collapsibleTitleOfClickItem.siblings('div'), $key = collapsibleTitleOfClickItem.children('span.jf-key');
                $divs.hasClass('jf-collapsed') ? jfShow($divs, $key, true) : jfHide($divs, $key, true);
            });



            elements.formattedJSON.on('click', 'span.jf-parent-brace', function (e) {
                e.preventDefault();
                var $divs = $(this).siblings('div'), $key = $(this).children('.jf-key');
                $divs.hasClass('jf-collapsed') ? jfShow($divs, $key, true) : jfHide($divs, $key, true);
            });

            $('div.jf-prop').hover(function (e) {
//                jsonFrillLog.debug('hover if-collapsible');

//                $(this).closest('div.jf-collapsible').addClass('jf-highlight');

                e.preventDefault();
            },
                    function (e) {
                        $(this).closest('div.jf-collapsible').removeClass('jf-highlight');
                        e.preventDefault();
                    });

            $('div#jf-toolbar').on('click', "label", function () {
                var toolbarElem = $(this);
                var toolbarVal = toolbarElem.attr('data-toolbar');
//                        toolbarElem.text();
                jsonFrillLog.debug('click toolbar:' + toolbarVal);
//               toolbarVal === 'Expand All' ? jfShow($('div.jf-collapsed'), elements.collapsibleKeys)
//                        : jfHide(elements.collapsibleDivs, elements.collapsibleKeys);

                toolbarVal === 'expand' ? jfShow($('div.jf-collapsed'), elements.collapsibleKeys)
                        : jfHide(elements.collapsibleDivs, elements.collapsibleKeys);

            });

            if (jf.settings.collapse) {
                elements.formattedJSON.children('.jf-ellipses').show();
            }

        }

        function toolBar() {
            return "<div id='jf-toolbar'>"
//                        "<label id='jf-collapse-all'>Collapse All</label>" +
//                        "<label id='jf-expand-all'>Expand All</label>" +
//
//
                    + "<label id='jf-collapse-all' data-toolbar='collapse'><i class='fa fa-plus-square-o'></i> <span>"
                    + (($.i18n.t('JSEditor.jsonviewer.collapse') === '') ? 'Collapse All' : $.i18n.t('JSEditor.jsonviewer.collapse'))
                    + "</span></label>"

                    + "<label id='jf-expand-all' data-toolbar='expand'><i class='fa fa-minus-square-o'></i> <span>"
                    + (($.i18n.t('JSEditor.jsonviewer.expand') === '') ? 'Expand All' : $.i18n.t('JSEditor.jsonviewer.expand'))
                    + "</span></label>"
                    + "</div>";
        }
        ;

        function displayPath() {
            return '<div><textarea id="jf-data-path" readonly disabled="disabled"></textarea></div>';
        }
        ;

        return this.each(function () {
            try {
                if (jsonSource) {
                    if ($.type(jsonSource) == "object" || $.type(jsonSource) == "array") {
                        json = jsonSource;
                    } else {
                        jsonSource = jsonSource.trim();
                        json = jsonSource.length > 0 ? $.parseJSON(jsonSource) : {};
                    }
                } else {
                    json = $(this).text().trim();
                    json = json.length > 0 ? $.parseJSON(json) : {};
                }
            } catch (ex) {
                if (console && console.log) {
//                    console.log("Invalid Json " + ex);

                    jsonFrillLog.error('Invald JSON: ' + ex);
                }
                $(this).html(jsonSource);
            }
            var str = process(json, ''), type = $.type(json);
//                  jsonFrillLog.error('str: ' + str);
            if (str) {
                jsonFrillLog.debug('add elems (A)');
                SPACES = addSpaces(--_indentationLevel);
                var formattedJSON = '<div id="jf-formattedJSON" class="jf-collapsible">' +
                        parentBrace + $ellipses +
                        str + SPACES + braces[type].close;
                +
                        '</div>',
                        toolbar = jf.settings.toolbar ? toolBar(jf.settings.collapse) : "",
                        displaypath = jf.settings.displayPath ? displayPath() : ""
                        ;

                $(this).html(toolbar + displaypath + formattedJSON);

            } else {
                jsonFrillLog.debug('add elems (B)');
                $(this).html(braces[type].open + braces[type].close);
            }
            //bind-event
            if ($('div#jf-formattedJSON').length == 0) {
                jsonFrillLog.error('CANNOT find div (formattedJSON)');
            } else {
                bindings();
            }

        });
    };
})(jQuery, window, document);
