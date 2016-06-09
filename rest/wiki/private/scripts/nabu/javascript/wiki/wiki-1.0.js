if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

nabu.components.wiki = {
	Page: Vue.component("n-wiki-page", {
		props: ["path", "wikiPath", "edit"],
		template: "<div class='n-wiki-page'></div>",
		data: function() {
			return {
				article: null,
				fullPath: null
			};
		},
		activate: function(done) {
			var self = this;
			var type = this.edit ? "application/vnd-nabu-ehtml" : "text/html";
			this.fullPath = (this.wikiPath ? this.wikiPath.replace(/[\/]+$/, "") + "/wiki" : "wiki").replace(/[\/]+$/, "");
			nabu.utils.ajax({
				url: this.fullPath + "/item/" + this.path.replace(/^[\/]+/, "") + "?type=" + type,
				success: function(response) {
					self.article = response.responseText;
					done();
				}
			});
		},
		ready: function() {
			var self = this;
			this.$el.innerHTML = this.article;
			this.keyListener = new nabu.services.KeyListener();
			if (!this.edit) {
				this.addAnchors();
			}
			else {
				this.editor = new nabu.services.Editor(this.$el);
			}
			// key listener for "save"
			this.keyListener.listen(function(event) {
				if (self.edit) {
					event.preventDefault();
					event.stopPropagation();
					self.save();
				}
			}, nabu.constants.keys.CTRL, nabu.constants.keys.S);
			// key listener to toggle edit mode
			this.keyListener.listen(function(event) {
				event.preventDefault();
				event.stopPropagation();
				self.toggleEdit();
			}, nabu.constants.keys.CTRL, nabu.constants.keys.E);
		},
		methods: {
			toggleEdit: function() {
				var self = this;
				if (self.edit) {
					self.editor.unedit();
					nabu.utils.ajax({
						url: self.fullPath + "/item/" + self.path + "?type=text/html",
						success: function(response) {
							nabu.utils.elements.clear(self.$el);
							self.$el.innerHTML = response.responseText;
							self.edit = false;
							self.addAnchors();
						}
					});
				}
				else {
					nabu.utils.ajax({
						url: self.fullPath + "/item/" + self.path + "?type=application/vnd-nabu-ehtml",
						success: function(response) {
							nabu.utils.elements.clear(self.$el);
							self.$el.innerHTML = response.responseText;
							self.edit = true;
							self.editor = new nabu.services.Editor(self.$el);
						}
					});
				}
			},
			addAnchors: function() {
				for (var i = this.$el.childNodes.length - 1; i >= 0; i--) {
					var childNode = this.$el.childNodes[i];
					if (childNode.nodeName.toLowerCase().startsWith("h")) {
						var anchor = document.createElement("a");
						anchor.setAttribute("name", childNode.innerHTML.replace(/[\s]+/g, "_").replace(/[^\w_]+/g, ""));
						this.$el.insertBefore(anchor, childNode);
					}
				}
			},
			save: function() {
				// TODO: extract any images and store them first, then store page
				if (this.edit) {
					// this will (amongst other things) postprocess images
					this.editor.unedit();
					var self = this;
					var promises = [];
					var images = this.$el.getElementsByTagName("img");
					for (var i = 0; i < images.length; i++) {
						var src = images[i].getAttribute("src");
						var uploading = false;
						if (src.startsWith("data:")) {
							var contentType = src.replace(/^data:([^;]+);.*/, "$1");
							var content = src.replace(/^[^;]+;(.*)/, "$1");
							if (content.startsWith("base64,")) {
 								content = atob(content.substring("base64,".length));
								uploading = true;
								var index = i;
								promises.push(nabu.utils.ajax({
									method: "POST",
									url: this.fullPath + "/store",
									contentType: contentType,
									data: content,
									success: function(response) {
										var json = JSON.parse(response.responseText);
										var p = self.$el.ownerDocument.createElement("p");
										p.innerHTML = "[:" + json.uri + "]";
										images[index].parentNode.replaceChild(p, images[index]);
									}
								}));
							}
						}
						if (!uploading) {
							images[i].parentNode.removeChild(images[i]);
						}
					}
					nabu.utils.when(promises)
						.success(function() {
							nabu.utils.ajax({
								method: "PUT",
								url: self.fullPath.replace(/[\/]+$/, "") + "/item/" + self.path.replace(/^[\/]+/, ""),
								contentType: "application/vnd-nabu-ehtml",
								data: self.$el.innerHTML,
								success: function(response) {
									self.$emit("save.success");
								},
								error: function(response) {
									self.$emit("save.error");
								}
							});
						})
						.error(function(responses) {
							console.log("Failed image saves", responses);
							self.$emit("save.error");
						});
				}
			}
		}
	}),
	Directory: function(path, wikiPath) {
		var self = this;
		this.fullPath = wikiPath ? wikiPath.replace(/[\/]+$/, "") + "/wiki" : "wiki";
		this.path = path ? path : "/";

		this.delete = function(name, handler) {
			return nabu.utils.ajax({
				method: "DELETE",
				url: self.fullPath + "/item/" + self.path,
				success: handler
			});
		};

		this.mkdir = function(name, handler) {
			return nabu.utils.ajax({
				method: "PUT",
				url: self.fullPath + "/item/" + self.path + "?type=application/directory",
				success: handler
			});
		};

		this.touch = function(name, handler, contentType) {
			return nabu.utils.ajax({
				method: "PUT",
				url: self.fullPath + "/item/" + self.path + (contentType ? "?type=" + contentType : ""),
				success: handler
			});
		};
		this.toc = function(name, handler) {
			var tocPath = self.path.replace(/[\/]+$/, "").replace(/^[\/]+/, "");
			return nabu.utils.ajax({
				method: "GET",
				url: self.fullPath + "/toc/" + tocPath + (tocPath == "" ? "" : "/") + (name ? name : ""),
				success: function(response) {
					if (handler) {
						handler(response.responseText);
					}
				}
			});
		};
		this.page = function(name, edit) {
			return new nabu.components.wiki.Page({ data: { wikiPath: wikiPath, path: this.path.replace(/[\/]+$/, "") + (name ? "/" + name : ""), edit: typeof(edit) == "undefined" ? false : edit}});
		};
		this.write = function(name, handler, content, contentType) {
			return nabu.utils.ajax({
				method: "PUT",
				url: self.fullPath + "/item/" + self.path + (contentType ? "?type=" + contentType : ""),
				data: content,
				success: handler
			});
		};
		this.read = function(name, handler, contentType) {
			return nabu.utils.ajax({
				method: "GET",
				url: self.fullPath + "/item/" + self.path + (name ? "/" + name : "") + (contentType ? "?type=" + contentType : ""),
				success: function(response) {
					if (handler) {
						handler(response.responseText);
					}
				}
			});
		};
		this.list = function(handler, recursive) {
			return nabu.utils.ajax({
				method: "GET",
				url: self.fullPath + "/list" + (self.path && self.path != "/" ? "/" + self.path : "") + (recursive ? "?recursive=true" : ""),
				success: function(response) {
					if (handler) {
						handler(JSON.parse(response.responseText));
					}
				}
			});
		};
	}
};

