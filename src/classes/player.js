const cp = require('child_process');
const timeout = 500
var n;

module.exports = class Player {
	constructor(id) {
		// TODO send player id to child process
		n = cp.fork(`./players/index.js`);

		this.childProcess = function() {
			return this
		}.bind(n);

		n.send({
			type:'initialize',
			data: {
				id
			}
		})
	}
	update(elapsedTime, userProperties, arenaStatus) {
		let initialDate = new Date();
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

			// TODO move the 'on' from here. This method is executed several times!!
			this.childProcess().on('message', function(newUserProperties) {
				resolve({
					newUserProperties,
					time: new Date() - initialDate
				})
			})
			setTimeout(() => {
				reject('out of time')
			}, timeout)
		});
	}
}