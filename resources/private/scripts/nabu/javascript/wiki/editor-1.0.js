if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.services) { nabu.services = {}; }

nabu.services.Editor = function(element) {
	var self = this;
	this.element = element;
	this.active = null;
	this.keyListener = null;
	this.onpaste = null;

	this.select = function(element) {
		if (self.isEditable(element)) {
			this.deselect();
			self.active = element;
			self.active.classList.add("active");
			self.active.focus();
		}
	};

	this.edit = function() {
		if (self.active != null && !self.editing()) {
			self.active.classList.add("editing");
			self.active.contentEditable = true;
			self.active.focus();
		}
	};

	this.editing = function() {
		return self.active != null && self.active.contentEditable == "true";
	};

	this.unedit = function() {
		if (self.editing()) {
			self.extractImages();
			self.active.classList.remove("editing");
			self.active.contentEditable = false;
			self.active.removeAttribute("contentEditable");
		}
	};

	this.deselect = function() {
		if (self.active != null) {
			self.unedit();
			self.active.classList.remove("active");
			self.active = null;
		}
	};

	this.addBlockQuoteHandler = function() {
		var blockquotes = $("editor").getElementsByTagName("blockquote");
		for (i = 0; i < blockquotes.length; i++) {
			blockquotes[i].addEventListener("mousedown", function(event) {
				if (event.which == keys.MOUSE_RIGHT) {
					// TODO: show right click menu
					event.preventDefault();
					event.stopPropagation();
				}
			}, false);
		}
	};

	// extracts images from elements
	this.extractImages = function() {
		if (self.active != null) {
			for (var i = 0; i < self.active.childNodes.length; i++) {
				if (self.active.childNodes[i].nodeType === 1) {
					if (self.active.childNodes[i].tagName.toLowerCase() == "img") {
						var insertBefore = nabu.utils.elements.next(self.active);
						if (insertBefore == null) {
							self.active.parentNode.appendChild(self.active.childNodes[i]);
						}
						else {
							self.active.parentNode.insertBefore(self.active.childNodes[i], insertBefore);
						}
					}
				}
			}
		}
	};

	this.remove = function() {
		if (self.active != null) {
			self.active.parentNode.removeChild(self.active);
			self.active = null;
			self.initialize();
		}
	};

	this.wrap = function(into) {
		if (self.active != null) {
			var isEditing = self.editing();
			if (isEditing) {
				self.unedit();
			}
			var newElement = document.createElement(into);
			var current = self.active;
			self.active.parentNode.replaceChild(newElement, self.active);
			newElement.appendChild(current);
			self.select(newElement);
			if (isEditing) {
				self.edit();
			}
		}
	};

	this.transform = function(into) {
		if (self.active != null) {
			var isEditing = self.editing();
			if (isEditing) {
				self.unedit();
			}
			var newElement = document.createElement(into);
			newElement.innerHTML = self.active.innerHTML;
			self.active.parentNode.replaceChild(newElement, self.active);
			self.active = null;
			self.select(newElement);
			if (isEditing) {
				self.edit();
			}
		}
	};

	this.isEditable = function(element) {
		while (element) {
			if (element.nodeName.toLowerCase() == "section") {
				return false;
			}
			element = element.parentNode;
		}
		return true;
	};

	this.element.addEventListener("paste", function(event) {
		var clipboard = event.clipboardData;
		// in firefox the image is actually pasted as html, not image/png or something
		// most of the time firefox just embeds the image, hence the extractImages method...
		// not sure if this first if is actually ever triggered, perhaps if you copy from word or something?
		if (clipboard.types && clipboard.types[0] == "text/html" && clipboard.getData) {
			var data = clipboard.getData("text/html");
			// only treat images this way
			if (data.indexOf("<img") >= 0) {
				var center = document.createElement("center");
				center.innerHTML = data;
				self.element.appendChild(center);
				event.stopPropagation();
				event.preventDefault();
			}
		}
		// webkit
		if (clipboard.items && clipboard.items[0].kind === 'file' && (clipboard.items[0].type === 'image/png' || clipboard.items[0].type === 'image/jpg' || clipboard.items[0].type === 'image/gif')) {
			var data = clipboard.items[0].getAsFile();
			var reader = new FileReader;
			reader.onloadend = function() {
				if (self.active) {
					var image = document.createElement("img");
					image.setAttribute("src", reader.result);
					image.setAttribute("alt", data.name);
					var next = nabu.utils.elements.next(self.active);
					if (next) {
						self.active.parentNode.insertBefore(image, next);
					}
					else {
						self.active.parentNode.appendChild(image);
					}
				}
			};
			reader.readAsDataURL(data);
			event.stopPropagation();
			event.preventDefault();
		}
	}, false);

	this.initialize = function() {
		if (!self.element.classList.contains("editor")) {
			self.element.classList.add("editor");
		}
		if (self.active == null) {
			var first = nabu.utils.elements.first(self.element);
			if (first == null) {
				first = document.createElement("<p>Empty text</p>");
				self.element.appendChild(first);
			}
			self.select(first);
		}
		if (self.keyListener == null) {
			element.addEventListener("mousedown", function(event) {
				if (!self.editing() && event.target != self.element) {
					console.log("EDITING", self.active, self.editing());
					self.select(event.target);
					event.preventDefault();
					event.stopPropagation();
				}
			});

			self.keyListener = new nabu.services.KeyListener();
			self.keyListener.listen(function() {
				if (!self.editing()) {
					self.edit();
				}
			}, nabu.constants.keys.F2);
			self.keyListener.listen(function(event) {
				if (!self.editing()) {
					self.remove();
				}
			}, nabu.constants.keys.DELETE);

			// add a paragraph
			self.keyListener.listen(function(event) {
				var paragraph = document.createElement("p");
				// if we have an active element, add after that
				if (self.active != null) {
					var next = nabu.utils.elements.next(self.active);
					if (next) {
						self.active.parentNode.insertBefore(paragraph, next);
					}
					else {
						self.active.parentNode.appendChild(paragraph);
					}
				}
				else {
					self.element.appendChild(paragraph);
				}
				self.select(paragraph);
				self.edit();
				event.preventDefault();
			}, nabu.constants.keys.CTRL, nabu.constants.keys.ENTER);

			// stop editing
			self.keyListener.listen(function(event) {
				self.unedit();
				event.stopPropagation();
				event.preventDefault();
			}, nabu.constants.keys.ALT, nabu.constants.keys.ENTER);

			// start editing
			self.keyListener.listen(function() {
				if (self.active != null && !self.editing()) {
					self.edit();
				}
			}, nabu.constants.keys.ENTER);

			// select next
			self.keyListener.listen(function(event) {
				if (!self.editing()) {
					event.preventDefault();
					if (self.active == null) {
						self.initialize();
					}
					else {
						var next = nabu.utils.elements.next(self.active);
						if (next) {
							self.select(next);
						}
					}
				}
			}, nabu.constants.keys.DOWN);

			// move down
			self.keyListener.listen(function(event) {
				if (!self.editing()) {
					event.preventDefault();
					if (self.active != null) {
						var next = nabu.utils.elements.next(self.active);
						if (next) {
							self.active.parentNode.insertBefore(next, self.active);
						}
					}
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.DOWN);

			// select previous
			self.keyListener.listen(function(event) {
				if (!self.editing()) {
					event.preventDefault();
					if (self.active == null) {
						self.initialize();
					}
					else {
						var previous = nabu.utils.elements.previous(self.active);
						if (previous) {
							self.select(previous);
						}
					}
				}
			}, nabu.constants.keys.UP);

			// move up
			self.keyListener.listen(function(event) {
				if (!self.editing()) {
					event.preventDefault();
					if (self.active != null) {
						var previous = nabu.utils.elements.previous(self.active);
						if (previous) {
							self.active.parentNode.insertBefore(self.active, previous);
						}
					}
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.UP);

			// deselect
			self.keyListener.listen(function(event) {
				if (self.editing()) {
					self.unedit();
				}
				else {
					self.deselect();
				}
			}, nabu.constants.keys.ESC);

			// make table
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("insertHTML", null, "<div><table cellspacing='0' cellpadding='0'><tr><td>" + window.getSelection() + "</td></tr></table></div>");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.T);

			// make em
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("insertHTML", null, "<em>" + window.getSelection() + "</em>");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.A);

			// make paragraph
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("p");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.P);

			// make h1
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h1");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_1);

			// make h2
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h2");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_2);

			// make h3
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h3");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_3);

			// make h4
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h4");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_4);

			// make h5
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h5");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_5);

			// make h6
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h6");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_6);

			// make h7
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("h7");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.NUM_7);

			// tab
			self.keyListener.listen(function(event) {
				if (self.editing() && self.active.tagName.toLowerCase() != "table") {
					event.preventDefault();
					event.stopPropagation();
					if (self.active.tagName.toLowerCase() == "ul" || self.active.tagName.toLowerCase() == "li") {
						if (self.keyListener.isActive(nabu.constants.keys.SHIFT)) {
							document.execCommand("outdent", false, null);
						}
						else {
							document.execCommand("indent", false, null);
						}
					}
					else {
						document.execCommand("insertHTML", false, "\t");
					}
				}
			}, nabu.constants.keys.TAB);

			// untab
			self.keyListener.listen(function(event) {
				if (self.editing() && self.active.tagName.toLowerCase() != "table") {
					event.preventDefault();
					event.stopPropagation();
					if (self.active.tagName.toLowerCase() == "ul" || self.active.tagName.toLowerCase() == "li") {
						if (self.keyListener.isActive(nabu.constants.keys.SHIFT)) {
							document.execCommand("outdent", false, null);
						}
					}
				}
			}, nabu.constants.keys.SHIFT, nabu.constants.keys.TAB);

			// make blockquote
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("blockquote");
					// TODO: add right click menu for type
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.C);

			// make list
			self.keyListener.listen(function(event) {
				if (self.active != null) {
					event.preventDefault();
					event.stopPropagation();
					self.transform("li");
					self.wrap("ul");
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.U);

			// make link
			self.keyListener.listen(function(event) {
				if (self.editing()) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("unlink", false, null);
					var link = prompt("Link");
					if (link) {
						if (link.startsWith("/")) {
							document.execCommand("insertHTML", false, "[" + document.getSelection() + "|$" + link + "]")
						}
						else {
							document.execCommand("createLink", false, link);
						}
					}
				}
			}, nabu.constants.keys.ALT, nabu.constants.keys.L);

			// make bold
			self.keyListener.listen(function(event) {
				if (self.editing()) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("bold", false, null);
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.B);

			// make italic
			self.keyListener.listen(function(event) {
				if (self.editing()) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("italic", false, null);
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.I);

			// make underline
			self.keyListener.listen(function(event) {
				if (self.editing()) {
					event.preventDefault();
					event.stopPropagation();
					document.execCommand("underline", false, null);
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.U);
		}
	};

	this.initialize();
};
