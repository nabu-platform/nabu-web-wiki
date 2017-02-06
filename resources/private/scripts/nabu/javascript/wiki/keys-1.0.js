if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.constants) { nabu.constants = {}; }
if (!nabu.services) { nabu.services = {}; }

nabu.constants.keys = {
	MOUSE_LEFT: 1,
	MOUSE_MIDDLE: 2,
	MOUSE_RIGHT: 3,
	CTRL: 17,
	SHIFT: 16,
	ALT: 18,
	A: 65,
	B: 66,
	C: 67,
	E: 69,
	I: 73,
	L: 76,
	P: 80,
	Q: 81,
	S: 83,
	T: 84,
	U: 85,
	ESC: 27,
	Z: 122,
	UP: 38,
	DOWN: 40,
	F2: 113,
	ENTER: 13,
	TAB: 9,
	DELETE: 46,
	NUM_1: 49,
	NUM_2: 50,
	NUM_3: 51,
	NUM_4: 52,
	NUM_5: 53,
	NUM_6: 54,
	NUM_7: 55,
	EXCLAMATION: 56,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123
};

nabu.services.KeyListener = function() {
	var self = this;
	// contains keys that are currently active
	this.active = [];
	// contains key listeners that trigger when a key is activated
	this.listeners = [];
	// contains key listeners that trigger when a key is deactivated
	this.unlisteners = [];
	// constants that should be monitored
	this.controls = [nabu.constants.keys.SHIFT, nabu.constants.keys.CTRL, nabu.constants.keys.ALT];

	this.isActive = function(key) {
		return self.active.indexOf(key) >= 0;
	};
	this.listen = function(handler) {
		var keys = [];
		for (var i = 1; i < arguments.length; i++) {
			keys.push(arguments[i]);
		}
		self.listeners.push({
			handler: handler,
			keys: keys
		});
	};
	this.unlisten = function(unlistener) {
		var keys = [];
		for (var i = 1; i < arguments.length; i++) {
			keys.push(arguments[i]);
		}
		self.unlisteners.push({
			handler: handler,
			keys: keys
		});
	};
	this.deactivateAll = function() {
		self.active.splice(0, self.active.length);
	};
	this.deactivate = function(key, event) {
		var index = self.active.indexOf(key);
		if (index >= 0) {
			self.active.splice(index, 1);
			for (var i = 0; i < self.unlisteners.length; i++) {
				var active = 0;
				var inactive = 0;
				var found = false;
				for (var j = 0; j < self.unlisteners[i].keys.length; j++) {
					if (self.isActive(self.unlisteners[i].keys[j])) {
						active++;
					}
					else {
						inactive++;
						found |= key == self.unlisteners[i].keys[j];
					}
				}
				// if the key combination contains the key that was released and it is the first key to be released in the combination, trigger the handler
				if (found && inactive == 1 && self.active.length == self.unlisteners[i].keys.length - 1) {
					self.unlisteners[i].handler(event);
				}
			}
		}
	};
	this.activate = function(key, event) {
		var index = self.active.indexOf(key);
		if (index < 0) {
			self.active.push(key);
			for (var i = 0; i < self.listeners.length; i++) {
				var active = 0;
				var inactive = 0;
				var found = false;
				for (var j = 0; j < self.listeners[i].keys.length; j++) {
					if (self.isActive(self.listeners[i].keys[j])) {
						active++;
						found |= key == self.listeners[i].keys[j];
					}
					else {
						inactive++;
					}
				}
				// if the key combination contains the key that was activated and there are no inactive keys left, trigger the handler
				if (found && inactive == 0 && self.active.length == self.listeners[i].keys.length) {
					self.listeners[i].handler(event);
				}
			}
		}
	}

	// listen to key events
	document.addEventListener("keydown",
		function(event) {
			self.activate(event.which, event);
		},
		false
	);
	document.addEventListener("keyup",
		function(event) {
			self.deactivate(event.which, event);
		},
		false
	);

	// disable keys when focus of the document/window is lost, for example alt+tab out of a window might leave alt enabled
	// firefox will disable when the document comes back into focus
	document.addEventListener("focus", this.deactivateAll, false);
	// chrome will disable when the window comes back into focus
	window.addEventListener("focus", this.deactivateAll, false);
};
