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
			this.fullPath = this.wikiPath ? this.wikiPath + "/wiki" : "wiki";
			nabu.utils.ajax({
				url: this.fullPath + "/item/" + this.path + "?type=" + type,
				success: function(response) {
					self.article = response.responseText;
					done();
				}
			});
		},
		ready: function() {
			var self = this;
			this.$el.innerHTML = this.article;
			if (!this.edit) {
				this.addAnchors();
			}
			else {
				this.editor = new nabu.services.Editor(this.$el);
				this.editor.keyListener.listen(function(event) {
					event.preventDefault();
					event.stopPropagation();
					self.save();
				}, nabu.constants.keys.CTRL, nabu.constants.keys.S);
			}
		},
		methods: {
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
								url: self.fullPath + "/item/" + self.path,
								contentType: "application/vnd-nabu-ehtml",
								data: self.$el.innerHTML,
								success: function(response) {
									console.log("SAVED!");
									self.$emit("save.success");
								},
								error: function(response) {
									console.log("Failed text save", response);
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
	})
};

