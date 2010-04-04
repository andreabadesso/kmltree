openBalloon = function(kmlObject, plugin, whitelisted){
    kmlObject.setVisibility(true);
    var b = plugin.createHtmlStringBalloon('');
    b.setFeature(kmlObject); // optional
    b.setContentString(kmlObject.getDescription());
    plugin.setBalloon(b);   
}