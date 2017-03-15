module.exports = class Ship {
  constructor ({x, y, diameter, color, centerColor, name, energy, player}) {
    this.name = name
    this.energy = energy
    this.color = color || 'blue'
    this.centerColor = centerColor || 'white'
    this.diameter = diameter

    // the user can not change this
    this.intrinsicProperties = {
      maxAceleration: 10,
      weight: 10,
      maxVelocity: 100,
      maxAngularVelocity: 10,
      maxEnergy: 5,
      reloadingTime: 1000 // in ms
    }

    this.userProperties = {
      aceleration: 0,
      rotate: 0,
      fire: false
    }

    this.player = player
  }

  update (elapsedTime, arenaStatus) {
    this.player.update(elapsedTime, this.userProperties, arenaStatus)
    // todo, here fire the ship events
  }
}
