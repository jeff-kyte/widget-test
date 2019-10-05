var funkyBtn = (function() {
    var isTouchScreen = ('ontouchstart' in document.documentElement);
    
    /*** CUSTOM VARIABLES ***/
    var animEasing = 'linear'; // jQuery animate() easing property.
    var buffer = 0;// Pad the button from the mouse by this many pixels.
    var returnDelay = 500; // Milliseconds before moved buttons start to return.
    var resetOnResize = true; // Recalculates button positions when page is resized.
    if (isTouchScreen) {
        buffer += 20;
        returnDelay = 100;
    } /*** END CUSTOM VARIABLES ***/
    
    // Tracking active buttons:
    var btnList = [], currentMousePos = {}, isInitialized = false, resizingPage = null;
    
    
    // Call to initialize or reset the script:
    var init = function() {
		// Reset page integration
        for (let btnCount = 0; btnCount < btnList.length; btnCount++) // Remove classes
            $('.funkyBtnNo' + btnCount).removeClass('funkyBtnNo' + btnCount);
		btnList.forEach(button => { // Remove associated hiddenElems
			button.hiddenElem.remove();
		});
        btnList = [], btnCount = 0;
        // Store original button positions in btnList[]:
        $('.funkyBtn').each(function() {
            $(this).addClass('funkyBtnNo' + btnCount);
            $(this).css('position', 'relative'); // Relative positioning is mandatory.
            btnList[btnCount++] = {
                leftOrig : $(this).css('left'),
                topOrig : $(this).css('top'),
                isMoved : false,
                timeout : null, // setTimeout() return value.
                domRef : $(this),
                stoppedAt : null,
				running : false,
                offsets : {
                    left : $(this).offset().left,
                    top : $(this).offset().top
                },
                hiddenElem : $(document.createElement('div')).css({
                    display : 'none',
                    position : 'absolute',
                    top : $(this).css('top'),
                    left : $(this).css('left')
                })
            };
        });
        if (!isInitialized) { // First time init:
            // Event listeners:
            $(document).mousemove(function(event) {
                currentMousePos = {
                    'pageX' : event.pageX,
                    'pageY' : event.pageY
                }
                btnList.forEach(button => {
                    if (/*button.isMoved == true
                        && */detectCollision(button)) {
                        runAway(button.domRef);
                    }
                });
            });
            if (isTouchScreen) {
                $('.funkyBtn').bind('touchstart', function(event) {
                    runAway($(this), contactPoint = {
                        'pageX' : event.touches[0].pageX,
                        'pageY' : event.touches[0].pageY
                    });
                });
            } else {
                /*$('.funkyBtn').mousemove(function(event) {
                    if (currentMousePos.pageX != event.pageX
                        && currentMousePos.pageY != event.pageY) {
                        currentMousePos = {
                            'pageX' : event.pageX,
                            'pageY' : event.pageY
                        }
                        runAway($(this), currentMousePos);
                    }
                });*/
            }
            $('.funkyBtn').click(function(event) {
                event.preventDefault(); // Pretend that click never happened.
                currentMousePos = {
                    'pageX' : event.pageX,
                    'pageY' : event.pageY
                }
                runAway($(this));
            });
            if (resetOnResize) {
                $(window).resize(function() {
                    if (!resizingPage) {
                        btnList.forEach(button => { // Reset buttons
                            button.hiddenElem.stop();
                            clearTimeout(button.timeout);
                            button.domRef.css({
                                top : button.topOrig,
                                left : button.leftOrig
                            });
                        });
                        resizingPage = setTimeout(function() {
                            resizingPage = null;
                            init();
                        }, 500);
                    } else {
                        clearTimeout(resizingPage);
                        resizingPage = setTimeout(function() {
                            resizingPage = null;
                            init();
                        }, 500);
                    }
                });
            }
            isInitialized = true;
        }
    }
	
    // Check if button will collide with cursor:
    function detectCollision(internalBtn) {
        var cssLeft = parseInt(internalBtn.hiddenElem.css('left'), 10);
        var cssTop = parseInt(internalBtn.hiddenElem.css('top'), 10);
        return (currentMousePos.pageX >= (cssLeft + internalBtn.offsets.left - buffer))
            && (currentMousePos.pageY >= (cssTop + internalBtn.offsets.top - buffer))
            && (currentMousePos.pageX <= (cssLeft + internalBtn.offsets.left + internalBtn.domRef.outerWidth() + buffer))
            && (currentMousePos.pageY <= (cssTop + internalBtn.offsets.top + internalBtn.domRef.outerHeight() + buffer));
    }
	// Moves DOM button element away from point on page:
    function runAway(domBtn, contactPoint = currentMousePos) {
		console.log('*******************************');
        if (resizingPage) return;
        // Element position and dimension variables:
        var btnPageTop, btnPageLeft, btnWidth, btnHeight, btnMidX, btnMidY, relMouseX, relMouseY;
        // Used to calculate vector:
        var slope, btnInterY1, btnInterY2, btnInterX1, btnInterX2, tempX, tempY, vectorX, vectorY;
        // Identify button using class name "funkyBtnNo(x)":
        var internalBtn = btnList[parseInt(domBtn.attr('class').match(/funkyBtnNo(\d+)/)[1], 10)];
        internalBtn.running = true;
        // Reset button animation and returnDelay:
        internalBtn.hiddenElem.stop();
        clearTimeout(internalBtn.timeout);
        internalBtn.isMoved = true;
        internalBtn.timeout = setTimeout(function() { // Set return delay.
            btnGoBack(internalBtn);
        }, returnDelay);
        // Get button position and dimensions:
        btnPageTop = parseInt(domBtn.offset().top, 10);
        btnPageLeft = parseInt(domBtn.offset().left, 10);
        btnWidth = domBtn.outerWidth();
        btnHeight = domBtn.outerHeight();
		console.log('button width: ' + btnWidth + ', height: ' + btnHeight);
        btnMidX = Math.round(btnPageLeft + (btnWidth / 2));
        btnMidY = Math.round(btnPageTop + (btnHeight / 2));
        // Relativize mouse/touch coordinates:
        relMouseX = contactPoint.pageX - btnMidX;
        relMouseY = contactPoint.pageY - btnMidY;
		console.log('relMouseX: ' + relMouseX + ', relMouseY: ' + relMouseY);
        // Line between button's center and cursor position: 
        if (relMouseX == 0) relMouseX = 0.0001; // Ensure there is a slope.
        slope = relMouseY / relMouseX;
		console.log('slope: ' + slope);
		
        // Find points where said line intercepts button boundary with added buffer:
		btnInterX1 = slope * ((btnWidth / 2) + buffer); // y coord of interception point with side
		console.log('btnInterY init: ' + btnInterY1);
		//if (relMouseX < 0) btnInterY1 *= -1;
		//console.log('btnInterY adjusted: ' + btnInterY1);
		btnInterY1 = ((btnHeight / 2) + buffer) / slope; // x coord of interception point with top/bottom
		console.log('btnInterX init: ' + btnInterX1);
		//if (relMouseY < 0) btnInterX1 *= -1;
		//console.log('btnInterX adjusted: ' + btnInterX1);
		
		// Calculate vector using closest intercept:
        if (Math.abs(btnInterY1) >= Math.abs(btnInterX1)) { // X-intercept.
			vectorX = relMouseX + (((btnWidth / 2) + buffer) * (relMouseX > 0 ? -1 : 1));
            vectorY = relMouseY + (btnInterX1 * (relMouseX > 0 ? -1 : 1));
        } else { // Y-intercept.
			vectorY = relMouseY + (((btnHeight / 2) + buffer) * (relMouseY > 0 ? -1 : 1));
            vectorX = relMouseX + (btnInterY1 * (relMouseY > 0 ? -1 : 1));
        }
		
		
        /*
        // Remove vectors in case button is tempted to misbehave:
        if (Math.abs(relMouseX) > Math.abs(tempX)) vectorX = 0;
        if (Math.abs(relMouseX) > Math.abs(btnInterX)) vectorX = 0;
        if (Math.abs(relMouseY) > Math.abs(tempY)) vectorY = 0;
        if (Math.abs(relMouseY) > Math.abs(btnInterY)) vectorY = 0;
        if (Math.abs(vectorX) < 1) vectorX = 0;
        if (Math.abs(vectorY) < 1) vectorY = 0;
		*/
        
        // Finally translate button:
        setTimeout(function() { // 1ms delay avoids render cycle overlooking change.
            domBtn.css({
                left : parseInt(domBtn.css('left'), 10) + vectorX,
                top : parseInt(domBtn.css('top'), 10) + vectorY
            });
        }, 1);
        internalBtn.running = false;
    }
    // Animate button return, called by setTimeout():
    function btnGoBack(internalBtn) {
        internalBtn.hiddenElem.css({
            top : internalBtn.domRef.css('top'),
            left : internalBtn.domRef.css('left'),
            position : 'absolute',
            display : 'none'
        });
        
        if (internalBtn.stoppedAt == currentMousePos) {
            internalBtn.timeout = setTimeout(function() { // Set return delay.
                btnGoBack(internalBtn);
            }, returnDelay);
        } else { // animate() hidden element to detect collisions at each step before applying to actual button:
            internalBtn.stoppedAt = null;
            internalBtn.hiddenElem.animate({
                top : internalBtn.topOrig, // To the original css position.
                left : internalBtn.leftOrig
            }, {
                queue : false,
                easing : animEasing,
                step : function() { // Check for mouse contact:
                    if (!isTouchScreen) {
                        if (detectCollision(internalBtn)) { // There is a collision:
                            internalBtn.hiddenElem.stop();
                            internalBtn.stoppedAt = currentMousePos;
                            internalBtn.timeout = setTimeout(function() { // Set return delay.
                                btnGoBack(internalBtn);
                            }, returnDelay);
                        } else { // There is no collision:
                            internalBtn.domRef.css({ // Move button into new position.
                                top : internalBtn.hiddenElem.css('top'),
                                left : internalBtn.hiddenElem.css('left')
                            });
                        }
                    }
                },
                complete : function() {
                    internalBtn.domRef.css({
                        top : internalBtn.topOrig,
                        left : internalBtn.leftOrig
                    });
                    internalBtn.isMoved = false;
                }
            });
        }
    }
    return { init : init };
})();

$(document).ready(function() {
    funkyBtn.init();
});