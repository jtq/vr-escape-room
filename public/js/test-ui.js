

  function makeDraggable(
    theEl,
    theContainer,
    mouseUpCallback=null,
    mouseDownCallback=null,
    mouseMoveCallback=null,
    constrainToContainer=true,
    enableXAxis=true,
    enableYAxis=true
  ) {
    const el = theEl;
    const container = theContainer;
    const constrain = constrainToContainer;
    let elementOffsetX = 0;
    let elementOffsetY = 0;

    let beingDragged = false;

    const mouseDownHandler = (e) => {
      if(e.target === el) {
        e.preventDefault();
        beingDragged = true;
        
        el.style.transition = replaceTransition(el.style.transition, "left");
        el.style.transition = replaceTransition(el.style.transition, "top");
        
        // Record the offset of the click into the object
        if(e.type === 'touchstart') {
          elementOffsetX = e.touches[0].pageX - el.offsetLeft;
          elementOffsetY = e.touches[0].pageY - el.offsetTop;
        }
        else {
          elementOffsetX = e.pageX - el.offsetLeft;
          elementOffsetY = e.pageY - el.offsetTop;
        }

        // Change box position to absolute pixel positions
        el.style.left = el.offsetLeft + 'px';
        el.style.top = el.offsetTop + 'px';

        // Change container dimensions to integer pixel values
        container.style.width = container.offsetWidth + 'px';
        container.style.height = container.offsetHeight + 'px';

        if(mouseDownCallback){
          mouseDownCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }
      }
    };
    const mouseMoveHandler = (e) => {
      if(beingDragged) {
        e.preventDefault();
        let newX, newY;

        if(e.type === 'touchstart') {
          newX = e.touches[0].pageX - elementOffsetX;
          newY = e.touches[0].pageY - elementOffsetY;
        }
        else {
          newX = e.pageX - elementOffsetX;
          newY = e.pageY - elementOffsetY;
        }

        if(constrain) {
          let maxX = container.offsetWidth-el.offsetWidth;
          let maxY = container.offsetHeight-el.offsetHeight;

          if(newX < 0 || newX > maxX || newY < 0 || newY > maxY) {
            mouseUpHandler(e);
          }
          newX = Math.min(Math.max(newX, 0), maxX);
          newY = Math.min(Math.max(newY, 0), maxY);
        }

        if(enableXAxis) {
          el.style.left = newX + 'px';
        }
        if(enableYAxis) {
          el.style.top = newY + 'px';
        }
        if(mouseMoveCallback) {
          mouseMoveCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }
      }
    };
    const mouseUpHandler = (e) => {
      if(beingDragged) {
        e.preventDefault();
        beingDragged = false;

        if(mouseUpCallback) {
          mouseUpCallback(el.style.left, el.style.top, container.style.width, container.style.height, e);
        }

        el.style.transition = replaceTransition(el.style.transition, 'left', '1s ease');
        el.style.transition = replaceTransition(el.style.transition, 'top', '1s ease');
      }
    };
    
    container.addEventListener('mousedown', mouseDownHandler);
    container.addEventListener('mousemove', mouseMoveHandler);
    container.addEventListener('mouseup', mouseUpHandler);

    container.addEventListener("touchstart", mouseDownHandler, false);
    container.addEventListener("touchmove", mouseMoveHandler, false);
    container.addEventListener("touchend", mouseUpHandler, false);

    return () => {  // Remove draggable status from element
      container.removeEventListener('mousedown', mouseDownHandler);
      container.removeEventListener('mousemove', mouseMoveHandler);
      container.removeEventListener('mouseup', mouseUpHandler);

      container.removeEventListener("touchstart", mouseDownHandler);
      container.removeEventListener("touchmove", mouseMoveHandler);
      container.removeEventListener("touchend", mouseUpHandler);
    };
  }

  makeDraggable(
    document.querySelector('#box1'),
    document.querySelector('#container'),
    (boxLeft, boxTop, containerWidth, containerHeight, e) => {
      console.log(`mouseup`, boxLeft, boxTop, containerWidth, containerHeight, e);
      socket.emit('update_state', {
        scene: {
          ids: {
            box1: {
              left: boxLeft,
              top: boxTop,
              lastTouched: user.name
            }
          }
        }
      });
    }
  );

  let boxPosition = document.querySelector('#boxPosition');

  boxPosition.addEventListener('change', e => {
    console.log(boxPosition.value);
    socket.emit('update_state', {
      scene: {
        ids: {
          box1: {
            left: boxPosition.value + '%',
            lastTouched: user.name
          }
        }
      }
    });
  });