// not finished
Vue.view("page-wiki-article", {
	template: "#page-richtext",
	props: {
		page: {
			type: Object,
			required: true
		},
		parameters: {
			type: Object,
			required: false
		},
		cell: {
			type: Object,
			required: true
		},
		edit: {
			type: Boolean,
			required: true
		},
		localState: {
			type: Object,
			required: false
		}
	},
	data: function() {
		return {
			configuring: false,
			state: {}
		}
	},
	methods: {
		configure: function() {
			this.configuring = true;	
		}
	}
})