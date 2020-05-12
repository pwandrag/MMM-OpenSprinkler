/* Magic Mirror
 * Module: MMM-OpenSprinkler
 *
 * Originally By Adrian Chrysanthou
 * Updated by John Cohron
 * MIT Licensed.
 */
Module.register('MMM-OpenSprinkler', {
	defaults: {
		units: config.units,
		animationSpeed: 1000,
		refreshInterval: 1000 * 60, //refresh every minute
		updateInterval: 1000 * 3600, //update every hour
		lang: config.language,
		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,
		imperial: true,
		batteryDanger: 30,
		batteryWarning: 50,
		osName: 'Sprinklers',
		osIP: 'demo.opensprinkler.com',
		osPassword: 'opendoor',
//		items: [ 'sun', 'raindelay', 'waterlevel', 'programrunning', 'sn', 'stationlist'],
//		items: [ 'sun'],
		items: [ 'sun', 'raindelay', 'waterlevel', 'programrunning', 'sn'],
	},
	// Define required scripts.
	getScripts: function() {
		return [
			'MMM-OS-Utilities.js',
			'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/core.js',
			'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/md5.js',
			];
	},
	getStyles: function() {
		return [
			'https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css',
			'MMM-OpenSprinkler.css'
			];
	},
	start: function() {
		Log.info('Starting OS module: ' + this.name);
		this.loaded = false;
		this.config.apiBase = 'http://' + this.config.osIP + '/ja?pw=';
		this.config.apiKey = CryptoJS.MD5(this.config.osPassword).toString();//opendoor hash: a6d82bced638de3def1e9bbb4983225c
		this.config.apiQuery = '&sid=0&en=1&t=600';
		this.sendSocketNotification('CONFIG', this.config);
	},
	getDom: function() {

		var wrapper = document.createElement("div");
		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		if (!this.data) {
			wrapper.innerHTML = "No data";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		var t = this.data;
		var content = document.createElement("div");

//----------------------------------------------------------------------------------------
//Start main page
//----------------------------------------------------------------------------------------
		content.innerHTML = "";
		var table = `<h2 class="mqtt-title"><span class="zmdi zmdi-landscape zmdi-hc-1x icon"></span> ${this.config.osName}`;

		if (t.settings.rd) {
			var d = new Date(t.settings.rdst * 1000);
			table += ` Rain delay until ${moment(d).calendar()}`;
		}

		table += `</h2>
		<table class="small">
		`;

		for(field in this.config.items) {
		//Log.info('OS-PRJ: ' + this.config.items[field]);
		switch (this.config.items[field]) {
			case 'sun':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Sunrise / Sunset</td>
				      <td class="value">${getClearTime(t.settings.sunrise)} / ${getClearTime(t.settings.sunset)}</td>
				   </tr>
				`;
			break;
			case 'raindelay':
				if(!t.settings.rd) { break; }
				var d = new Date(t.settings.rdst * 1000);
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Rain Delay</td>
				      <td class="value">${d.toLocaleString()}</td>
				   </tr>
				`;
			break;

			case 'waterlevel':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Water Level</td>
				      <td class="value">${t.options.wl}%</td>
				   </tr>
				`;
			break;

			case 'nstation':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Stations</td>
				      <td class="value">${t.status.nstations}</td>
				   </tr>
				`;
			break;
			case 'programrunning':
				var progrun = "";
				progrun = getProgramRunning(t.settings.ps,t.programs.pd, t.status.nstations);
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Program Running</td>
				      <td class="value">${progrun}</td>
				   </tr>
				`;
			break;
			
			case 'sn':
				// find if any program running including station on demand and run-once program
				// show all stations open (on)
				var i;
				for(i = 0; i < t.status.nstations; i++) {
					var ssn;
					ssn = t.status.sn[i];
					if(ssn) {
						table += `
							<tr>
							<td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
							<td class="field">${(i+1)} - ${t.stations.snames[i]}</td>
							<td class="value">${getStationStatus(ssn, t.settings.ps[i])}</td>
							</tr>
						`;
					}
				}
				// show all stations in queue (program running)
				i=0;
				for(i = 0; i < t.status.nstations; i++) {
					var ssn;
					ssn = t.status.sn[i];
					//check if in queue
					if (!ssn && t.settings.ps[i][0]) {ssn = 2;}
					if(ssn==2) {
						table += `
							<tr>
							<td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
							<td class="field">${(i+1)} - ${t.stations.snames[i]}</td>
							<td class="value">${getStationStatus(ssn, t.settings.ps[i])}</td>
							</tr>
						`;
					}
				}
			break;
			
			case 'programlist':
				var i;
				for(i = 0; i < t.programs.nprogs; i++) {
					table += `
						<tr>
						<td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
						<td class="field">${(i+1)} - ${t.programs.pd[i][5]}</td>
						<td class="value">${t.programs.pd[i][0]}</td>
						</tr>
					`;
				}
			break;
			
			case 'stationlist':
				var i;
				for(i = 0; i < t.status.nstations; i++) {
						table += `
							<tr>
							<td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
							<td class="field">${(i+1)} - ${t.stations.snames[i]}</td>
							<td class="value">${getStationStatus(t.status.sn[i], t.settings.ps[i])}</td>
							</tr>
						`;
				}
			break;

		} // switch

		} // end foreach loop of items

		table += "</table>";

		wrapper.innerHTML = table;
		wrapper.className = "light small";
		wrapper.appendChild(content);
		
		return wrapper;
	},
	socketNotificationReceived: function(notification, payload) {
		if (notification === "STARTED") {
			this.updateDom();
		} else if (notification === "DATA") {
			this.loaded = true;
			this.tFi(JSON.parse(payload));
			this.updateDom();
		}
	},
	// tFi(data)
	// Uses the received data to set the various values.
	//argument data object - info from opensprinkler.com
	tFi: function(data) {
		if (!data) {
			// Did not receive usable new data.
			return;
		}
		this.data = data;
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	}
});
