/* global AFRAME, THREE */

AFRAME.registerComponent("receptacle", {
  schema: {
    objects: { type: "string", default: "[grabbable]" },
    radius: { type: "number", default: 0.125 },
  },

  init() {
    this._anchor = this.el.ensure(".receptacle.anchor", "a-entity", {
      class: "receptacle anchor",
      body: "type:kinematic;autoShape:false;"
    })
    this._refreshTO = setInterval(this.refreshObjects.bind(this), 1024)
  },

  remove() {
    clearInterval(this._refreshTO)
  },

  tick() {
    if (!this.nearest) return this.refreshObjects()
    let thisPos = THREE.Vector3.temp()
    let delta = THREE.Vector3.temp()
    this.el.object3D.getWorldPosition(thisPos)
    this.nearest.object3D.getWorldPosition(delta)
    delta.sub(thisPos)
    if (this._lastNearest && this._lastNearest !== this.nearest) {
      if (this.el.is("filled")) {
        this._anchor.removeAttribute("joint__put")
        this._anchor.removeAttribute("animation__pos")
        this._anchor.removeAttribute("animation__rot")
        this.el.removeState("filled")
        this._lastNearest.removeState("put")
        this.el.emit("take", {
          grabbable: this._lastNearest
        })
        this._lastNearest.emit("take", {
          receptacle: this.el
        })
      }
      if (this._hover) {
        this.el.emit("unhover", {
          grabbable: this._lastNearest
        })
        this._lastNearest.emit("unhover", {
          receptacle: this.el
        })
      }
      this._hover = false
    } else if (delta.length() > this.data.radius) {
      if (this.el.is("filled")) {
        this._anchor.removeAttribute("joint__put")
        this._anchor.removeAttribute("animation__pos")
        this._anchor.removeAttribute("animation__rot")
        this.el.removeState("filled")
        this.nearest.removeState("put")
        this.el.emit("take", {
          grabbable: this.nearest
        })
        this.nearest.emit("take", {
          receptacle: this.el
        })
      }
      if (this._hover) {
        this.el.emit("unhover", {
          grabbable: this.nearest
        })
        this.nearest.emit("unhover", {
          receptacle: this.el
        })
      }
      this._hover = false
    } else if (this.nearest.is("grabbed") || !this._hover) {
      if (!this._hover) {
        this.el.emit("hover", {
          grabbable: this.nearest
        })
        this.nearest.emit("hover", {
          receptacle: this.el
        })
      }
      this._anchor.removeAttribute("animation__pos")
      this._anchor.removeAttribute("animation__rot")
      this._anchor.copyWorldPosRot(this.nearest)
      this._hover = true
    } else {
      if (!this.el.is("filled")) {
        this._anchor.copyWorldPosRot(this.nearest)
        this._anchor.components.body.commit()
        if (this.nearest.components.body)
          this._anchor.setAttribute("joint__put", { body2: this.nearest, type: "lock" })
        this.el.addState("filled")
        this.nearest.addState("put")
        this.el.emit("put", {
          grabbable: this.nearest
        })
        this.nearest.emit("put", {
          receptacle: this.el
        })
      }
      if (!this._anchor.getAttribute("animation__pos")) {
        this._anchor.setAttribute("animation__pos", {
          property: "position",
          to: { x: 0, y: 0, z: 0 },
          dur: 256
        })
        this._anchor.setAttribute("animation__rot", {
          property: "rotation",
          to: { x: 0, y: 0, z: 0 },
          dur: 256
        })
      }
      this.nearest.copyWorldPosRot(this._anchor)
      this._hover = true
    }
    this._lastNearest = this.nearest
  },

  refreshObjects() {
    let shortest = Infinity
    let thisPos = THREE.Vector3.temp()
    let thatPos = THREE.Vector3.temp()
    let delta = THREE.Vector3.temp()
    let els = this.el.sceneEl.querySelectorAll(this.data.objects)
    this.nearest = null
    if (!els) return
    this.el.object3D.getWorldPosition(thisPos)
    els.forEach(el => {
      el.object3D.getWorldPosition(thatPos)
      delta.copy(thatPos).sub(thisPos)
      if (shortest > delta.length()) {
        shortest = delta.length()
        this.nearest = el
      }
    })
  },


})