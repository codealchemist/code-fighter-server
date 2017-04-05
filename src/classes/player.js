const path = require('path')
const cp = require('child_process')
const timeout = 10

module.exports = class Player {
	constructor(id, code) {
		this.id = id
		this.code = code

		this.getChildProcess = () => {}
		this.deleteAndCreateChildProcess()

		this.updateCount = 0
		this.messages = []
	}
	changeCode(code) {
		this.code = code

		this.getChildProcess().send({
			type:'initialize',
			data: {
				id: this.id,
				code
			}
		})
	}
	update(elapsedTime, userProperties, arenaStatus) {
		this.updateCount++

		if (!this.getChildProcess()) {
			console.warn('childProcess not ready')
			// make this transparent to outside
			return Promise.resolve({
				newUserProperties: userProperties,
				time: 0
			})
		}

		this.updateInProcess = true;
		let currentUpdate = this.updateCount


		this.initialDate = new Date();
		this.getChildProcess().send({
			type: 'makeUpdate',
			data: {
				elapsedTime,
				userProperties,
				arenaStatus
			}
		});


		return new Promise((resolve, reject) => {
			// wait for child process response
			this.resolvePromise = resolve

			setTimeout(() => {
				if (this.updateInProcess && currentUpdate === this.updateCount) {
					// out of time, resolve with previous values
					this.resolvePromise({
						newUserProperties: userProperties,
						error: 'You are out of time, perform your code! time: ' + (new Date() - this.initialDate) + 'ms (max is ' + timeout + 'ms)',
						time: new Date() - this.initialDate
					})
					this.deleteAndCreateChildProcess()
				}
			}, timeout)
		});
	}
	deleteAndCreateChildProcess () {
		this.createChildProcess().then((newChildProcess)=> {
			this.deleteChildProcess()
			this.getChildProcess = function() {
				return this
			}.bind(newChildProcess)
		})
	}

	/*
	*	function to prepare the child-process
	*/
	createChildProcess() {
		console.info('createChildProcess')
		return new Promise((resolve, reject) => {
			let newChildProcess = cp.fork(path.resolve(__dirname, '../players/index.js'), [], { silent:true });


			newChildProcess.send({
				type:'initialize',
				data: {
					id: this.id,
					code: this.code
				}
			})

			const updateCallBack = (message) => {
				switch(message.type) {
					case 'makeUpdateResp':
						if (this.updateInProcess) {
							this.resolvePromise({
								newUserProperties: message.data,
								messages: this.messages,
								error: message.error,
								time: new Date() - this.initialDate
							})
							this.messages.length = 0
							this.updateInProcess = false
						}
					break;
					default:
						console.info('Unespected message ', message.type);
					break;
				}
			}

			const initializeCallback = (message) => {
				if (message.type === 'initializeResp') {
					if (!message.error) {
						newChildProcess.removeListener('message', initializeCallback)
						newChildProcess.on('message', updateCallBack)
						resolve(newChildProcess)
					} else {
						// TODO try the operation again
					}
				}
			}
			newChildProcess.on('message', initializeCallback)

			newChildProcess.stdout.on('data', (data) => {
				this.messages.push(data)
			});
		})
	}
	deleteChildProcess() {
		if (this.getChildProcess()) {
			console.info('deleteChildProcess')
			this.getChildProcess().kill('SIGKILL')
		}
	}
}
