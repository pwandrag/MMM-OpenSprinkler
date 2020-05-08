//MMM-OS-Utilities.js
//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------
function getClearTime(minFromMidnight) {
  
  var sd = new Date(0,0,0,0, minFromMidnight,0,0);
  var sh = sd.getHours();
  var sm = "0" + sd.getMinutes();
  var smf = sm.substring(sm.length-2);

  if (sh < 12) {
    return sh + ':' + smf + " AM";
  } else {
    return sh + ':' + smf + " PM";
  }
  
}
//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------
function getProgramRunning (psps, pppd, pnstations) {
  var i;
  i=0;
  for(i = 0; i < pnstations; i++) {
    //	return psps[i][0];
    switch (psps[i][0]) {
      case 0: //not here ignore
	break;
      case 254:
	return 'Run once';
      case 99:
	return 'On demand';
      default:
	//Log.info('pRun: ' + psps[i][0]);
	return pppd[psps[i][0]-1][5];
    }
  }
  return 'Idle';
}
//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------
function getStationStatus (stationopen, stationcodes) {
  var remaining = '';
  var statdetail = '';
  if (stationcodes[1] > 60) {
      var remaining = parseFloat(stationcodes[1]/60).toFixed(0) + 'm ' + parseFloat(stationcodes[1]%60).toFixed(0) + 's';
  } else if (stationcodes[1] == 0) {
      var remaining = '0m';
  } else {
    var remaining = '0m ' + stationcodes[1] + 's';
  }

  Log.info('OD-gSS: ' + stationopen + '-' + stationcodes[1] + '-' + remaining);

  var start = '';
  //var start = stationcodes[2];//come back
  if (stationopen == 1){//running <span id="on1")stationcodes[1]</span>
//    statdetail = 'On - <span id="on1")' + remaining + '</span>';
    statdetail = 'On - ' + remaining;
    //call countdown
  } else if (stationopen == 2) {//Station is closed or queued
    if (stationcodes[0]) {//program running so inqueue
      statdetail = 'Queued - ' + remaining;
    } else {
      statdetail = 'Off';
    }
  }
  return statdetail;
}
//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

