$(document).one('ready', function(){
    // Append stylesheets
    addLinks([
        'http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.css',
        'examples.css',
        '../dist/kmltree.css'
    ]);
    
    $.ajaxSetup({
      dataType: 'script'
    });
    $.when(
        $.ajax({url: 'http://geojs.googlecode.com/svn/trunk/dist/geo.pack.js'}),
        $.ajax({url: 'http://earth-api-utility-library.googlecode.com/svn/trunk/extensions/dist/extensions.pack.js'}),
        $.ajax({url: '../dist/kmltree.min.js'})        
    )
        .then(function(){
            var t = $('#sample').html();
            jQuery.globalEval(t);
            $(document).trigger('ready');            
            setTimeout(function(){
                resizeMap3d();
            }, 100);
            setTimeout(function(){
                if(tree){
                    $('a.src').attr('href', tree.url);
                }
            }, 2000);
        })
        .fail(function(){
            alert('error loading scripts');
        })
    $('.description').before($('<a class="src" href="#">source kml</a><h1><a href="http://code.google.com/p/kmltree/">kmltree</a> > <a href="http://code.google.com/p/kmltree/wiki/ExampleUses">examples</a> > <span class="breadcrumb-end"></span></h1><div id="tree"></div><div id="tree2"></div><div id="map3d"></div><br style="clear:both;">'));
    $('span.breadcrumb-end').text($('title').text());
    $('.content').append('<pre class="prettyprint" id="codeSample"></pre>');
    $('#codeSample').text($('#sample').html());
    jQuery.getScript('http://google-code-prettify.googlecode.com/svn/trunk/src/prettify.js', function(){
        prettyPrint();        
    });
    $(window).resize(function(){
        resizeMap3d();
    });
});

function resizeMap3d(){
    var cw = $('.content').width();
    var tw = $('#tree').width();
    var mw = $('#map3d').width();
    $('#map3d').width(cw - tw - 23);
}

function addLink(href){
    var link = $("<link/>").appendTo($("head"));
    link.attr({
    rel: "stylesheet",
    href: href
    });
}

function addLinks(hrefs){
    for(var i=0;i<hrefs.length;i++){
        addLink(hrefs[i]);
    }
}