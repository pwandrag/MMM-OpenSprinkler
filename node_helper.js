'use strict';

/* Magic Mirror
 * Module: MMM-OpenSprinkler
 *
 * Originally By Adrian Chrysanthou
 * Updated by John Cohron
 * Updates by Paul Wandrag
 * 	- Switched to node-fetch library
 * MIT Licensed.
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const NodeHelper = require('node_helper');
const moment = require('moment');

module.exports = NodeHelper.create({

	start: function() {
		this.started = false;
		this.config = null;
	},

	getData: async function() {
		var self = this;
		var myUrl = this.config.apiBase + this.config.apiKey + this.config.apiQuery;
		
		try {
			const response = await fetch(myUrl);
			const body = await response.text();
			self.sendSocketNotification("DATA", body);
		} catch (error) {
			console.error("Fetching data failed:", error);
		}

		setTimeout(function() { self.getData(); }, this.config.refreshInterval);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;
		if (notification === 'CONFIG' && self.started == false) {
			self.config = payload;
			self.sendSocketNotification("STARTED", true);
			self.getData();
			self.started = true;
		}
	}
});
