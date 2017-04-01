const {resolve} = require('path')
const cp = require('child_process')
const timeout = 5
var n

module.exports = class Player {
	constructor(id, code) {
		n = cp.fork(resolve(__dirname, '../players/index.js'));

		this.childProcess = function() {
			return this
		}.bind(n);
		this.id = id
		this.changeCode(code)
		this.childProcess().on('message', (message) => {
			switch(message.type) {
				case 'makeUpdate':
					this.resolvePromise({
						newUserProperties: message.data,
						time: new Date() - this.initialDate
					})
				break;
				case 'errorOnUpdate':
					this.resolvePromise({
						newUserProperties: message.data,
						error: message.error,
						time: new Date() - this.initialDate
					})
				break;
			}

		})
	}
	changeCode(code) {
		this.childProcess().send({
			type:'initialize',
			data: {
				id: this.id,
				code
			}
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
				this.resolvePromise({
					newUserProperties: userProperties,
					time: new Date() - this.initialDate
				})
			}, timeout)
		});
	}
}
