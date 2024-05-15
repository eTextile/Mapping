
/*
onMouseDrag: function (mouseEvent) {
  if (currentMode === EDIT_MODE) {
    switch (selectedPath) {
      case "fill":
        moveItem(this, mouseEvent);
        break;
      case "stroke":
        switch (selectedPart.name) {
          case "rect":
            if (this.bounds.width > this.bounds.height) {
              slider_dir = H_SLIDER;
            } else {
              slider_dir = V_SLIDER;
            }
            switch (selectedSegment) {
              case 0: // Update left segment
                if (mouseEvent.point.x > this.bounds.right - slider_min_width) {
                }
                else {
                  this.data.from[0] = Math.round(this.bounds.left);
                  this.children["rect"].segments[0].point.x = mouseEvent.point.x;
                  this.children["rect"].segments[1].point.x = mouseEvent.point.x;
                  switch (slider_dir) {
                    case H_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.right - (this.bounds.width / 2);
                      this.children["handle"].segments[0].point.y = this.bounds.top;
                      this.children["handle"].segments[1].point.x = this.bounds.right - (this.bounds.width / 2);
                      this.children["handle"].segments[1].point.y = this.bounds.bottom;
                      break;
                    case V_SLIDER:
                      this.children["handle"].segments[0].point.x = mouseEvent.point.x;
                      this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
                      this.children["handle"].segments[1].point.x = this.bounds.right;
                      this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
                      break;
                  }
                }
                break;
              case 1: // Update top segment
                if (mouseEvent.point.y > this.bounds.bottom - slider_min_height) {
                }
                else {
                  this.data.from[1] = Math.round(this.bounds.top);
                  this.children["rect"].segments[1].point.y = mouseEvent.point.y;
                  this.children["rect"].segments[2].point.y = mouseEvent.point.y;
                  switch (slider_dir) {
                    case H_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[0].point.y = mouseEvent.point.y;
                      this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[1].point.y = this.bounds.bottom;
                      break;
                    case V_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left;
                      this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
                      this.children["handle"].segments[1].point.x = this.bounds.right;
                      this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
                      break;
                  }
                }
                break;
              case 2: // Update right segment
                if (mouseEvent.point.x < this.bounds.left + slider_min_width) {
                }
                else {
                  this.data.to[0] = Math.round(this.bounds.right);
                  this.children["rect"].segments[2].point.x = mouseEvent.point.x;
                  this.children["rect"].segments[3].point.x = mouseEvent.point.x;
                  switch (slider_dir) {
                    case H_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[0].point.y = this.bounds.top;
                      this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[1].point.y = this.bounds.bottom;
                      break;
                    case V_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left;
                      this.children["handle"].segments[0].point.y = this.bounds.top + (this.bounds.height / 2);
                      this.children["handle"].segments[1].point.x = mouseEvent.point.x
                      this.children["handle"].segments[1].point.y = this.bounds.top + (this.bounds.height / 2);
                      break;
                  }
                }
                break;
              case 3: // Update bottom segment
                if (mouseEvent.point.y < this.bounds.top + slider_min_height) {
                }
                else {
                  this.data.to[1] = Math.round(this.bounds.bottom);
                  this.children["rect"].segments[0].point.y = mouseEvent.point.y;
                  this.children["rect"].segments[3].point.y = mouseEvent.point.y;
                  switch (slider_dir) {
                    case H_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[0].point.y = this.bounds.top;
                      this.children["handle"].segments[1].point.x = this.bounds.left + (this.bounds.width / 2);
                      this.children["handle"].segments[1].point.y = mouseEvent.point.y;
                      break;
                    case V_SLIDER:
                      this.children["handle"].segments[0].point.x = this.bounds.left;
                      this.children["handle"].segments[0].point.y = this.bounds.bottom - (this.bounds.height / 2);
                      this.children["handle"].segments[1].point.x = this.bounds.right;
                      this.children["handle"].segments[1].point.y = this.bounds.bottom - (this.bounds.height / 2);
                      break;
                  }
                }
                break;
            }
            updateMenuParams(this);
            break;
          case "handle":
            console.log("PINGGGGGG");
            moveItem(this, mouseEvent);
            break;
        }
    }
    updateMenuParams(this);
  }
}
*/
