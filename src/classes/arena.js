var mag = require('vectors/mag')(2)
var normalize = require('vectors/normalize')(2)
var dot = require('vectors/dot')(2)

const Bullet = require('./bullet') ;
const Ship = require('./ship') ;

let initialTime;
let finalTime;
let updateCount = 0;

module.exports = class Arena {
  constructor() {
    this.runing = false
    this.elements = []
    this.width = 800
    this.height = 600
    this.playersPromise = []
  }
  start () {
    console.log('Arena - start');
    this.runing = true;
    initialTime = new Date();
    this.update(1)
  }
  stop () {
    console.log('Arena - stop');
    this.runing = false;
  }
  update (elapsedTime) {
    if (updateCount > 500) {
      console.log('Arena - update', elapsedTime)
      updateCount = 0
    }
    updateCount++

    let finalTime = new Date()
    this.playersPromise.length = 0

    for (let element in this.elements) {
        let currentElement = this.elements[element]
        switch (currentElement.type) {
          case 'ship':
            this.playersPromise.push(this.updateShip(elapsedTime, currentElement))
            break
          case 'bullet':
            this.updateBullet(elapsedTime, currentElement)
            break
        }
      }
    if (this.runing) {
      Promise.all(this.playersPromise).then(() => {
        setTimeout(() => {
          this.update(finalTime - initialTime)
          initialTime = finalTime
        }, 0);
      }).catch((e) => {
        console.error(e)
      })

    }
  }
  updateShip (elapsedTime, element) {
    return element.ship.update(elapsedTime, this.getStatus(element)).then(({newUserProperties, time}) => {

      element.ship.userProperties = newUserProperties;
      // check the output of the player
      if (Math.abs(element.ship.userProperties.aceleration) > element.ship.intrinsicProperties.maxAceleration) {
        element.ship.userProperties.aceleration = element.ship.intrinsicProperties.maxAceleration * Math.sign(element.ship.userProperties.aceleration)
      }
      if (Math.abs(element.ship.userProperties.rotate) > element.ship.intrinsicProperties.maxAngularVelocity) {
        element.ship.userProperties.rotate = element.ship.intrinsicProperties.maxAngularVelocity * Math.sign(element.ship.userProperties.rotate)
      }

      // the physics of the arena

      element.state.velocity += element.ship.intrinsicProperties.maxVelocity * element.ship.userProperties.aceleration * (elapsedTime / 1000)
      element.state.angularVelocity += element.ship.intrinsicProperties.maxAngularVelocity * element.ship.userProperties.rotate * (elapsedTime / 1000)

      if (Math.abs(element.state.velocity) > element.ship.intrinsicProperties.maxVelocity) {
        element.state.velocity = element.ship.intrinsicProperties.maxVelocity * Math.sign(element.state.velocity)
      }

      // if the velocity = maxVelocity then maxAngularVelocity = maxAngularVelocity / 4
      const maxAngRelativeToVelocity = (-(3 / 4) * (element.ship.intrinsicProperties.maxAngularVelocity / element.ship.intrinsicProperties.maxVelocity) * element.state.velocity + element.ship.intrinsicProperties.maxAngularVelocity)
      if (Math.abs(element.state.angularVelocity) > maxAngRelativeToVelocity) {
        element.state.angularVelocity = maxAngRelativeToVelocity * Math.sign(element.state.angularVelocity)
      }

      element.state.x += element.state.velocity * Math.cos(element.state.direction) * (elapsedTime / 1000)
      element.state.y += element.state.velocity * Math.sin(element.state.direction) * (elapsedTime / 1000)
      element.state.direction += element.state.angularVelocity * (elapsedTime / 1000)

      // adjust position of elements
      if (element.state.x < element.ship.diameter) {
        element.state.x = element.ship.diameter
      }
      if (element.state.y < element.ship.diameter) {
        element.state.y = element.ship.diameter
      }
      if (element.state.x > this.width - element.ship.diameter) {
        element.state.x = this.width - element.ship.diameter
      }
      if (element.state.y > this.height - element.ship.diameter) {
        element.state.y = this.height - element.ship.diameter
      }

      // fire if is not reloading and the player want to fire
      if (!element.state.reloadingBullet && element.ship.userProperties.fire) {
        element.ship.userProperties.fire = false
        element.state.reloadingBullet = element.ship.intrinsicProperties.reloadingTime

        this.elements.push({
          type: 'bullet',
          bullet: new Bullet(element.state, element.ship),
          state: {
            x: element.state.x,
            y: element.state.y,
            direction: element.state.direction,
            velocity: 500
          }
        })
      }
      element.state.reloadingBullet -= elapsedTime
      if (element.state.reloadingBullet < 0) {
        delete element.state.reloadingBullet
      }

      // check if some ship is death
      if (element.state.energy <= 0) {
        this.respawnShip(element)
      }
    }).catch((e) => {
      console.error(e)
    })


  }

  updateBullet (elapsedTime, element) {
    element.bullet.update(elapsedTime, this.getStatus(element))

    element.state.x += element.state.velocity * Math.cos(element.state.direction) * (elapsedTime / 1000)
    element.state.y += element.state.velocity * Math.sin(element.state.direction) * (elapsedTime / 1000)

    if (element.bullet.hasCollided) {
      // remove energy to a ship
      for (var i = 0; i < this.elements.length; i++) {
        if (this.elements[i].ship === element.bullet.hasCollidedWithShip) {
          this.elements[i].state.energy--
          break
        }
      }
      // kill the bullet
      this.elements.splice(this.elements.indexOf(element), 1)
    } else {
      // max distance
      if (mag([
              element.state.x - element.bullet.intrinsicProperties.initialX,
              element.state.y - element.bullet.intrinsicProperties.initialY
        ]) > element.bullet.intrinsicProperties.maxDistance) {
        // kill the bullet
        this.elements.splice(this.elements.indexOf(element), 1)
      }
    }
  }
  respawnShip (element) {
    element.state.x = Math.floor(Math.random() * this.width)
    element.state.y = Math.floor(Math.random() * this.height)
    element.state.direction = Math.floor(Math.random() * 360)
    element.state.velocity = 0
    element.state.angularVelocity = 0
    element.state.energy = element.ship.intrinsicProperties.maxEnergy
    element.state.deaths ++
  }
  addPlayer (id, username, player) {
    let ship = new Ship({
      diameter: 40,
      id,
      name: username,
      player
    })

    this.elements.push({
      type: 'ship',
      ship: ship,
      state: {
        // initial values of a ship
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height),
        direction: Math.floor(Math.random() * 360), // from 0 to 360
        velocity: 0, // from 0 to maxVelocity
        angularVelocity: 0, // from 0 to maxAngularVelocity
        energy: ship.intrinsicProperties.maxEnergy,
        deaths: 0
      }
    })

    const index = this.elements.length - 1
    return index
  }
  updatePlayer(id, code) {

    if (id) {
      for (var i = 0; i < this.elements.length; i++) {
        if (this.elements[i].type === 'ship') {
          if (this.elements[i].ship.player.id === id) {
            console.log('updatePlayer', this.elements[i].ship.player.id)
            this.elements[i].ship.player.changeCode(code)
            break
          }
        }
      }
    }
  }
  changeShip (index, ship) {
    this.elements[index] = {
      type: 'ship',
      ship: ship,
      state: {
        // initial values of a ship
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height),
        direction: Math.floor(Math.random() * 360), // from 0 to 360
        velocity: 0, // from 0 to maxVelocity
        angularVelocity: 0, // from 0 to maxAngularVelocity
        energy: ship.intrinsicProperties.maxEnergy,
        deaths: 0
      }
    }
    console.log('Ship changed.')
    console.log('Elements: ', this.elements)
  }

  removeShip (ship) {
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].ship === ship) {
        this.elements.splice(i, 1)
        break
      }
    }
    this.elements.splice(this.elements.indexOf(ship), 1)
  }

  getStatus (element) {
    // This method is in WIP
    var resp
    switch (element.type) {
      case 'ship':
        resp = {
          ships: [],
          myShip: undefined
        }
        // find myShip
        for (let i = 0; i < this.elements.length; i++) {
          if (this.elements[i].type === 'ship') {
            if (this.elements[i].ship === element.ship) {
              // generate a copy of the ship. To avoid changes from the player
              delete this.elements[i].ship.p
              resp.myShip = JSON.parse(JSON.stringify(this.elements[i]))
              break
            }
          }
        }
        // calculate angule and distance
        for (let i = 0; i < this.elements.length; i++) {
          if (this.elements[i].type === 'ship') {
            if (this.elements[i].ship !== element.ship) {
              let posVector = [
                this.elements[i].state.x - element.state.x,
                this.elements[i].state.y - element.state.y
              ]
              let dirVector = [
                Math.cos(element.state.direction + Math.PI / 2),
                Math.sin(element.state.direction + Math.PI / 2)
              ]
              let distance = mag(posVector)
              posVector = normalize(posVector);

              resp.ships.push({
                angule: dot(dirVector, posVector) * 180,
                distance: distance
              })
            }
          }
        }
        break
      case 'bullet':
        resp = {
          elements: [],
          bullet: undefined
        }
        for (let i = 0; i < this.elements.length; i++) {
          if (this.elements[i].type === 'ship') {
            resp.elements.push({
              x: this.elements[i].state.x,
              y: this.elements[i].state.y,
              ship: this.elements[i].ship
            })
          } else if (this.elements[i].type === 'bullet' && this.elements[i].bullet === element.bullet) {
            resp.bullet = this.elements[i]
          }
        }
        break
    }
    return resp
  }
}