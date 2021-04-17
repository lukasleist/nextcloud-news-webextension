importScripts("functions.js");

function onAlarm(alarm) {
	console.log('Got alarm', alarm);
	update();
}

function scheduleAlarm() {
	const periodInMinutes = 10;
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

chrome.storage.local.onChanged.addListener(({url}) => {
	if(url) {
		//start login flow
		chrome.storage.local.remove("authorization", () => {
		
			function loginSuccess(authResponse) {
				console.log(authResponse);
				chrome.storage.local.set({
					authorization: "Basic " + btoa(authResponse.loginName + ":" + authResponse.appPassword)
				}, () => {
					console.log("Completed Login Flow Successfully")
					update();
				});
			}
			
			console.log(`Starting Login Flow:`);
	
			fetchApi(url.newValue + "/index.php/login/v2", "POST").then(response => {
				response.json().then(flowInformation => {
					let pollEndpoint = flowInformation.poll.endpoint;
					let body = {
						token: flowInformation.poll.token
					};
					
					chrome.tabs.create({
						url: flowInformation.login
					});
		
					function poll(r) {
						if(r.status == 404) {
							fetchApi(pollEndpoint, "POST", body).then(rr => {						
								setTimeout(_ => poll(rr), 1000);
							})
						} else {
							r.json().then(loginSuccess);
						}
						
					}
		
					poll({status: 404});
				});
			});
		});
	}
})
