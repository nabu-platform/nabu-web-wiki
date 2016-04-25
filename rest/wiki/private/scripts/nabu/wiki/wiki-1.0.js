if (typeof(nabu) == "undefined") { nabu = {}; }
if (!nabu.components) { nabu.components = {}; }


nabu.components.wiki = {
	Page: Vue.extend({
		props: ["path", "id", "edit"],
		template: "<div class='n-wiki-page'></div>",
		activate: function(done) {
			nabu.utils.ajax({
				url: this.path + "/download/" + this.id,
				success: function(response) {
					var article = response.responseText;
					this.$el.innerHTML = article;
					if (!edit) {
						this.addAnchors();
					}
					else {
						this.addBlockQuoteHandler();
					}
					done();
				}
			});
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
			addBlockQuoteHandler: function() {
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
			}
		}
	}),
	Editor: Vue.extend({

	})
};

