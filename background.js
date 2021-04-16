function onAlarm(alarm) {
	console.log('Got alarm', alarm);
	update();
}

function scheduleAlarm() {
	let periodInMinutes = 2;
	chrome.alarms.create('refresh', {periodInMinutes: periodInMinutes});
	console.log(`Scheduled refresh to run every ${periodInMinutes} minutes`);
}

function init() {
	chrome.runtime.onInstalled.addListener(scheduleAlarm);
	chrome.runtime.onStartup.addListener(() => {
		onAlarm();
		scheduleAlarm();
	});
	chrome.alarms.onAlarm.addListener(onAlarm);
}

init();