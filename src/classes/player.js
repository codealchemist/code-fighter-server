const {resolve} = require('path')
const cp = require('child_process')
const timeout = 5
var n

module.exports = class Player {
	constructor(id) {
		// TODO send player id to child process
		n = cp.fork(resolve(__dirname, '../players/index.js'));

		this.childProcess = function() {
			return this
		}.bind(n);
		this.childProcess().send({
			type:'initialize',
			data: {
				id
			}
		})
		this.childProcess().on('message', (newUserProperties) => {
			this.resolvePromise({
				newUserProperties,
				time: new Date() - this.initialDate
			})
		})
	}
	update(elapsedTime, userProperties, arenaStatus) {
		this.initialDate = new Date();
		this.childProcess().send({
			type: 'makeUpdate',
			data: {
				elapsedTime,
				userProperties,
				arenaStatus
			}
		});

		return new Promise((resolve, reject) => {
			// wait for child process response
			this.resolvePromise = resolve;

			setTimeout(() => {
				// out of time, resolve with previous values
				resolve({
					newUserProperties: userProperties,
					time: new Date() - this.initialDate
				})
			}, timeout)
		});
	}
}
