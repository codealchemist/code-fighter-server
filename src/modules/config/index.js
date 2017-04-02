var config = require('./' + (process.env.CONFIGURATION || 'dev'))

var _configManager

if(!_configManager) {
	_configManager = generateConfigSingleton()
}

function generateConfigSingleton() {
	return {
		get() {
			return JSON.parse(JSON.stringify(config))
		}
	}
}

module.exports = _configManager