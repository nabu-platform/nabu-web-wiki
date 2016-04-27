if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }

nabu.components.wiki = {
	Page: Vue.component("n-wiki-page", {
		props: ["path", "wikiPath", "edit"],
		template: "<div class='n-wiki-page'></div>",
		data: function() {
			return {
				article: null
			};
		},
		activate: function(done) {
			var self = this;
			var type = this.edit ? "application/vnd-nabu-ehtml" : "text/html";
			var path = this.wikiPath ? this.wikiPath + "/wiki/item" : "wiki/item";
			nabu.utils.ajax({
				url: path + "/" + this.path + "?type=" + type,
				success: function(response) {
					self.article = response.responseText;
					done();
				}
			});
		},
		ready: function() {
			this.$el.innerHTML = this.article;
			if (!this.edit) {
				this.addAnchors();
			}
			else {
				this.editor = new nabu.services.Editor(this.$el);
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
			}
		}
	})
};

