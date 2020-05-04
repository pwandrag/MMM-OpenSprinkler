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
		apiBase: 'http://demo.opensprinkler.com/ja?pw=',
		apiKey: 'a6d82bced638de3def1e9bbb4983225c', //md5hashed opendoor
		apiQuery: '&sid=0&en=1&t=600',
		items: [ 'sun', 'raindelay', 'waterlevel', 'programrunning', 'sn', 'programlist', 'programstatus' ],
	},
	// Define required scripts.
	getScripts: function() {
		return [
			'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js',
			'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js',
			'moment.js'
			];
	},
	getStyles: function() {
		return [
			'https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css',
			'MMM-OpenSprinkler.css'
			];
	},
	start: function() {
		Log.info('Starting module: ' + this.name);
		this.loaded = false;
		this.sendSocketNotification('CONFIG', this.config);
	},
	getDom: function() {
		var wrapper = document.createElement("div");
		if (!this.loaded) {
			wrapper.innerHTML = this.translate('LOADING');
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		if (this.config.apiKey === "") {
			wrapper.innerHTML = "No Tesla Fi <i>apiKey</i> set in config file.";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		if (this.config.googleApiKey === "") {
			wrapper.innerHTML = "No Google <i>api Key</i> set in config file.";
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

		const getProgramRunning = function(psps, pppd, pnstations) {
			var i;
			i=0;
			for(i = 0; i < pnstations; i++) {
//				return psps[i][0];
				switch (psps[i][0]) {
					case 0: //not here ignore
						break;
					case 254:
						return 'Run once';
					case 99:
						return 'On demand';
					default:
					
						//return 'index here';
						//return psps[i][0];
						//return pppd[0][5];
						return pppd[psps[i][0]][5];
				}
			}
			return 'Idle';
		}

		const getBatteryLevelClass = function(bl, warn, danger) {
			if (bl < danger) {
				return 'danger';
			}
			if (bl < warn) {
				return 'warning';
			}
			if (bl >= warn) {
				return 'ok';
			}
		}

		var curstat = ["", "On", "In Queue"];
		content.innerHTML = "";
		var table = `<h2 class="mqtt-title"><span class="zmdi zmdi-landscape zmdi-hc-1x icon"></span> Sprinklers`;

		if (t.settings.rd) {

				var d = new Date(t.settings.rdst * 1000);

				table += ` Rain delay until ${moment(d).calendar()}`;
		}

		
		
		table += `</h2>
		<table class="small">
		`;

		for(field in this.config.items) {

		switch (this.config.items[field]) {
			case 'sun':
				var srd = new Date(0,0,0,0, t.settings.sunrise,0,0);
				var srh = srd.getHours();
				var srm = "0" + srd.getMinutes();
				var srmf = srm.substring(srm.length-2);

				var ssd = new Date(0,0,0,0, t.settings.sunset,0,0);
				var ssh = (ssd.getHours() - 12);
				var ssm = "0" + ssd.getMinutes();
				var ssmf = ssm.substring(ssm.length-2);
				
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Sunrise / Sunset</td>
				      <td class="value">${srh}:${srmf} AM / ${ssh}:${ssmf} PM</td>
				   </tr>
				`;
			break;
			case 'raindelay':
				if(!t.settings.rd) { break; }
				var d = new Date(t.settings.rdst * 1000);
				
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Rain Delay: </td>
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
							<td class="value">${curstat[ssn]}</td>
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
							<td class="value">${curstat[ssn]}</td>
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
							<td class="value">${curstat[t.status.sn[i]]}</td>
							</tr>
						`;
				}
			break;

			case 'battery':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-battery zmdi-hc-fw"></span></td>
				      <td class="field">Battery</td>
				      <td class="value">
				         <span class="battery-level-${getBatteryLevelClass(t.usable_battery_level, this.config.batteryWarning, this.config.batteryDanger)}">${t.usable_battery_level}%</span>
                                         /
                                         <span class="battery-level-${getBatteryLevelClass(t.charge_limit_soc, this.config.batteryWarning, this.config.batteryDanger)}">${t.charge_limit_soc}%</span>
				      </td>
				   </tr>
				`;
			break;

			case 'batteryex':

				if(t.charging_state!="Disconnected") {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-input-power zmdi-hc-fw"></span></td>
				      <td class="field">Connected</td>
				      <td class="value">${t.charging_state}</td>
				   </tr>
				`;

				} else {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-battery zmdi-hc-fw"></span></td>
				      <td class="field"><span class="battery-level-${getBatteryLevelClass(t.usable_battery_level, this.config.batteryWarning, this.config.batteryDanger)}">Disconnected</span></td>
				      <td class="value">
							${parseFloat(t.est_battery_range).toFixed(0)}&nbsp;miles&nbsp;
				         <span class="battery-level-${getBatteryLevelClass(t.usable_battery_level, this.config.batteryWarning, this.config.batteryDanger)}">${t.usable_battery_level}%</span>
                                         /
                                         <span class="battery-level-${getBatteryLevelClass(t.charge_limit_soc, this.config.batteryWarning, this.config.batteryDanger)}">${t.charge_limit_soc}%</span>
				      </td>
				   </tr>
				`;
			}
			break;

			case 'range':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Range</td>
				      <td class="value">${t.ideal_battery_range} miles</td>
				   </tr>
				`;
			break;

			case 'range-estimated':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-gas-station zmdi-hc-fw"></span></td>
				      <td class="field">Range</td>
				      <td class="value">${t.est_battery_range} miles (estimated)</td>
				   </tr>
				`;
			break;

			case 'charge-time':
				if(!t.charging_state || t.time_to_full_charge==0) { break; }

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-battery-flash zmdi-hc-fw"></span></td>
				      <td class="field">Charging</td>
				      <td class="value">${moment().add(t.time_to_full_charge, "hours").fromNow()}</td>
				   </tr>
				`;
			break;

			case 'charge-added':
				if(t.charging_state=="Disconnected") { break; }

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-flash zmdi-hc-fw"></span></td>
				      <td class="field">Charge Added</td>
				      <td class="value">${t.charge_energy_added} kWh</td>
				   </tr>
				`;

			break;

			case 'locked':
				if(t.locked) {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-lock-outline zmdi-hc-fw"></span></td>
				      <td class="field" colspan="2">Locked</td>
				   </tr>
				`;

				} else {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-lock-open zmdi-hc-fw"></span></td>
				      <td class="field" colspan="2">Unlocked</td>
				   </tr>
				`;

				}
			break;

			case 'odometer':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-globe zmdi-hc-fw"></span></td>
				      <td class="field">Odometer</td>
				      <td class="value">${parseFloat(t.odometer).toFixed(1)} miles</td>
				   </tr>
				`;
			break;

			case 'temperature':
				if(!t.outside_temp || !t.inside_temp) { break; }

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-sun zmdi-hc-fw"></span></td>
				      <td class="field">Temperature</td>
				      <td class="value">${t.outside_temp}&deg;C / ${t.inside_temp}&deg;C</td>
				   </tr>
				`;
			break;

			case 'power-connected':
				if(t.charging_state!="Disconnected") {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-input-power zmdi-hc-fw"></span></td>
				      <td class="field">Connected</td>
				      <td class="value">${t.charging_state}</td>
				   </tr>
				`;

				} else {

				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-input-power zmdi-hc-fw"></span></td>
				      <td class="field" colspan="2">Disconnected</td>
				   </tr>
				`;

				}
			break;

			case 'data-time':
				table += `
				   <tr>
				      <td class="icon"><span class="zmdi zmdi-time zmdi-hc-fw"></span></td>
				      <td class="field" colspan="2">${moment(t.Date).fromNow()}</td>
				   </tr>
				`;
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
	//argument data object - info from teslfi.com
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
