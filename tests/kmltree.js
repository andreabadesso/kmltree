
module('kmlTree');

(function(){
    
    // from http://stackoverflow.com/questions/901115/get-querystring-with-jquery
    function getParameterByName( name, href )
    {
        href = href || window.location.href;
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( href );
        if( results == null ){
            return "";        
        }else{
            return results[1];        
        }
    }
    
    // given the name of a file within examples/kml, creates an absolute url
    // to it, appending ?r=revision if necessary
    function example(filename){
        var url = '../examples/kml/' + filename;
        // var url = 'http://kmltree.googlecode.com/hg/examples/kml/' + filename;
        var r = getParameterByName('r');
        if(r !== ''){
            url = url + '?r=' + r;
        }
        return url;
    }
    
    
    earthTest('create instance', 2, function(ge, gex){    
        $(document.body).append('<div class="kmltreetest"></div>');
        var errors = false;
        try{
            var tree = kmltree({
                gex: gex, 
                map_div: $('#map3d'), 
                element: $('.kmltreetest'),
                bustCache: false
            });
        }catch(e){
            errors = true;
        }
        ok(errors);

        var tree = kmltree({
            url: example('hello.kml'),
            gex: gex, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        ok(tree !== false, 'Tree initialized');
        tree.destroy();
        $('.kmltreetest').remove();
    });

    earthAsyncTest('load kml, fire kmlLoaded event. <a href="../examples/kmlLoaded.html">example</a>', 2, function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('hello.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: true
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load();
    });

    earthAsyncTest('click events <a href="../examples/clickEvents.html">example</a>', 4, function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('clickEvents.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(Click Me)')
                .click();
        });
        $(tree).bind('click', function(e, node, kmlObject){
            equals(kmlObject.getName(), 'Click Me');
            equals(e.target, tree);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('events arent confused across multiple instances', 9, function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        $(document.body).append('<div class="kmltreetest2"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        var tree2 = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest2'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            tree2.load(true);
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            equals(e.target, tree);
            $('.kmltreetest').find('span.name:contains(Placemark without description)')
                .click();
        });
        $(tree).bind('click', function(e, node, kmlObject){
            equals(kmlObject.getName(), 'Placemark without description');
            equals(e.target, tree);
        });
        $(tree2).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            equals(e.target, tree2);
            $('.kmltreetest2').find('span.name:contains(Placemark without description)')
                .click();
        });
        $(tree2).bind('click', function(e, node, kmlObject){
            equals(kmlObject.getName(), 'Placemark without description');
            equals(e.target, tree2);
            tree.destroy();
            tree2.destroy();
            $('.kmltreetest').remove();
            $('.kmltreetest2').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('dblclick events', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(Placemark without description)')
                .dblclick();
        });
        $(tree).bind('dblclick', function(e, node, kmlObject){
            equals(kmlObject.getName(), 'Placemark without description');
            equals(e.target, tree);
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('setExtent option', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false,
            setExtent: true
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            setTimeout(function(){
                var secondLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
                ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
                ok(secondLat !== firstLat);
                $('.kmltreetest').remove();
                tree.destroy();
                start();
            }, 500);
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('contextmenu events', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(Placemark without description)')
                .trigger('contextmenu');
        });
        $(tree).bind('contextmenu', function(e, node, kmlObject){
            equals(kmlObject.getName(), 'Placemark without description');
            equals(e.target, tree);
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('getNodesById', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(Placemark with ID)').parent();
            equals(node.length, 1);
            var nodes = tree.getNodesById('myId');
            equals(nodes.length, 1);
            equals(nodes[0], node[0]);
            equals(tree.getNodesById('non-existent').length, 0);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    // earthAsyncTest('optional title support', function(ge, gex){
    //     $(document.body).append('<div class="kmltreetest"></div>');
    //     var tree = kmltree({
    //         url: example('kmlForestTest.kml'),
    //         ge: ge, 
    //         gex: gex, 
    //         animate: false, 
    //         map_div: $('#map3d'), 
    //         element: $('.kmltreetest'),
    //         title: true,
    //         bustCache: false
    //     });
    //     $(tree).bind('kmlLoaded', function(e, kmlObject){
    //         ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
    //         var title = $('.kmltreetest').find('h4:contains(kmlForestTest.kml)');
    //         equals(title.length, 1);
    //         ok(title.hasClass('marinemap-kmltree-title'))
    //         tree.destroy();
    //         $('.kmltreetest').remove();
    //         start();
    //     });
    //     ok(tree !== false, 'Tree initialized');
    //     tree.load(true);
    // });

    earthAsyncTest('supports kml <a href="http://code.google.com/apis/kml/documentation/kmlreference.html#open">open tag</a>', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var closed = $('.kmltreetest').find('span.name:contains(closed folder)');
            equals(closed.length, 1);
            ok(!closed.parent().hasClass('open'));
            var open = $('.kmltreetest').find('span.name:contains(Radio Folder)');
            equals(open.length, 1);
            ok(open.parent().hasClass('open'));
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('supports <a href="http://code.google.com/apis/kml/documentation/kmlreference.html#visibility">visibility tag</a>', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var nodes = tree.getNodesById('myId');
            var kmlObject = tree.lookup(nodes);
            equals(kmlObject.getName(), 'Placemark with ID');
            ok(nodes.hasClass('visible'));
            equals(kmlObject.getVisibility(), 1);
            var node = $('.kmltreetest').find('span.name:contains(Visibility set to false)').parent();
            equals(node.length, 1);
            ok(!node.hasClass('visible'));
            var kmlObject = tree.lookup(node);
            equals(kmlObject.getName(), 'Visibility set to false');
            equals(kmlObject.getVisibility(), 0);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('supports <a href="http://code.google.com/apis/kml/documentation/kmlreference.html#snippet">snippet tag</a>', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(PhotoOverlay of South Coast Study Region)').parent();
            equals(node.length, 1);
            equals(node.find('> .snippet').length, 1);
            var node = $('.kmltreetest').find('span.name:contains(Visibility set to false)').parent();
            equals(node.length, 1);
            equals(node.find('> .snippet').length, 0);        
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('features with descriptions appear as a link', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(Placemark without description)').parent();
            ok(!node.hasClass('hasDescription'));
            var node = $('.kmltreetest').find('span.name:contains(Placemark with description)').parent();
            ok(node.hasClass('hasDescription'));
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest("open folder contents visible, closed folders' content not", function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(closed folder)').parent();
            equals(node.find('> ul:visible').length, 0);
            var node = $('.kmltreetest').find('span.name:contains(Radio Folder)').parent();
            equals(node.find('> ul:visible').length, 1);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('folders expand/collapse', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(closed folder)').parent();
            equals(node.length, 1);
            node.find('> .expander').click();
            equals(node.find('>ul:visible').length, 1);
            node.find('> .expander').click();
            equals(node.find('>ul:visible').length, 0);
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('can toggle features', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(PhotoOverlay of South Coast Study Region)').parent();
            var kmlObject = tree.lookup(node);
            equals(node.length, 1);
            ok(!kmlObject.getVisibility());
            node.find('> .toggler').click();
            ok(kmlObject.getVisibility());
            ok(kmlObject.getVisibility());
            node.find('> .toggler').click();
            ok(!kmlObject.getVisibility());
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('toggling folders toggles children', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(Both visible)').parent();
            var kmlObject = tree.lookup(node);
            equals(node.length, 1);
            // All items on to start
            ok(node.find('> ul > li.visible').length > 0);
            ok(kmlObject.getVisibility());
            // turn them off
            node.find('> .toggler').click();
            equals(node.find('> ul > li.visible').length, 0);
            ok(!kmlObject.getVisibility());
            var child = node.find('> ul > li')[0];
            var childKml = tree.lookup(child);
            ok(childKml);
            ok(!childKml.getVisibility());
            // turn back on
            node.find('> .toggler').click();
            ok(kmlObject.getVisibility());
            ok(childKml.getVisibility());
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('toggling child toggles all parents', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(level 4)').parent();
            equals(node.length, 1);
            // All items off to start
            ok(!node.hasClass('visible'));
            // turn on
            node.find('> .toggler').click();
            var kmlObject = tree.lookup(node);
            ok(kmlObject);
            ok(kmlObject.getVisibility());
            var level1 = $('.kmltreetest').find('span.name:contains(level 1)').parent();
            ok(level1.hasClass('visible'));
            ok(tree.lookup(level1).getVisibility());
            var level2sib = $('.kmltreetest').find('span.name:contains(level 2 sibling)').parent();
            ok(!level2sib.hasClass('visible'));
            ok(!tree.lookup(level2sib).getVisibility());
            $('.kmltreetest').remove();
            tree.destroy();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('toggling all children off toggles parents off', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        $('.kmltreetest').remove();
        start();
    });

    // // Tests for when a semi-toggled state for folders is implemented
    // 
    // earthAsyncTest('toggling child with no siblings toggles folder', function(ge, gex){
    //     $(document.body).append('<div class="kmltreetest"></div>');
    //     $('.kmltreetest').remove();
    //     start();
    // });
    // 
    // earthAsyncTest('toggling one of many children semi-toggles folder', function(ge, gex){
    //     $(document.body).append('<div class="kmltreetest"></div>');
    //     $('.kmltreetest').remove();
    //     start();
    // });
    // 
    // earthAsyncTest('semi-toggling travels up deeply nested trees', function(ge, gex){
    //     $(document.body).append('<div class="kmltreetest"></div>');
    //     $('.kmltreetest').remove();
    //     start();
    // });

    earthAsyncTest('list items given class names matching kmlObject.getType()', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            ok($('.kmltreetest').find('li.KmlPlacemark').length > 0);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('radioFolder support', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(One at a time)').parent();
            var a = node.find('span.name:contains(Radio A)').parent();
            var b = node.find('span.name:contains(Radio B)').parent();
            ok(node.length === 1);
            ok(a.length === 1);
            ok(b.length === 1);
            ok(node.hasClass('radioFolder'));
            var kmlObject = tree.lookup(node);
            // start out not visible
            ok(!kmlObject.getVisibility());
            node.find('> .toggler').click();
            ok(kmlObject.getVisibility());
            ok(tree.lookup(a).getVisibility());
            ok(a.hasClass('visible'));
            ok(!tree.lookup(b).getVisibility());
            ok(!b.hasClass('visible'));
            b.find('> .toggler').click();
            ok(!tree.lookup(a).getVisibility());
            ok(tree.lookup(b).getVisibility());
            b.find('> .toggler').click();
            ok(!tree.lookup(a).getVisibility());
            ok(!tree.lookup(b).getVisibility())
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest("toggling parent of radio folder doesn't toggle all radioFolder children.", function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(One at a time)').parent();
            var a = node.find('span.name:contains(Radio A)').parent();
            var b = node.find('span.name:contains(Radio B)').parent();
            ok(node.length === 1);
            ok(a.length === 1);
            ok(b.length === 1);
            ok(node.hasClass('radioFolder'));
            var parent = node.parent().parent();
            parent.find('> .toggler').click();
            parent.find('> .toggler').click();
            parent.find('> .toggler').click();        
            ok(!tree.lookup(parent).getVisibility(), 
                'Startout with parent and children cleared');
            ok(!tree.lookup(a).getVisibility(), 
                'Startout with parent and children cleared');
            ok(!tree.lookup(b).getVisibility(), 
                'Startout with parent and children cleared');
            parent.find('> .toggler').click();        
            ok(tree.lookup(a).getVisibility(), 'Should turn on the first child.');
            ok(!tree.lookup(b).getVisibility(), 
                'Only one child of a radioFolder should be turned on at a time.');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('<a href="http://code.google.com/apis/kml/documentation/kmlreference.html#liststyle">ListStyle</a> support: checkOffOnly', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var parent = $('.kmltreetest').find('span.name:contains(check off only)').parent();
            var a = parent.find('span.name:contains(a)').parent();
            var b = parent.find('span.name:contains(b)').parent();
            ok(tree.lookup(parent).getVisibility());
            ok(tree.lookup(a).getVisibility());
            ok(tree.lookup(b).getVisibility());
            parent.find('> .toggler').click();
            ok(!tree.lookup(parent).getVisibility(), 
                'Parent visibility off after click.');
            ok(!tree.lookup(a).getVisibility(), 
                'Both children should be turned off by click on parent.');
            ok(!tree.lookup(b).getVisibility(),
                'Both children should be turned off by click on parent.');

            parent.find('> .toggler').click();
            ok(!tree.lookup(parent).getVisibility() &&
                !tree.lookup(a).getVisibility() && 
                !tree.lookup(b).getVisibility(),
                'Should not be able to toggle visibility with listItemType = checkOffOnly.');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('<a href="http://code.google.com/apis/kml/documentation/kmlreference.html#liststyle">ListStyle</a> support: checkHideChildren', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var folder = $('.kmltreetest').find('span.name:contains(folder with contents hidden)').parent();
            ok(folder.find('> .toggler:visible').length === 0, 'Toggle icon should not be visible');
            ok(folder.find('> ul > li').length === 0, 'Shouldnt add children');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('ItemIcon if option specified', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('earthLayers.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false,
            supportItemIcon: true
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');            
            var grid = $('.kmltreetest').find('span.name:contains(Grid)').parent();
            var icon = grid.find('>.icon').css('background-image');
            ok(icon.indexOf('http://marinemap.googlecode.com/svn/trunk/media/common/images/silk/sport_golf.png') !== -1);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('click on elements with descriptions opens balloon.', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            ok(!ge.getBalloon(), 'start out with no balloon open.');
            var node = $('.kmltreetest').find('span.name:contains(Placemark with description)').parent();
            $('.kmltreetest').find('span.name:contains(Placemark with description)').click();
            ok(ge.getBalloon(), 'Balloon should now be open.');
            ok(tree.lookup(node).getVisibility(), 'Should be visible if viewing balloon.');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('Untoggling feature with balloon closes it.', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            ge.setBalloon(null);
            ok(!ge.getBalloon(), 'start out with no balloon open.');
            var node = $('.kmltreetest').find('span.name:contains(Placemark with description)').parent();
            $('.kmltreetest').find('span.name:contains(Placemark with description)').click();
            ok(ge.getBalloon(), 'Balloon should now be open.');
            ok(tree.lookup(node).getVisibility(), 'Should be visible if viewing balloon.');
            node.find('> .toggler').click();
            ok(!tree.lookup(node).getVisibility(), 'Feature should be invisible');
            ok(!ge.getBalloon(), 'Balloon should be closed.');
            ge.setBalloon(null);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('double click feature flys to feature', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(Visibility set to false)').parent();
            node.find('span.name').dblclick();
            ok(tree.lookup(node).getVisibility(), 'Feature should be visible.');
            setTimeout(function(){
                var secondLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
                ok(secondLat !== firstLat);
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            }, 400);
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('double click works on icons too', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(Placemark without description)').parent().find('.icon').dblclick();
            setTimeout(function(){
                var secondLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
                ok(secondLat !== firstLat);
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            }, 400);
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    // Not a very good test. If the double click event was instead causing the 
    // viewport to zoom to the camera like any other feature, the bug likely
    // wouldn't be detected. Should really be a ge.getTourPlayer().getTour() api.
    // A feature request has been submitted for that function
    // http://code.google.com/p/earth-api-samples/issues/detail?id=309
    earthAsyncTest('tours are activated when double-clicked.', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).bind('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var node = $('.kmltreetest').find('span.name:contains(Tour Example)').parent();
            ok(node.length, "Tour exists");
            var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
            node.dblclick();
            ge.getTourPlayer().play();
            var secondLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
            ok(firstLat != secondLat, "Assuming the latitude changes after double-clicking the tour, it must be active.");
            ge.getTourPlayer().pause();
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('refresh reloads kml tree', 3, function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            tree.refresh();
            $(tree).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('selectNode', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            $(tree).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('selectById', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        $('.kmltreetest').remove();
        start();
    });

    earthAsyncTest('Contents of NetworkLinks can be displayed. Depends on <a href="http://code.google.com/p/earth-api-samples/issues/detail?id=260&q=NetworkLink&colspec=ID%20Type%20Summary%20Component%20OpSys%20Browser%20Status%20Stars#c3">this ticket</a>, or a hack', function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var nlink = $('.kmltreetest').find('span.name:contains(networklink a)').parent();
            var nlinkobject = tree.lookup(nlink);
            $(tree).bind('networklinkload', function(e, node, kmlObject){
                equals(kmlObject.getName(), 'linka.kmz');
                equals($('.kmltreetest').find('span.name:contains(NetworkLink Content)').length, 1, 'NetworkLink contents displayed.');
                equals(nlinkobject.getVisibility(), kmlObject.getVisibility());
                var pmark = $('.kmltreetest').find('li:contains(NetworkLink Content) span.name:contains(Untitled Placemark)');
                equals(pmark.length, 1);
                // toggling-off networklink toggles off linked document
                nlink.find('.toggler').click();
                equals(nlinkobject.getVisibility(), false, 'NetworkLink visibility off');
                equals(nlinkobject.getVisibility(), kmlObject.getVisibility(), 'Parent document visibility tracks NetworkLink visibility.');
                // Events still work (testing double-click on tree node)
                pmark.dblclick();
                setTimeout(function(){
                    var secondLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
                    ok(secondLat !== firstLat, 'Events on tree nodes should still function.');
                    tree.destroy();
                    $('.kmltreetest').remove();
                    start();                    
                }, 400);
            });
            nlink.find('>.expander').click();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest("NetworkLinks with listItemType=checkHideChildren don't expand", function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('kmlForestTest.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlDocument', 'KmlDocument loaded correctly');
            var nlink = $('.kmltreetest').find('span.name:contains(networklink checkHideChildren)').parent();
            equals(nlink.find('>.expander:visible').length, 0);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest("NetworkLinks with open=1 should automatically be loaded and expanded", function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('openNL.kmz'),
            ge: ge,
            gex: gex,
            animate: false,
            map_div: $('#map3d'),
            element: $('.kmltreetest'),
            bustCache: false,
            restoreState: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'Kmz loaded correctly');
            var nlink = $('.kmltreetest').find('span.name:contains(open networklink)').parent();
            ok(nlink.hasClass('loaded'));
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest("NetworkLinks with open=1 but with a style of checkHideChildren should not be expanded", function(ge, gex){
        var firstLat = ge.getView().copyAsCamera(ge.ALTITUDE_ABSOLUTE).getLatitude();
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('openCheckHideChildrenNL.kml'),
            ge: ge,
            gex: gex,
            animate: false,
            map_div: $('#map3d'),
            element: $('.kmltreetest'),
            bustCache: false,
            restoreState: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'Kmz loaded correctly');
            var nlink = $('.kmltreetest').find('span.name:contains(nl)').parent();
            ok(!nlink.hasClass('loaded'), 'Not loaded');
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    // Depth-first traversal of all nodes in the tree
    // Will start out with all the children of the root KmlDocument, but
    // does not include the KmlDocument itself
    var walk = function(callback, context, node){
        var recurse_ = function(node, context){
            node.find('>ul>li').each(function(){
                var el = $(this);
                var newcontext = callback(el, context);
                if(newcontext === false){
                    // Don't follow into child nodes
                    return true;
                }else{
                    recurse_(el, newcontext);
                }
            });
        };
        // if(!node){
        //     node = opts.element.find('div.kmltree');
        // }
        recurse_(node, context);
    };
    
    earthAsyncTest("children ignored if callback returns false", function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'Document loaded correctly');
            var order = '';
            walk(function(node){
                var name = node.find('>span.name').text();
                order += name;
                if(name === 'B'){
                    return false;
                }
            }, {}, $('.kmltreetest').find('div.kmltree'));
            equals(order, 'FJBGIH');
            var order = '';
            walk(function(node){
                var name = node.find('>span.name').text();
                order += name;
                if(name === 'D'){
                    return false;
                }
            }, {}, $('.kmltreetest').find('div.kmltree'));
            equals('FJBADGIH', order);
            tree.destroy();
            $('.kmltreetest').remove();
            start();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('refresh tracks previous state', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(E)').parent().find('>.toggler').click();
            $(tree).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                var E = $('.kmltreetest').find('span.name:contains(E)').parent();
                ok(!E.hasClass('visible'), 'History remembered in tree widget');
                ok(!tree.lookup(E).getVisibility(), 'Visibility set on kmlObject');
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('more complex example', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(H)').parent().find('>.toggler').click();
            $('.kmltreetest').find('span.name:contains(G)').parent().find('>.expander').click();
            $('.kmltreetest').find('span.name:contains(A)').parent().find('>.toggler').click();
            $(tree).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                var A = $('.kmltreetest').find('span.name:contains(A)').parent();
                var H = $('.kmltreetest').find('span.name:contains(H)').parent();
                var G = $('.kmltreetest').find('span.name:contains(G)').parent();
                ok(!A.hasClass('visible'), 'History remembered in tree widget');
                ok(!tree.lookup(A).getVisibility(), 'Visibility set on kmlObject');
                ok(!H.hasClass('visible'), 'History remembered in tree widget');
                ok(!tree.lookup(H).getVisibility(), 'Visibility set on kmlObject');
                ok(!G.hasClass('visible'), 'History remembered in tree widget');
                ok(!G.hasClass('open'), 'History remembered in tree widget');
                ok(!tree.lookup(G).getVisibility(), 'Visibility set on kmlObject');
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('refreshing twice has the same affect', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(H)').parent().find('>.toggler').click();
            $('.kmltreetest').find('span.name:contains(G)').parent().find('>.expander').click();
            $('.kmltreetest').find('span.name:contains(A)').parent().find('>.toggler').click();
            $(tree).one('kmlLoaded', function(e, kmlObject){
                $(tree).one('kmlLoaded', function(e, kmlObject){
                    ok(true, 'kml refreshed');
                    var A = $('.kmltreetest').find('span.name:contains(A)').parent();
                    var H = $('.kmltreetest').find('span.name:contains(H)').parent();
                    var G = $('.kmltreetest').find('span.name:contains(G)').parent();
                    ok(!A.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(A).getVisibility(), 'Visibility set on kmlObject');
                    ok(!H.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(H).getVisibility(), 'Visibility set on kmlObject');
                    ok(!G.hasClass('visible'), 'History remembered in tree widget');
                    ok(!G.hasClass('open'), 'History remembered in tree widget');
                    ok(!tree.lookup(G).getVisibility(), 'Visibility set on kmlObject');
                    tree.destroy();
                    $('.kmltreetest').remove();
                    start();
                });
                tree.refresh();
            });
            tree.refresh();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('history with networklinks', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('NLHistory.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            var L = $('.kmltreetest').find('span.name:contains(L)').parent();
            L.find('>.expander').click();
            $(tree).one('networklinkload', function(){
                var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                X.find('>.toggler').click();
                ok(!X.hasClass('visible'));
                $(tree).one('kmlLoaded', function(e, kmlObject){
                    ok(true, 'kml refreshed');
                    var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                    var L = $('.kmltreetest').find('span.name:contains(L)').parent();
                    ok(L.hasClass('open'), 'Networklink open state remembered');
                    ok(!X.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(X).getVisibility(), 'Visibility set on kmlObject');
                    tree.destroy();
                    $('.kmltreetest').remove();
                    start();
                });
                tree.refresh();
            });
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('more complex history with networklinks', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('NLHistory.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            var L = $('.kmltreetest').find('span.name:contains(L)').parent();
            L.find('>.expander').click();
            $(tree).one('networklinkload', function(){
                var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                var Z = $('.kmltreetest').find('span.name:contains(Z)').parent();
                var Y = $('.kmltreetest').find('span.name:contains(Y)').parent();
                X.find('>.toggler').click();
                Y.find('>.toggler').click();
                Z.find('>.toggler').click();
                ok(!X.hasClass('visible'));
                ok(!Y.hasClass('visible'));
                ok(!Z.hasClass('visible'));
                $(tree).one('kmlLoaded', function(e, kmlObject){
                    ok(true, 'kml refreshed');
                    var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                    var Y = $('.kmltreetest').find('span.name:contains(Y)').parent();
                    var Z = $('.kmltreetest').find('span.name:contains(Z)').parent();
                    var L = $('.kmltreetest').find('span.name:contains(L)').parent();
                    ok(L.hasClass('open'), 'Networklink open state remembered');
                    ok(!L.hasClass('visible'), 'L should not be visible since children are not');
                    ok(!X.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(X).getVisibility(), 'Visibility set on kmlObject');
                    ok(!Y.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(Y).getVisibility(), 'Visibility set on kmlObject');
                    ok(!Z.hasClass('visible'), 'History remembered in tree widget');
                    ok(!tree.lookup(Z).getVisibility(), 'Visibility set on kmlObject');
                    tree.destroy();
                    $('.kmltreetest').remove();
                    start();
                });
                tree.refresh();
            });
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('history with nested networklinks', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('NLHistory.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            var L = $('.kmltreetest').find('span.name:contains(L)').parent();
            $(tree).one('networklinkload', function(){
                $(tree).one('networklinkload', function(){
                    var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                    var Z = $('.kmltreetest').find('span.name:contains(Z)').parent();
                    var B = $('.kmltreetest').find('span.name:contains(B)').parent();
                    X.find('>.toggler').click();
                    B.find('>.toggler').click();
                    Z.find('>.toggler').click();
                    ok(!X.hasClass('visible'));
                    ok(!B.hasClass('visible'));
                    ok(!Z.hasClass('visible'));
                    $(tree).one('kmlLoaded', function(e, kmlObject){
                        ok(true, 'kml refreshed');
                        var X = $('.kmltreetest').find('span.name:contains(X)').parent();
                        var Y = $('.kmltreetest').find('span.name:contains(Y)').parent();
                        var B = $('.kmltreetest').find('span.name:contains(B)').parent();
                        var Z = $('.kmltreetest').find('span.name:contains(Z)').parent();
                        var L = $('.kmltreetest').find('span.name:contains(L)').parent();
                        var A = $('.kmltreetest').find('span.name:contains(A)').parent();
                        ok(L.hasClass('open'), 'Networklink open state remembered');
                        ok(L.hasClass('visible'));
                        ok(!X.hasClass('visible'), 'History remembered in tree widget');
                        ok(!tree.lookup(X).getVisibility(), 'Visibility set on kmlObject');
                        ok(Y.hasClass('open'), 'History remembered in tree widget');
                        ok(!B.hasClass('visible'), 'History remembered in tree widget');
                        ok(!tree.lookup(B).getVisibility(), 'Visibility set on kmlObject');
                        ok(!Z.hasClass('visible'), 'History remembered in tree widget');
                        ok(!tree.lookup(Z).getVisibility(), 'Visibility set on kmlObject');
                        tree.destroy();
                        $('.kmltreetest').remove();
                        start();
                    });
                    tree.refresh();
                });
                var Y = $('.kmltreetest').find('span.name:contains(Y)').parent();
                Y.find('>.expander').click();
            });
            L.find('>.expander').click();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('refreshing with 2 networklinks at root', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('2NLAtRoot.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(E)').parent().find('>.toggler').click();
            var A = $('.kmltreetest').find('span.name:contains(A)').parent();
            var B = $('.kmltreetest').find('span.name:contains(B)').parent();
            $(tree).one('networklinkload', function(){
                $(tree).one('networklinkload', function(){
                    $(tree).one('kmlLoaded', function(e, kmlObject){
                        ok(true, 'kml refreshed');
                        var A = $('.kmltreetest').find('span.name:contains(A)').parent();
                        ok(A.hasClass('loaded'), 'History remembered in tree widget');
                        var B = $('.kmltreetest').find('span.name:contains(B)').parent();
                        ok(B.hasClass('loaded'), 'History remembered in tree widget');
                        tree.destroy();
                        $('.kmltreetest').remove();
                        start();
                    });
                    tree.refresh();
                });
                B.find('>.expander').click();
            });
            A.find('>.expander').click();
        });
        window.tree = tree;
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('refreshing with 2 networklinks at root - one has old-school Url tag', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('nlOldStyle.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false,
            restoreState: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            
            var working = $('.kmltreetest').find('span.name:contains(Working)').parent();
            var old = $('.kmltreetest').find('span.name:contains(old)').parent();
            ok(working.length);
            ok(old.length);
            ok(working.hasClass('open'));
            ok(!old.hasClass('open'));
            $(tree).one('kmlLoaded', function(e, kmlObject){
                var working = $('.kmltreetest').find('span.name:contains(Working)').parent();
                var old = $('.kmltreetest').find('span.name:contains(old)').parent();
                ok(!old.hasClass('open'));
                ok(working.hasClass('open'));
                ok(working.hasClass('loaded'));
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        window.tree = tree;
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });

    earthAsyncTest('supports open networklinks even when refreshing with state', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('nlOldStyle.kml'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            bustCache: false,
            restoreState: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            
            var working = $('.kmltreetest').find('span.name:contains(Working)').parent();
            var old = $('.kmltreetest').find('span.name:contains(old)').parent();
            ok(working.length);
            ok(old.length);
            ok(working.hasClass('open'));
            ok(!old.hasClass('open'));
            working.find('>.toggler').click().click();
            ok(working.find('>ul>li.visible').length > 1)
            $(tree).one('kmlLoaded', function(e, kmlObject){
                var working = $('.kmltreetest').find('span.name:contains(Working)').parent();
                var old = $('.kmltreetest').find('span.name:contains(old)').parent();
                ok(!old.hasClass('open'));
                ok(working.hasClass('open'));
                ok(working.hasClass('loaded'));
                ok(working.find('>ul>li.visible').length > 1)
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        window.tree = tree;
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('state tracking can be turned off', function(ge, gex){
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            refreshWithState: false,
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(E)').parent().find('>.toggler').click();
            $(tree).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                var E = $('.kmltreetest').find('span.name:contains(E)').parent();
                ok(E.hasClass('visible'));
                ok(tree.lookup(E).getVisibility());
                tree.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree.refresh();
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });
    
    earthAsyncTest('restore state using localStorage', function(ge, gex){
        if(!!window.localStorage){
            window.localStorage.clear();
        }
        $(document.body).append('<div class="kmltreetest"></div>');
        var tree = kmltree({
            url: example('TreeTraversal.kmz'),
            ge: ge, 
            gex: gex, 
            animate: false, 
            map_div: $('#map3d'), 
            element: $('.kmltreetest'),
            refreshWithState: false,
            restoreState: true,
            bustCache: false
        });
        $(tree).one('kmlLoaded', function(e, kmlObject){
            ok(kmlObject.getType() === 'KmlFolder', 'KmlDocument loaded correctly');
            $('.kmltreetest').find('span.name:contains(E)').parent().find('>.toggler').click();
            var E = $('.kmltreetest').find('span.name:contains(E)').parent();
            ok(!E.hasClass('visible'));
            tree.destroy();
            $('.kmltreetest').remove();
            $(document.body).append('<div class="kmltreetest"></div>');
            var tree2 = kmltree({
                url: example('TreeTraversal.kmz'),
                ge: ge, 
                gex: gex, 
                animate: false, 
                map_div: $('#map3d'), 
                element: $('.kmltreetest'),
                restoreStateOnRefresh: false,
                restoreState: true,
                bustCache: false
            });
            $(tree2).bind('kmlLoaded', function(e, kmlObject){
                ok(true, 'kml refreshed');
                var E = $('.kmltreetest').find('span.name:contains(E)').parent();
                ok(!E.hasClass('visible'));
                ok(!tree2.lookup(E).getVisibility());
                tree2.destroy();
                $('.kmltreetest').remove();
                start();
            });
            tree2.load(true);
        });
        ok(tree !== false, 'Tree initialized');
        tree.load(true);
    });    
    
})();