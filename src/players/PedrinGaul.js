module.exports = class PedrinGaul {
  constructor () {
    this.toFollow = 0
  }

  update (elapsedTime, userProperties, arenaStatus) {

    userProperties.aceleration = 5

    if (arenaStatus.ships[this.toFollow]) {
      userProperties.rotate = arenaStatus.ships[this.toFollow].angule

      if (Math.abs(arenaStatus.ships[this.toFollow].angule) < 10) {
        userProperties.fire = true
      }

      if (this._lastAngule > arenaStatus.ships[this.toFollow].angule && arenaStatus.myShip.velocity > 0) {
        userProperties.aceleration = -1
      }
      this._lastAngule = arenaStatus.ships[this.toFollow].angule
    }
  }
}
