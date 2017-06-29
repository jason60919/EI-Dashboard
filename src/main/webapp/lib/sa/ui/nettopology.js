/* 
 * network topology plugin (VivaGraph)
 * @date 20150720
 * [
 *    {
 *      name: 'macId or label',
 *      type: 'text', //text or image,
 *      url: 'http://img.png', for image node
 *      from: 'fromNodeName',
 *      to: 'toNodeName',
 *      weigth: 1,
 *    }
 * ]
 */

;
(function ($) {

    var NODE_PREFIX = 'label_';
    //define plugin name
    var pluginName = 'nettopology';

    //create plugin class
    function Plugin(element, options) {
        this.logger = log4jq.getLogger({
            loggerName: 'nettopology.js'
        });

        this.el = element;
        this.$el = $(element);
        this.elemId = null;
        this.vivagInstance = {};//save viva g object
        this.options = $.extend({}, $.fn[pluginName].defaults, options);


        //constrctor
        this.init();

        return this;
    }
    ;

    Plugin.prototype.name = pluginName;
    Plugin.prototype.version = '0.0.1';

    Plugin.prototype = {
        init: function () {

            var plugin = this;
            plugin.logger.info('init');

            plugin.draw();

        },
        draw: function () {

            var plugin = this;

            plugin.logger.info('draw');
            //get default options
            var opts = plugin.options;
            var nodes = opts.nodes;
            var nodeSize = opts.nodeSize;
            var nodeFontSize = opts.nodeFontSize;
            //viva libs
            var graph = Viva.Graph.graph();
            //keep (save to add function)
            plugin.vivagInstance.graph = graph;
            //圖形演算法
            var layout = Viva.Graph.Layout.forceDirected(graph, {
//                 springLength:100,
//                 springCoeff:0.0001,
//                 dragCoeff:0.02,
//                 gravity:-1
                stableThreshold: 0.09,
                dragCoeff: 0.04,
                springCoeff: 0.0004,
                gravity: -1.5,
                springLength: 150

            });

//            var gen = new Viva.Graph.generator();
//            var graph = gen.balancedBinTree(5);
//        var layout = Viva.Graph.Layout.constant(graph);
//        var nodePositions = generateNodePositions(graph,nodes.length);

//  
            //highlight 關聯節點
            var highlightRelatedNodes = function (nodeId, isOn) {
                // just enumerate all realted nodes and update link color:
                graph.forEachLinkedNode(nodeId, function (node, link) {
                    var linkUI = viewSVGGaphics.getLinkUI(link.id);
                    if (linkUI) {
                        // linkUI is a UI object created by graphics below
                        linkUI.attr('stroke', isOn ? 'red' : 'gray');
                    }
                });
            };

            var viewSVGGaphics = Viva.Graph.View.svgGraphics();
            viewSVGGaphics.node(function (node) {

                plugin.logger.debug('viewSVGGaphics callback');
                // This time it's a group of elements: http://www.w3.org/TR/SVG/struct.html#Groups
                var ui = Viva.Graph.svg('g');
                if (typeof (node) !== 'undefined' && typeof (node.data) !== 'undefined') {

                    // Create SVG text element with user id as content
                    var svgText = Viva.Graph.svg('text')
                            .attr('font-size', nodeFontSize)
                            .attr('y', '-4px').text(node.id);
                    ui.append(svgText);
                    if (node.data.hasOwnProperty('imglink')) {

                        var img = Viva.Graph.svg('image')
                                .attr('width', nodeSize)
                                .attr('height', nodeSize)
                                .link(node.data.imglink);
                        ui.append(img);

                    } else {

                        var colortmp = (node.data.type === 0) ? '#00a2e8' : 'gray';
                        var rectElem = Viva.Graph.svg('rect')
                                .attr('width', nodeSize)
                                .attr('height', nodeSize)
                                .attr('fill', colortmp);
                        ui.append(rectElem);
                    }


                    $(ui).hover(function () { // mouse over
                        highlightRelatedNodes(node.id, true);
                    }, function () { // mouse out
                        highlightRelatedNodes(node.id, false);
                    });

                    $(ui).mousemove(function () {
                        plugin.logger.debug('mouse move node: ');
//                        plugin.reset();
                    });

                    $(ui).click(function () {
                        plugin.logger.debug('click node: ');
                        plugin.logger.debug(node);
                        //callback event
                        if (opts.afterClick && typeof (opts.afterClick) === 'function') {
                            opts.afterClick(node);
                        }
                    });

                } else {
                    plugin.logger.error('undefiend node');
                    plugin.logger.error(node);
                }
                return ui;

            })
                    .placeNode(function (nodeUI, pos) {
//                 plugin.logger.debug('placeNode callback');
                        // 'g' element doesn't have convenient (x,y) attributes, instead
                        // we have to deal with transforms: http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribute
                        nodeUI.attr('transform',
                                'translate(' +
                                (pos.x - nodeSize / 2) + ',' + (pos.y - nodeSize / 2) +
                                ')');

                        // Shift image to let links go to the center:
//            nodeUI.attr('transform', 'translate(' + (pos.x - 12) + ',' + (pos.y - 12) + ')');

                    });

            // To render an arrow we have to address two problems:
            //  1. Links should start/stop at node's bounding box, not at the node center.
            //  2. Render an arrow shape at the end of the link.

            // Rendering arrow shape is achieved by using SVG markers, part of the SVG
            // standard: http://www.w3.org/TR/SVG/painting.html#Markers

//            var marker = createMarker('Triangle');
//            marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');
//
//            // Marker should be defined only once in <defs> child element of root <svg> element:
//            var defs = viewSVGGaphics.getSvgRoot().append('defs');
//            defs.append(marker);

            var geom = Viva.Graph.geom();
            viewSVGGaphics.link(function (link) {
                // Notice the Triangle marker-end attribe:

                var colortmp =
                        (link.data) && (link.data.color) ? link.data.color
                        : 'gray';


                var label =
                        Viva.Graph.svg('text')
//                        .attr('id', 'label_' + link.data.name)
                        .attr('id', generateNodeId(link.data.name))

                        .attr('fill', '#FF3300');

                if (link.data.weight != null) {
                    label.text(link.data.weight);
                }


                viewSVGGaphics.getSvgRoot().childNodes[0].append(label);

                return Viva.Graph.svg('path')
                        .attr('stroke', colortmp)
                        .attr('marker-end', 'url(#Triangle)')
                        .attr('id', link.data.name);


            }).placeLink(function (linkUI, fromPos, toPos) {
                var toNodeSize = nodeSize,
                        fromNodeSize = nodeSize;

                var from = geom.intersectRect(
                        fromPos.x - fromNodeSize / 2, // left
                        fromPos.y - fromNodeSize / 2, // top
                        fromPos.x + fromNodeSize / 2, // right
                        fromPos.y + fromNodeSize / 2, // bottom
                        fromPos.x, fromPos.y, toPos.x, toPos.y)
                        || fromPos;

                var to = geom.intersectRect(
                        toPos.x - toNodeSize / 2, // left
                        toPos.y - toNodeSize / 2, // top
                        toPos.x + toNodeSize / 2, // right
                        toPos.y + toNodeSize / 2, // bottom
                        // segment:
                        toPos.x, toPos.y, fromPos.x, fromPos.y)
                        || toPos;

                var data = 'M' + from.x + ',' + from.y +
                        'L' + to.x + ',' + to.y;

                linkUI.attr('d', data);

//                $('#label_' + linkUI.attr('id'))
                $('#' + generateNodeId(linkUI.attr('id')))
                        .attr('x', (from.x + to.x) / 2)
                        .attr('y', (from.y + to.y) / 2);
            });

            graph.beginUpdate();
            // Finally we add something to the graph:
            var nodeIndex = 0;
            var countOfNodes = nodes.length;
            plugin.logger.info('count: ' + countOfNodes);
            for (nodeIndex; nodeIndex < countOfNodes; nodeIndex++) {
                var currNode = nodes[nodeIndex];
//                plugin.logger.debug(currNode);
                plugin.addNode(currNode);
            }
            graph.endUpdate();

            var renderer = Viva.Graph.View.renderer(graph, {
                graphics: viewSVGGaphics,
                container: plugin.$el[0],
//                interactive: 'scroll'
                        interactive: true
                , layout: layout
            });
            renderer.zoomOut();
            renderer.zoomOut();
            renderer.run();


            plugin.vivagInstance.renderer = renderer;
        },
        redraw: function (nodes) {
            var plugin = this;

            plugin.logger.info('redraw:' + nodes.length);
            plugin.clear();
            var opts = plugin.options;
            opts.nodes = nodes;
            plugin.draw();
        },
        addNode: function (currNode) {
            var plugin = this;
            plugin.logger.info('add node: ' + currNode.name);
            var graph = plugin.vivagInstance.graph;

            //add node (node label, node data)
            var newNode = graph.addNode(currNode.name, currNode);

//                newNode.isPinned = true; // Now this node will not be moved by the layout algorithm.
            //add node's link
            if (currNode.to !== '') {
                var nodeData = {};
                if (currNode.weight !== '' && typeof (currNode.weight) !== 'undefined') {

                    nodeData = {
                        name: currNode.name,
                        weight: currNode.weight
                    };
                } else {

                    nodeData = {
                        name: currNode.name,
                        weight: null
                    };
                }

                graph.addLink(currNode.from, currNode.to, nodeData);

            } else {
                pluign.logger.error('cannot find to property');
            }
        },
        clear: function () {
            var plugin = this;
            plugin.logger.info('clear');
//            plugin.logger.debug(plugin.vivagInstance.renderer);

            if (typeof (plugin.vivagInstance.renderer) !== 'undefined'
                    && plugin.vivagInstance.renderer !== null) {

                plugin.vivagInstance.renderer.dispose(); // remove the graph
                //reset rederer instance 
                plugin.vivagInstance = {};
            } else {
                plugin.logger.warn('cannot found viva renderer');
            }
        },
        reset: function () {
            var plugin = this;
            plugin.logger.info('reset');
//            plugin.logger.debug(plugin.vivagInstance.renderer);

            if (typeof (plugin.vivagInstance.renderer) !== 'undefined'
                    && plugin.vivagInstance.renderer !== null) {

                plugin.vivagInstance.renderer.reset();
            } else {
                plugin.logger.warn('cannot found viva renderer');
            }
        },
        pause: function () {
            var plugin = this;
            plugin.logger.info('pause');
//            plugin.logger.debug(plugin.vivagInstance.renderer);

            if (typeof (plugin.vivagInstance.renderer) !== 'undefined'
                    && plugin.vivagInstance.renderer !== null) {

                plugin.vivagInstance.renderer.pause();
            } else {
                plugin.logger.warn('cannot found viva renderer');
            }
        },
        resume: function () {
            var plugin = this;
            plugin.logger.info('resume');
//            plugin.logger.debug(plugin.vivagInstance.renderer);

            if (typeof (plugin.vivagInstance.renderer) !== 'undefined'
                    && plugin.vivagInstance.renderer !== null) {

                plugin.vivagInstance.renderer.resume();
            } else {
                plugin.logger.warn('cannot found viva renderer');
            }
        },
        /**
         * The 'destroy' method is were you free the resources used by your plugin:
         * references, unregister listeners, etc.
         *
         * Remember to unbind for your event:
         *
         * @example
         * this.$someSubElement.off('.' + pluginName);
         *
         * Above example will remove any listener from your plugin for on the given
         * element.
         */
        destroy: function () {
            var plugin = this;
            plugin.$el.empty();
            // Remove any attached data from your plugin
            plugin.$el.removeData();
        },
        /**
         * Write public methods within the plugin's prototype. They can 
         * be called with:
         *
         * @example
         * $('#element').jqueryPlugin('somePublicMethod','Arguments', 'Here', 1001);
         *  
         * @param  {[type]} foo [some parameter]
         * @param  {[type]} bar [some other parameter]
         * @return {[type]}
         */
        pubMethod: function () {

        }

    }

    /**
     * This is a real private method. A plugin instance has access to it
     * @return {[type]}
     */
    var privateMethod = function () {
        console.log('privateMethod');
        console.log(this);
    };

    var createMarker = function (id) {
        return Viva.Graph.svg('marker')
                .attr('id', id)
                .attr('viewBox', '0 0 10 10')
                .attr('refX', '10')
                .attr('refY', '5')
                .attr('markerUnits', 'strokeWidth')
                .attr('markerWidth', '10')
                .attr('markerHeight', '5')
                .attr('orient', 'auto');
    };

    var generateNodePositions = function (graph, radius) {
        var nodePositions = [];
        var n = graph.getNodesCount();

        for (var i = 0; i < n; i++) {
            var pos = {
                x: radius * Math.cos(i * 2 * Math.PI / n),
                y: radius * Math.sin(i * 2 * Math.PI / n)
            };
            nodePositions.push(pos);
        }
        return nodePositions;
    };

    // Plugin wrapper around the constructor,
    $.fn[pluginName] = function (options) {

        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            // Create a plugin instance for each selected element.
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            // Call a pluguin method for each selected element.
            if (Array.prototype.slice.call(args, 1).length == 0 && $.inArray(options, $.fn[pluginName].getters) != -1) {
                // If the user does not pass any arguments and the method allows to
                // work as a getter then break the chainability
                var instance = $.data(this[0], 'plugin_' + pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                // Invoke the speficied method on each selected element
                return this.each(function () {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    }

    /**
     * Names of the pluguin methods that can act as a getter method.
     * @type {Array}
     */
    $.fn[pluginName].getters = ['pubMethod'];

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        nodes: [],
        nodeFontSize: 20,
        nodeSize: 24,
        afterClick: null
    };

    var generateNodeId = function (nodeName) {
        var nodeId = NODE_PREFIX + nodeName.replace(/\//g, '_');
        return nodeId;
    };
})(jQuery);