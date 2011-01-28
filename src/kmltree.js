
// src/kmltree.js

// I don't like documentation being in more than one place, and I couldn't 
// find any javascript documentation tools that I found satisfactory. So,
// docs can be found on the project page and should be kept up to date there:
// http://code.google.com/p/kmltree/wiki/ApiReference
var kmltree = (function(){

    openBalloon = function(kmlObject, ge, opts, that){
        var balloon;
        // Compare getBalloonHtmlUnsafe to getBalloonHtml to determine whether
        // there is even any need to use an iframe to display unsafe content
        if(opts.displayEnhancedContent){
            // don't bother checking if not going to display
            var unsafeHtml = kmlObject.getBalloonHtmlUnsafe();
            var safeHtml = kmlObject.getBalloonHtml();
            var safeHtml = $.trim(
                safeHtml.replace(
                    /\s*<!--\s*Content-type: mhtml-die-die-die\s*-->/, ''));
            var hasUnsafeContent = safeHtml != $.trim(unsafeHtml);
        }
        if(opts.displayEnhancedContent && hasUnsafeContent){
            balloon = ge.createHtmlDivBalloon('');
            var iframe = $(
                ['<iframe id="kmltree-balloon-iframe"',
                ' border="0" frameBorder="0"',
                ' src="', opts.iframeSandbox, '">',
                '</iframe>'].join(''));
            var div = document.createElement('div');
            $(div).append(iframe);
            iframe.load(function(){
                var msg = JSON.stringify({
                    html: Base64.encode(unsafeHtml),
                    callback: Base64.encode(
                        opts.sandboxedBalloonCallback.toString())
                });
                this.contentWindow.postMessage(msg, opts.iframeSandbox);
            });
            balloon.setContentDiv(div);
        }else{
            balloon = ge.createFeatureBalloon('');
            // callback for normal popups. Enhanced popup balloonopen event is 
            // triggered by resize function
            var boCallback = function(e){
                // This has to be done within a setTimeout call. Otherwise you 
                // can't open another balloon using an event listener and 
                // count on that event to fire. I think this is so you can 
                // have callbacks like balloonOpening that don't go into an 
                // infinite loop
                setTimeout(function(){
                    $(that).trigger('balloonopen', [
                        e.getBalloon(), e.getFeature()]);
                }, 1);
                google.earth.removeEventListener(
                    ge, 'balloonopening', boCallback);
            };
            google.earth.addEventListener(ge, 'balloonopening', boCallback);
        }
        balloon.setFeature(kmlObject);
        ge.setBalloon(balloon);
    }
    
    function resize(e, ge, defaultDimensions, that){
        var b = ge.getBalloon();
        if(!e.data.match(/width/) || b.getType() !== 'GEHtmlDivBalloon' || $(
            b.getContentDiv()).find('iframe')[0].contentWindow !== e.source){
            // Oooooo... A zombie Iframe!!!
            // don't do anything, that balloon has already closed
            return;
        }
        var dim = JSON.parse(e.data)
        if(dim.unknownIframeDimensions){
            dim = defaultDimensions;
        }
        var el = $('#kmltree-balloon-iframe');
        b.setMinWidth(dim.width);
        b.setMaxWidth(dim.width + (dim.width * .1));
        b.setMinHeight(dim.height);
        b.setMaxHeight(dim.height + (dim.height * .1));
        el.height(dim.height);
        el.width(dim.width);
        $(that).trigger('balloonopen', [b, b.getFeature()]);
    }
    
    // can be removed when the following ticket is resolved:
    // http://code.google.com/p/earth-api-samples/issues/detail?id=290
    function qualifyURL(url) {
        var a = document.createElement('a');
        a.href = url;
        return a.href;
    }

    var NetworkLinkQueue = function(opts){
        if(opts['success'] && opts['error'] && opts['tree']){
            this.queue = [];
            this.opts = opts;
        }else{
            throw('missing required option');
        }
    };
    
    NetworkLinkQueue.prototype.add = function(node, callback){
        this.queue.push({
            node: node,
            callback: callback,
            loaded: false,
            errors: false
        });
    };
    
    NetworkLinkQueue.prototype.execute = function(){
        if(this.queue.length === 0){
            this.opts['success']([]);
        }else{
            for(var i=0;i<this.queue.length;i++){
                var item = this.queue[i];
                item.node.data('queueItem', item);
                if(!item.loaded && !item.loading){
                    var self = this;
                    $(item.node).bind('loaded', function(e, node, kmlObject){
                        self.nodeLoadedCallback(e, node, kmlObject)
                    });
                    this.opts['tree'].openNetworkLink(item.node);
                    item.loading = true;
                }
            }
        }
    };
    
    NetworkLinkQueue.prototype.nodeLoadedCallback = function(e, node, kmlObj){
        var item = node.data('queueItem');
        if(item.loaded === true){
            throw('event listener fired twice for '
                + node.find('>span.name').text());
        }
        item.loaded = true;
        item.loading = false;
        $(node).unbind('loaded');
        item.callback(node);
        this.execute();
        this.finish(item);
    };
    
    NetworkLinkQueue.prototype.finish = function(item){
        var done = true;
        var noerrors = true;
        for(var i=0;i<this.queue.length;i++){
            done = (done && this.queue[i].loaded);
            noerrors = (noerrors && !this.queue[i].errors);
        }
        if(done){
            if(noerrors){
                this.opts['success'](this.queue);
                this.destroy();                
            }else{
                this.opts['error'](this.queue);
                this.destroy();                
            }
        }
    };
    
    NetworkLinkQueue.prototype.destroy = function(){
        for(var i=0;i<this.queue.length;i++){
            var item = this.queue[i];
            item.node.unbind('load');
        }
        this.queue = [];
    };
    
    // Returns a jquery object representing a kml file
    
    var template = tmpl([
        '<li UNSELECTABLE="on" id="<%= id %>" class="kmltree-item ',
        '<%= listItemType %> ',
        '<%= type %> ',
        '<%= customClass %> ',
        '<%= (visible ? "visible " : "") %>',
        '<%= (customIcon ? "hasIcon " : "") %>',
        '<%= (alwaysRenderNodes ? "alwaysRenderNodes " : "") %>',
        '<%= (select ? "select " : "") %>',
        '<%= (open ? "open " : "") %>',
        '<%= (description ? "hasDescription " : "") %>',
        '<%= (snippet ? "hasSnippet " : "") %>',
        '<%= (customIcon ? "customIcon " : "") %>',
        '<% if(kmlId){ %>',
            '<%= kmlId %> ',
        '<% } %>',
        '<% if(geoType){ %>',
            '<%= geoType %>',
        '<% } %>',
        '"',
        '<% if(kmlId){ %>',
            ' data-id="<%= kmlId %>"',
        '<% } %>',
        '>',
            '<div UNSELECTABLE="on" class="expander">&nbsp;</div>',
            '<div UNSELECTABLE="on" class="toggler">&nbsp;</div>',
            '<div ',
            '<% if(customIcon){ %>',
                'style="background:url(<%= customIcon %>); -moz-background-size:16px 16px; -webkit-background-size:16px 16px;"',
            '<% } %>',
            'class="icon">',
                '<% if(type === "KmlNetworkLink"){ %>',
                    '<div class="nlSpinner">&nbsp;</div>',
                '<% } %>',                
                '&nbsp;',
            '</div>',
            '<span UNSELECTABLE="on" class="name"><%= name %></span>',
            '<% if(snippet){ %>',
                '<p UNSELECTABLE="on" class="snippet"><%= snippet %></p>',
            '<% } %>',
            '<% if(children.length) { %>',
            '<ul><%= renderOptions(children) %></ul>',
            '<% } %>',
        '</li>'
    ].join(''));
    
    var constructor_defaults = {
        visitFunction: function(kmlObject, config){return config},
        refreshWithState: true,
        bustCache: false,
        restoreState: false,
        whitelist: [],
        supportItemIcon: false,
        loadingMsg: 'Loading data',
        setExtent: false,
        displayDocumentRoot: 'auto',
        displayEnhancedContent: false,
        iframeSandbox: 'http://10.0.1.5/~cburt/kmltree/src/iframe.html',
        unknownIframeDimensionsDefault: {height: 450, width:530},
        sandboxedBalloonCallback: function(){}
    };
        
        
    return function(opts){
        
        var that = {};
        var errorCount = 0;
        var lookupTable = {};
        that.lookupTable = lookupTable;
        that.kmlObject = null;
        var docs = {};
        var opts = jQuery.extend({}, constructor_defaults, opts);
        var ge = opts.gex.pluginInstance;
        var destroyed = false;
        var internalState = {};

        if(parseFloat(ge.getPluginVersion()) < 5.2){
            alert('kmltree requires a google earth plugin version >= 5.2');
        }
                
        if(!opts.url || !opts.gex || !opts.element || !opts.mapElement){
            throw('kmltree requires options url, gex, mapElement & element');
        }
        
        opts.element = $(opts.element);
        
        if(!opts.element.attr('id')){
            opts.element.attr('id', 'kml-tree'+(new Date()).getTime());
            opts.element.attr('UNSELECTABLE', "on");
        }
        
        if(opts.restoreState){
            $(window).unload(function(){
                that.destroy();
            });
        }
        
        if(opts.element.css('position') !== 'absolute'){
          $(opts.element).css({position: 'relative'});
        }
        
        // check for background-size support
        var div = $(['<div class="kmltree" style="',
            'background-size: 16px 16px; ',
            '-moz-background-size: 16px 16px; ',
            '-o-background-size: 16px 16px; ',
            '-webkit-background-size: 16px 16px; ',
            '-khtml-background-size: 16px 16px;"></div>'].join(''));

        var supportsBgSize = (div[0].style.backgroundSize !== undefined 
            || div[0].style.MozBackgroundSize  !== undefined
            || div[0].style.oBackgroundSize !== undefined
            || div[0].style.khtmlBackgroundSize !== undefined
            || div[0].style.webkitBackgroundSize !== undefined);
        
        
        
        if(opts.displayEnhancedContent){
            $(window).bind("message", function(e){
                // Verify that message came from the correct source
                var e = e.originalEvent;
                var iframe = $('#kmltree-balloon-iframe');
                if(iframe.length && e.source === iframe[0].contentWindow){
                    resize(e, ge, opts.unknownIframeDimensionsDefault, that);
                }
            });
        }
        
        var buildOptions = function(kmlObject, docUrl, extra_scope){
            var options = {name: kmlObject.getName(), 
                id: 'kml' + 
                (extra_scope ? extra_scope.replace(/\W/g, '-') : '') + 
                docUrl.replace(/\W/g, '-')};
            google.earth.executeBatch(ge, function(){
                opts.gex.dom.walk({
                    visitCallback: function(context){
                        var parent = context.current;
                        if(!parent.children){
                            parent.children = [];
                        }
                        var name = this.getName();
                        var id = addLookup(this, parent.id, docUrl, name);
                        var snippet = this.getSnippet();
                        // To support generated output from certain software 
                        // (Arc2Earth, etc)
                        if(!snippet || snippet === 'empty'){
                            snippet = false;
                        }
                        var type = this.getType();
                        var geotype = false;
                        if(type === 'KmlPlacemark'){
                            var geo = this.getGeometry();
                            if(geo){
                                geotype = geo.getType();
                            }
                        }
                        var style = this.getComputedStyle();
                        var child = {
                            renderOptions: renderOptions,
                            name: name || '&nbsp;',
                            visible: !!this.getVisibility(),
                            type: type,
                            open: this.getOpen(),
                            id: id,
                            description: this.getDescription(),
                            snippet: snippet,
                            select: false,
                            listItemType: getListItemType(style),
                            customIcon: customIcon(this),
                            customClass: '',
                            children: [],
                            alwaysRenderNodes: false,
                            kmlId: this.getId().replace(/\W/g, '-'),
                            geoType: geotype
                        }
                        child = opts.visitFunction(this, child);
                        parent.children.push(child);
                        if(child.listItemType !== 'checkHideChildren'){
                            context.child = child;
                        }else{
                            context.walkChildren = false;
                        }
                    },
                    rootObject: kmlObject,
                    rootContext: options
                });
            });
            return options;
        };
        
        var load = function(cachebust){
            if(that.kmlObject){
                throw('KML already loaded');
            }
            showLoading();
            var url = qualifyURL(opts.url);
            if(cachebust || opts.bustCache){
                var buster = (new Date()).getTime();
                if(url.indexOf('?') === -1){
                    url = url + '?cachebuster=' + buster;
                }else{
                    url = url + '&cachebuster=' + buster;
                }
            }
            google.earth.fetchKml(ge, url, function(kmlObject){
                if(!destroyed){
                    processKmlObject(kmlObject, url, opts.url);
                }
            });
        };
        
        that.load = load;
        
        var refresh = function(){
            if(opts.refreshWithState){
                that.previousState = getState();
            }
            clearKmlObjects();
            clearLookups();
            // opts.element.html('');
            ge.setBalloon(null);
            load(true);
        };

        that.refresh = refresh;
        
        // returns all nodes that represent a kmlObject with a matching ID
        var getNodesById = function(id){
            return opts.element.find('.'+id.replace(/\W/g, '-'));
        };
        
        that.getNodesById = getNodesById;
                
        // Selects the first node found matching the ID
        var selectById = function(id){
            var node = getNodesById(id)[0];
            return selectNode(node, lookup(node));
        };
        
        that.selectById = selectById;
        
        var clearSelection = function(keepBalloons, dontTriggerEvent){
            var prev = $('#'+opts.element.attr('id'))
                .find('.selected').removeClass('selected');
            if(prev.length){
                prev.each(function(){
                    setModified($(this), 'selected', false);
                });
                if(!dontTriggerEvent){
                    $(that).trigger('select', [null, null]);
                }
            }
            var balloon = ge.getBalloon();
            if(balloon && !keepBalloons){
                ge.setBalloon(null);
            }
        }
        
        // Don't give external callers access to the keepBalloons and 
        // dontTriggerEvent arguments
        that.clearSelection = function(){
            return clearSelection();
        };
                    
        var showLoading = function(msg){
            hideLoading();
            var msg = msg || opts.loadingMsg;
            var h = $('<div class="kmltree-loading"><span>' + 
                msg + '</span></div>');
            var height = opts.element.height();
            if(height !== 0){
                h.height(height);
            }else{
                // h.height(200);
            }
            opts.element.append(h);
        };
        
        that.showLoading = showLoading;
        
        var hideLoading = function(){
            opts.element.find('.kmltree-loading').remove();
        };
        
        that.hideLoading = hideLoading;
        
        // url has cachebusting GET vars, original_url does not
        var processKmlObject = function(kmlObject, url, original_url){
            internalState = {};
            if (!kmlObject) {
                if(errorCount === 0){
                    errorCount++;
                    setTimeout(function(){
                        // Try to reset the browser cache, then try again
                        jQuery.ajax({
                            url: url,
                            success: function(){
                                that.load(true);
                            },
                            error: function(){
                                processKmlObject(
                                    kmlObject, url, original_url);
                            }
                        });
                        // try to load 
                    }, 100);
                    return;                    
                }else{
                    // show error
                    setTimeout(function() {
                        opts.element.html([
                            '<div class="kmltree">',
                                '<h4 class="kmltree-title">',
                                    'Error Loading',
                                '</h4>',
                                '<p class="error">',
                                    'could not load kml file. Try clicking ',
                                    '<a target="_blank" href="', url, '">',
                                        'this link',
                                    '</a>',
                                    ', then refreshing the application.',
                                '<p>',
                            '</div>'
                        ].join(''));
                        $(that).trigger('kmlLoadError', [kmlObject]);
                    },
                    0);
                    return;                    
                }
            }
            errorCount = 0;
            that.kmlObject = kmlObject;
            that.kmlObject.setVisibility(true);
            var options = buildOptions(kmlObject, original_url);
            var root;
            if(opts.displayDocumentRoot === false){
                root = options.children[0].children;
            }else if(opts.displayDocumentRoot === true){
                root = options.children[0];
            }else{ // opts.displayDocumentRoot === 'auto'
                var children = options.children[0].children;
                var i = 0;
                var placemarks = false;
                while(i < children.length && placemarks === false){
                    placemarks = children[i].type === 'KmlPlacemark';
                    i++;
                }
                if(placemarks){
                    root = options.children[0];
                }else{
                    root = options.children[0].children;
                }
            }
            var rendered = renderOptions(root);
            opts.element.find('div.kmltree').remove();
            opts.element.find('.kmltree-loading').before([
                '<div UNSELECTABLE="on" class="kmltree">',
                    '<h4 UNSELECTABLE="on" class="kmltree-title">',
                        options.children[0].name,
                    '</h4>',
                    '<ul UNSELECTABLE="on" class="kmltree">',
                        rendered,
                    '</ul>',
                '</div>'
            ].join(''));
            ge.getFeatures().appendChild(kmlObject);
            
            if(!that.previousState){
                if(opts.restoreState && !!window.localStorage){
                    that.previousState = getStateFromLocalStorage();
                }
            }
            var queue = new NetworkLinkQueue({
                success: function(links){
                    hideLoading();
                    if(opts.setExtent){
                        var aspectRatio = null;
                        var m = $(opts.mapElement);
                        if(m.length){
                            var aspectRatio = m.width() / m.height();
                        }
                        opts.gex.util.flyToObject(kmlObject, {
                            boundsFallback: true,
                            aspectRatio: aspectRatio
                        });
                        opts.setExtent = false;
                    }
                    $(that).trigger('kmlLoaded', [kmlObject]);
                },
                error: function(links){
                    hideLoading();
                    $(that).trigger('kmlLoadError', [kmlObject]);
                },
                tree: that
            });
            if(that.previousState){
                restoreState(that.previousState, queue);
            }else{
                queueOpenNetworkLinks(queue, 
                    $('#' + opts.element.attr('id')));
            }
        };
        
        var restoreState = function(state, queue){
            // go thru the whole state, opening, changing visibility, 
            // and selecting
            for(var id in state){
                var el = $('#'+id);
                if(el.length === 1){
                    for(var key in state[id]){
                        el.toggleClass(key, state[id][key]['value']);
                        setModified(el, key, state[id][key]['value']);
                        if(key === 'visible'){
                            lookup(el).setVisibility(state[id][key]['value']);
                        }
                    }
                    delete state[id];
                }
            }
            var links = $('#' + opts.element.attr('id')).find(
                'li.KmlNetworkLink.open');
            links.each(function(){
                var n = $(this);
                // no need to open if checkHideChildren is set
                if(!n.hasClass('checkHideChildren') && !n.hasClass('loading') 
                    && !n.hasClass('loaded') && !n.hasClass('error')){
                    queue.add(n, function(loadedNode){
                        restoreState(state, queue);
                    });                    
                }
            });
            queue.execute();
        }
        
        var queueOpenNetworkLinks = function(queue, topNode){
            var links = topNode.find('li.KmlNetworkLink.open');
            links.each(function(){
                var n = $(this);
                // no need to open if checkHideChildren is set
                if(!n.hasClass('checkHideChildren') && !n.hasClass('loading') 
                    && !n.hasClass('loaded')){
                    n.removeClass('open');
                    queue.add(n, function(loadedNode){
                        loadedNode.addClass('open');
                        setModified(loadedNode, 'open', 
                            n.hasClass('open'));
                        queueOpenNetworkLinks(queue, loadedNode);
                    });                    
                }
            });
            queue.execute();
        };
                
        var customIcon = function(kmlObject){
            var result = false;
            
            if(supportsBgSize && kmlObject.getType() === 'KmlPlacemark' && 
                kmlObject.getGeometry() && 
                kmlObject.getGeometry().getType() === 'KmlPoint'){
                result = kmlObject.getComputedStyle().getIconStyle()
                    .getIcon().getHref();
            }
            if(!opts.supportItemIcon){
                return result;
            }
            var doc = kmldom(kmlObject.getKml());
            var root = doc.find('kml>Folder, kml>Document, kml>Placemark, ' + 
                'kml>NetworkLink');
            var href = root.find('>Style>ListStyle>ItemIcon>href').text();
            if(href){
                return href;
            }else{
                return false;
            }
        }
        
        // See http://code.google.com/apis/kml/documentation/kmlreference.html#listItemType
        var getListItemType = function(style){
            var listItemType = 'check';
            var lstyle = style.getListStyle();
            if(lstyle){
                var ltype = lstyle.getListItemType();
                switch(ltype){
                    case 0:
                        // 'check'
                        break;
                    case 5:
                        listItemType = 'radioFolder';
                        break;
                    case 2:
                        listItemType = 'checkOffOnly';
                        break;
                    case 3:
                        listItemType = 'checkHideChildren';
                        break;
                }
            }
            return listItemType;
        };
        
        var renderOptions = function(options){
            if(jQuery.isArray(options)){
                var strings = [];
                for(var i=0;i<options.length;i++){
                    strings.push(_render(options[i]));
                }
                return strings.join('');
            }else{
                var string = _render(options);
                return string;
            }
        };
                
        var defaults = {
            renderOptions: renderOptions
        };

        var _render = function(options){
            var s = template(jQuery.extend({}, defaults, options));
            return s;
        };
        
        var clearLookups = function(){
            // try to clear some memory
            lookupTable = null;
            lookupTable = {};
        };
        
        // Deletes references to networklink kmlObjects, removes them from the
        // dom. Prepares for refresh or tree destruction.
        var clearNetworkLinks = function(){
            $('.KmlNetworkLink').each(function(){
                var kmlObject = lookup($(this));
                if(kmlObject && kmlObject.getParentNode()){
                    opts.gex.dom.removeObject(lookup($(this)));
                }
            });
        };
        
        var clearKmlObjects = function(){
            clearNetworkLinks();
            if(that.kmlObject && that.kmlObject.getParentNode()){
                opts.gex.dom.removeObject(that.kmlObject);
                // that.kmlObject.release();
            }
            that.kmlObject = null;
        };
        
        var getStateFromLocalStorage = function(){
            var json = localStorage.getItem(
                'kmltree-('+opts.url+')');
            if(json){
                return JSON.parse(json);
            }else{
                return false;
            }
        };
        
        var setStateInLocalStorage = function(){
            var state = JSON.stringify(getState());
            localStorage.setItem('kmltree-('+opts.url+')', state);
        };
        
        
        var destroy = function(){
            destroyed = true;
            if(opts.restoreState && !!window.localStorage){
                setStateInLocalStorage();
            }
            clearKmlObjects();
            clearLookups();
            var id = opts.element.attr('id');
            $('#'+id+' li > span.name').die();
            $('#'+id+' li').die();
            $('#'+id+' li > .expander').die();
            opts.element.html('');
            google.earth.removeEventListener(
                ge, 'balloonopening', balloonOpening);
            google.earth.removeEventListener(
                ge, 'balloonclose', balloonClose);
            $('#kmltree-balloon-iframe').remove();
        };
        
        that.destroy = destroy;
        
        var lookup = function(li){
            var li = $(li);
            if(li.length){
                return lookupTable[li.attr('id')];
            }else{
                return false;
            }
        };
        
        that.lookup = lookup;
        
        var addLookup = function(kmlObject, parentID, docUrl, name){
            var id = getID(kmlObject, parentID, docUrl, name);
            // if the ID exists already, just append the position of the 
            // repeated name to the id.
            var tries = 0;
            while(!!lookupTable[id]){
                tries++;
                id = id + tries;
            }
            lookupTable[id] = kmlObject;
            return id;
        };
        
        // Returns an ID that is used on the DOM element representing this 
        // kmlObject. If the kmlObject has it's own ID, the generated ID will
        // be created from that ID + the kml document's url. If not, the name
        // of the element and the name of it's parents will be used to 
        // generate an ID.
        // 
        // Arguments: kmlObject, parentID
        var getID = function(kmlObject, parentID, docUrl, name, ignoreID){
            if(name){
                key = name.replace(/\W/g, '-');
            }else{
                key = "blank"
            }
            return parentID + key;
        };

        var setLookup = function(node, kmlObject){
            lookupTable[node.attr('id')] = kmlObject;
        };
                
        var selectNode = function(node, kmlObject){
            if(!kmlObject){
                kmlObject = lookup(node);
            }
            node = $(node);
            clearSelection(true, true);
            node.addClass('selected');
            toggleVisibility(node, true);
            node.addClass('selected');
            google.earth.removeEventListener(
                ge, 'balloonopening', balloonOpening);
            openBalloon(kmlObject, ge, opts, that);
            google.earth.addEventListener(
                ge, 'balloonopening', balloonOpening);
            
            
            var parent = node.parent().parent();
            
            while(!parent.hasClass('kmltree') 
                && !parent.find('>ul:visible').length){
                parent.addClass('open');
                var parent = parent.parent().parent();
            }
            
            setModified(node, 'selected', true);
            $(that).trigger('select', [node, kmlObject]);
        };
        
        that.selectNode = selectNode;
        
        var toggleDown = function(node, toggling){
            if(toggling){
                if(node.hasClass('checkOffOnly')){
                    return;
                }else{
                    if(node.hasClass('radioFolder')){
                        if(node.find('>ul>li.visible').length){
                            // one node already turned on, do nothing
                            return;
                        }else{
                            var children = node.find('>ul>li');
                            if(children.length){
                                toggleItem($(children[0]), true);
                                toggleDown($(children[0]), true);
                            }else{
                                return;
                            }
                        }
                    }else{
                        node.find('>ul>li').each(function(){
                            var n = $(this);
                            if(!n.hasClass('checkOffOnly')){
                                toggleItem(n, true);
                                toggleDown(n, true);
                            }
                        });
                    }
                }
            }else{
                node.find('li').each(function(){
                    toggleItem($(this), false);
                });
            }
        };
        
        var toggleUp = function(node, toggling, from){
            var parent = node.parent().parent();
            if(!parent.hasClass('kmltree')){
                if(toggling){
                    var herParent = parent.parent().parent();
                    if(herParent.hasClass('radioFolder')){
                        // toggle off any siblings and toggle them down
                        herParent.find('>ul>li.visible').each(function(){
                            if(this !== parent[0]){
                                var sib = $(this);
                                toggleItem(sib, false);
                                toggleDown(sib, false);                               
                            }else{
                            }
                        });
                    }
                    if(!parent.hasClass('visible')){
                        toggleItem(parent, true);
                        toggleUp(parent, true);                        
                    }
                }else{
                    if(parent.find('>ul>li.visible').length === 0){
                        toggleItem(parent, false);
                        toggleUp(parent, false);
                    }
                }
            }
        };
        
        var toggleVisibility = function(node, toggle){
            if(node.hasClass('checkOffOnly') && toggle){
                return;
            }
            var parent = node.parent().parent();
            if(parent.hasClass('radioFolder')){
                parent.find('>ul>li.visible').each(function(){
                    toggleItem($(this), false);
                    toggleDown($(this), false);
                });
            }
            toggleItem(node, toggle);
            if(toggle && node.find('li.visible').length){
                // if children are already toggled, do nothing
            }else{
                toggleDown(node, toggle);                
            }
            toggleUp(node, toggle);
        };
        
        var toggleItem = function(node, toggling){
            var node = $(node);
            if(node.hasClass('visible') === toggling){
                return;
            }
            setModified(node, 'visible', toggling);
            lookup(node).setVisibility(toggling);
            node.toggleClass('visible', toggling);            
        };
        
        var setModified = function(node, key, value){
            var id = node.attr('id');
            if(!internalState[id]){
                internalState[id] = {};
            }
            var record = internalState[id];
            if(!record[key]){
                record[key] = {original: !value, value: value}
            }else{
                record[key]['value'] = value;
            }
        };
        
        var getState = function(){
            for(var id in internalState){
                for(var key in internalState[id]){
                    if(internalState[id][key]['original'] === 
                        internalState[id][key]['value']){
                        delete internalState[id][key];
                    }
                }
                var len = 0;
                for(var key in internalState[id]){
                    if(internalState[id].hasOwnProperty(key)){
                        len++;
                    }
                }
                if(len === 0){
                    delete internalState[id];
                }
            }
            return internalState;
        };
        
        that.getState = getState;
        
        var getDocId = function(kmlObject){
            for(var key in docs){
                if(docs[key] === kmlObject){
                    return key;
                }
            }
            throw('could not getDocId');
        }
        
        var openNetworkLink = function(node){
            if(node.find('> ul').length){
                throw('networklink already loaded');
            }else{
                var NetworkLink = lookup(node);
                var link = NetworkLink.getLink();
                if(link){
                    link = link.getHref();
                    var original_url = link;
                }else{
                    var dom = kmldom(NetworkLink.getKml());
                    var href = dom.find('Url>href');
                    if(href.length){
                        var link = href.text();
                        var original_url = link;
                    }else{
                        node.addClass('error');
                        // setModified(node, 'visibility', false);
                        $(node).trigger('loaded', [node, false]);
                        node.removeClass('open');
                        setModified(node, 'open', false);
                        return;                        
                    }
                }
                var uri = new URI(link);
                if(uri.getAuthority() === null){
                    var doc = NetworkLink.getOwnerDocument();
                    if(doc && doc.getUrl){
                        var base = doc.getUrl();
                        if(base){
                            var base = new URI(base);
                            var new_url = uri.resolve(base);
                        }
                    }
                    if(!new_url){
                        alert(['Could not resolve relative link in kml ',
                                'document. You may need to upgrade to the ',
                                'latest Google Earth Plugin.'].join());
                    }else{
                        link = new_url.toString();
                    }
                }
                if(opts.bustCache){
                    var buster = (new Date()).getTime();
                    if(link.indexOf('?') === -1){
                        link = link + '?cachebuster=' + buster;
                    }else{
                        link = link + '&cachebuster=' + buster;
                    }
                }
                node.addClass('loading');
                google.earth.fetchKml(ge, link, function(kmlObject){
                    if(!kmlObject){
                        alert('Error loading ' + link);
                        node.addClass('error');
                        // setModified(node, 'visibility', false);
                        $(that).trigger('kmlLoadError', [kmlObject]);
                        node.removeClass('open');
                        return;
                    }
                    ge.getFeatures().appendChild(kmlObject);
                    kmlObject.setVisibility(NetworkLink.getVisibility());
                    var extra_scope = NetworkLink.getName();
                    var parent = NetworkLink.getParentNode();
                    parent.getFeatures().removeChild(NetworkLink);
                    var data = buildOptions(kmlObject, original_url, 
                        extra_scope);
                    var html = renderOptions(data.children[0].children);
                    node.append('<ul>'+html+'</ul>');
                    node.addClass('open');
                    setModified(node, 'open', node.hasClass('open'));
                    node.removeClass('loading');
                    node.addClass('loaded');
                    setLookup(node, kmlObject);
                    rememberNetworkLink(node, NetworkLink);
                    $(node).trigger('loaded', [node, kmlObject]);
                    $(that).trigger('networklinkload', [node, kmlObject]);
                });
            }
        };
        
        that.openNetworkLink = openNetworkLink;
        
        var rememberedLinks = [];
        
        var rememberNetworkLink = function(node, networkLink){
            $(node).attr(
                'data-rememberedLink', rememberedLinks.length.toString());
            rememberedLinks.push(networkLink);
        };
        
        var getNetworkLink = function(node){
            var id = $(node).attr('data-rememberedLink');
            if(id && rememberedLinks.length >= id){
                return rememberedLinks[id];
            }else{
                return false;
            }
        };
        
        that.getNetworkLink = getNetworkLink;
        
        // Creates a new NetworkLinkQueue that simply opens up the given 
        // NetworkLink and any open NetworkLinks within it.
        var openNetworkLinkRecursive = function(node){
            var queue = new NetworkLinkQueue({
                success: function(links){
                },
                error: function(links){
                },
                tree: that
            });
            queue.add(node, function(loadedNode){
                loadedNode.addClass('open');
                setModified(loadedNode, 'open', 
                    node.hasClass('open'));
                queueOpenNetworkLinks(queue, loadedNode);
            });
            queue.execute();
        }
        
        var id = opts.element.attr('id');
        
        $('#'+id+' li > span.name').live('click', function(e){
            e.stopPropagation();
            var node = $(this).parent();
            var kmlObject = lookup(node);
            if(node.hasClass('error') && node.hasClass('KmlNetworkLink')){
                if(kmlObject.getLink() && kmlObject.getLink().getHref()){
                    alert('Could not load NetworkLink with url ' + 
                        kmlObject.getLink().getHref())
                }else{
                    alert('Could not load NetworkLink. Link tag with href not found');
                }
            }
            if(node.hasClass('select')){
                selectNode(node, kmlObject);
            }else{
                clearSelection();
                if(node.hasClass('hasDescription') || kmlObject.getType() === 
                    'KmlPlacemark'){
                    if(kmlObject.getType() === 'KmlPlacemark'){
                        toggleVisibility(node, true);
                    }
                    google.earth.removeEventListener(
                        ge, 'balloonopening', balloonOpening);
                    openBalloon(kmlObject, ge, opts, that);
                    google.earth.addEventListener(
                        ge, 'balloonopening', balloonOpening);
                }
            }
            $(that).trigger('click', [node[0], kmlObject]);
        });

        $('#'+id+' li > span.name').live('contextmenu', function(){            
            var parent = $(this).parent();
            var kmlObject = lookup(parent);
            $(that).trigger('contextmenu', [parent[0], kmlObject]);
        });
        
        // Events to handle clearing selection
                
        opts.element.click(function(e){
            if(e.target === this){
                clearSelection();
            }else{
                var el = $(e.target);
                if(el.hasClass('toggle') && !el.hasClass('select')){
                    clearSelection();
                }
            }
        });
        
        // expand events
        $('#'+id+' li > .expander').live('click', function(e){
            var el = $(this).parent();
            if(el.hasClass('KmlNetworkLink') && !el.hasClass('loaded') 
                && !el.hasClass('loading')){
                openNetworkLinkRecursive(el);
            }else{
                el.toggleClass('open');
                setModified(el, 'open', el.hasClass('open'));
            }
        });
        
        $('#'+id+' li > .toggler').live('click', function(){
            var node = $(this).parent();
            var toggle = !node.hasClass('visible');
            if(!toggle && node.hasClass('selected')){
                clearSelection();
            }
            if(!toggle && ge.getBalloon()){
                ge.setBalloon(null);
            }
            if(node.hasClass('checkOffOnly') && toggle){
                // do nothing. Should not be able to toggle-on from this node.
                return;
            }else{
                if(node.hasClass('KmlNetworkLink') 
                    && node.hasClass('alwaysRenderNodes') 
                    && !node.hasClass('open') 
                    && !node.hasClass('loading') 
                    && !node.hasClass('loaded')){
                    openNetworkLinkRecursive(node);
                    $(node).bind('loaded', function(e, node, kmlObject){
                        toggleVisibility(node, true);
                        node.removeClass('open');
                    });
                }else{
                    toggleVisibility(node, toggle);                    
                }
                $(that).trigger('toggleItem', [node, toggle, lookup(node)]);
            }
        });
        
        $('#'+id+' li').live('dblclick', function(e){
            e.stopPropagation();
            var target = $(e.target);
            var parent = target.parent();
            if(target.hasClass('expander')
                || target.hasClass('toggler') 
                || parent.hasClass('expander') 
                || parent.hasClass('toggler')){
                // dblclicking the expander icon or checkbox should not zoom
                return;
            }
            var node = $(this);
            var kmlObject = lookup(node);
            if(node.hasClass('error')){
                if(kmlObject.getLink() && kmlObject.getLink().getHref()){
                    alert('Could not load NetworkLink with url ' + 
                        kmlObject.getLink().getHref())
                }else{
                    alert('Could not load NetworkLink. Link tag with href not found');
                }                
                return;
            }
            toggleVisibility(node, true);
            if(kmlObject.getType() == 'KmlTour'){
                ge.getTourPlayer().setTour(kmlObject);
            }else{
                var aspectRatio = null;
                var m = $(opts.mapElement);
                if(m.length){
                    var aspectRatio = m.width() / m.height();
                }
                opts.gex.util.flyToObject(kmlObject, {
                    boundsFallback: parent.find('li').length < 1000,
                    aspectRatio: aspectRatio
                });
            }
            $(that).trigger('dblclick', [node, kmlObject]);            
        });
        
        // Google Earth Plugin Events
        var geAddListener = google.earth.addEventListener;
        
        
        var balloonOpening = function(e){
            e.preventDefault();
            ge.setBalloon(null);
            openBalloon(e.getFeature(), ge, opts, that);
            return false;
        }
        
        google.earth.addEventListener(ge, 'balloonopening', balloonOpening);
        
        var balloonClose = function(e){
            $('#kmltree-balloon-iframe').remove();
            clearSelection();            
        }
        
        geAddListener(ge, 'balloonclose', balloonClose);
        
        var doubleClicking = false;
        
        geAddListener(ge.getGlobe(), 'dblclick', function(e, d){
            if(e.getButton() === -1){
                // related to scrolling, ignore
                return;
            }
            var target = e.getTarget();
            if(target.getType() === 'GEGlobe'){
                // do nothing
            }else if(target.getType() === 'KmlPlacemark'){
                var id = target.getId();
                var nodes = getNodesById(id);
                if(nodes.length >= 1){
                    // e.preventDefault();
                    if(!doubleClicking){
                        doubleClicking = true;
                        setTimeout(function(){
                            doubleClicking = false;
                            var n = $(nodes[0]);
                            $(that).trigger('dblclick', [n, target]);
                        }, 200);
                    }
                }else{
                    // do nothin
                }
            }
        });

        // fix for jquery 1.4.2 compatibility. See http://forum.jquery.com/topic/javascript-error-when-unbinding-a-custom-event-using-jquery-1-4-2
        that.removeEventListener = that.detachEvent = function(){};
        return that;
    };
})();