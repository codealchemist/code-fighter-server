var dist = require('vectors/dist')(2)

module.exports = class Bullet {
  constructor ({x, y, team}, ownership) {
    this.intrinsicProperties = {
      maxVelocity: 100,
      maxDistance: 500,
      // these are needed to calculate the traveled distance of the bullet
      initialX: x,
      initialY: y
    }
    this.team = team
    this.ownership = ownership
  }

  update (elapsedTime, arenaStatus) {
    for (let i = 0; i < arenaStatus.elements.length; i++) {
      // to avoid auto impact
      if (this.ownership !== arenaStatus.elements[i].ship) {
        // to avoid friend fire in the team mode
        if (this.team === undefined || this.team !== arenaStatus.elements[i].team) {
          let distance = dist([arenaStatus.bullet.state.x, arenaStatus.bullet.state.y], [arenaStatus.elements[i].x, arenaStatus.elements[i].y])
          if (distance < arenaStatus.elements[i].ship.diameter) {
            this.hasCollided = true
            this.hasCollidedWithShip = arenaStatus.elements[i].ship
          }
        }
      }
    }
  }
}
