<template id="page-wiki-article">
	<div class="page-wiki">
		<n-sidebar v-if="configuring" @close="configuring = false" class="settings">
			<n-form class="layout2">
				<n-form-section>
					<n-collapsible title="Wiki Article Settings">
						<n-form-text v-model='cell.state.wikiPath' label='Article Path'/>
					</n-collapsible>
				</n-form-section>
			</n-form>
		</n-sidebar>
		<article v-content="content"></article>
	</div>
</template>