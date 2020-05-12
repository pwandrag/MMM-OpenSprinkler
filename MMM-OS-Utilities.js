//MMM-OS-Utilities.js

//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------

function secondsCountdownOld(futureSeconds) {
  //var myVar = setInterval(myTimer(), 1000);
  //var content = document.createElement("div");
  
  // document.getElementById("sn1").innerHTML = "here";
  return;
}
function myTimer(){
  var d = new Date();
  document.getElementById("sn1").innerHTML = "here";
  //d.toLocaleTimeString();
}

function secondsCountdown(pid, futureSeconds) {
  // Set the date we're counting down to
  //var countDownDate = new Date("May 6, 2020 17:00:00").getTime();
  var countDownDate = new Date().getTime();
  countDownDate.setSeconds(countDownDate.getSeconds() + 75);

  // Update the count down every 1 second
  var x = setInterval(function() {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate - now;
    //Log.info('OD-cd: ' + distance);

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Output the result in an element with id="demo"
    if (days) {
      document.getElementById("sn1").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
    } else if (hours) {
      document.getElementById("sn1").innerHTML = hours + "h " + minutes + "m " + seconds + "s ";
    } else if (minutes) {
      document.getElementById("sn1").innerHTML = minutes + "m " + seconds + "s ";
    } else {
      document.getElementById("sn1").innerHTML = seconds + "s ";
    }

    // If the count down is over, write some text 
    if (distance < 0) {
      clearInterval(x);
      document.getElementById(pid).innerHTML = "EXPIRED";
    }
  }, 1000);

  
}
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
    return sh-12 + ':' + smf + " PM";
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

