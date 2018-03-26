var loadingAnimation = new LoadingAnimation();

// A "loading" animation displayed while we wait for the first response from
// ownCloud. This animates the badge text with a dot that cycles from left to
// right.
function LoadingAnimation() {
	this.timerId_ = 0;
	this.maxCount_ = 8;  // Total number of states in animation
	this.current_ = 0;  // Current state
	this.maxDot_ = 4;  // Max number of dots in animation
}

LoadingAnimation.prototype.paintFrame = function() {
	var text = "";
	for (var i = 0; i < this.maxDot_; i++) {
		text += (i == this.current_) ? "." : " ";
	}
	if (this.current_ >= this.maxDot_)
		text += "";

	chrome.browserAction.setBadgeText({text:text});
	this.current_++;
	if (this.current_ == this.maxCount_)
		this.current_ = 0;
}

LoadingAnimation.prototype.start = function() {
	if (this.timerId_)
		return;

	var self = this;
	this.timerId_ = window.setInterval(function() {
		self.paintFrame();
	}, 100);
}

LoadingAnimation.prototype.stop = function() {
	if (!this.timerId_)
		return;

	window.clearInterval(this.timerId_);
	this.timerId_ = 0;
}

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