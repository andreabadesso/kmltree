
// src/openBalloon.js

// For some reason GEAPI can't switch between features when opening new
// balloons accurately. Have to clear the old popup and add a timeout to
// make sure the balloon A is closed before balloon b is opened.
var openBalloon = function(kmlObject, plugin, whitelisted){
    var a = plugin.getBalloon();
    if(a){
        // there is already a balloon(a) open
        var f = a.getFeature();
        if(f !== kmlObject){
            // not trying to re-open the same balloon
            plugin.setBalloon(null);
            // try this function again in 50ms
            setTimeout(function(){
                openBalloon(kmlObject, plugin, whitelisted);
            }, 10);
            // setTimeout(openBalloon, 10, [kmlObject, plugin, whitelisted]);
        }
    }else{
        // if balloon A closed or never existed, create & open balloon B
        kmlObject.setVisibility(true);
        if(whitelisted && kmlObject.getDescription()){
            var b = plugin.createHtmlStringBalloon('');
            b.setFeature(kmlObject); // optional
            b.setContentString(kmlObject.getDescription());
            plugin.setBalloon(b);
        }else{
            var b = plugin.createFeatureBalloon('');
            b.setFeature(kmlObject);
            setTimeout(function(){
                plugin.setBalloon(b);
            }, 10);
        }
    }
};
