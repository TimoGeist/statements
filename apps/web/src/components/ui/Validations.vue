<script setup lang="ts">
// import { useVueTable, createColumnHelper, type TableOptions, getCoreRowModel, FlexRender } from "@tanstack/vue-table"
import RefreshIcon from '@/components/ui/RefreshIcon.vue'
import ValidationActions from '@/components/ui/ValidationActions.vue'
import { combinedViews, initialLoading, models, API_URL } from "@/components/state";
import { ref, computed, type Ref } from 'vue'
// import Button from './button/Button.vue'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Badge } from "@/components/ui/badge"
import StatusIcon from '@/components/ui/StatusIcon.vue';
import { Toggle } from "@/components/ui/toggle"
import { Minimize2, Info, MoveLeft } from 'lucide-vue-next'
// import DownloadIcon from "@/components/ui/DownloadIcon.vue"
import {
	Pagination,
	PaginationFirst,
	PaginationLast,
	PaginationList,
	PaginationListItem,
	PaginationNext,
	PaginationPrev,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card'
import { openBrowserDownload } from '@/lib/utils';
import * as st from "@repo/types"
// import DatabaseIcon from "@/components/ui/DatabaseIcon.vue"
// import ClearIcon from "@/components/ui/ClearIcon.vue"
// import ClockIcon from "@/components/ui/ClockIcon.vue"
// import SyncIcon from "@/components/ui/SyncIcon.vue"
// import RefreshDatabaseIcon from "@/components/ui/RefreshDatabaseIcon.vue"
// import SaveIcon from "@/components/ui/SaveIcon.vue"

async function downloadAllValidations() {
	openBrowserDownload(`${API_URL}/validations?populate=true`, `validations${(new Date()).toISOString()}.json`);
}

const shortenURLs = ref(true)
const itemsPerPage = 18;
const currentPage = ref(0) //zero indexed
const totalPages = computed(() => {
	const count = Math.ceil(combinedViews.value.length / itemsPerPage)
	console.log("pages", count)
	return count;
});
const shownCombinedViews = computed(() => {

	const startIdx = currentPage.value * itemsPerPage;
	const endIdx = (currentPage.value + 1) * itemsPerPage
	const views = combinedViews.value.slice(startIdx, endIdx)
	// console.log("views", combinedViews.value.length)
	// console.log("itemsPerPage", itemsPerPage)
	// console.log("page", currentPage.value)
	// console.log("shown start and end idx", startIdx, endIdx)
	console.log("shownCombinedViews", views)
	return views;
})


</script>

<template>
	<div class="w-full h-full max-h-[980px] p-6 pl-4 pt-4 flex flex-col justify-between">
		<div>
			<!-- <div class="flex justify-between gap-4">
				<div class="flex gap-4">
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-center justify-center">
							<Button variant="secondary" @click.prevent @mousedown="refreshDatabaseViews()">
								<RefreshIcon width="20px" />
							</Button>
						</HoverCardTrigger>
						<HoverCardContent side="bottom">
							<div>Resynchronize validations of all other users from database.</div>
						</HoverCardContent>
					</HoverCard>
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-center justify-center">
							<Button variant="secondary" :disabled="initialLoading" @click.prevent
								@mousedown="refreshDatabaseViews()">
								<RefreshDatabaseIcon width="20px" />

							</Button>
						</HoverCardTrigger>
						<HoverCardContent side="bottom">
							<div>Download a JSON of all validations in the database.</div>
						</HoverCardContent>
					</HoverCard>
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-center justify-center">
							<Button variant="secondary" :disabled="initialLoading" @click.prevent
								@mousedown="downloadAllValidations()">
								<DownloadIcon width="22px" />
								<DownloadIcon width="22px" />
							</Button>
						</HoverCardTrigger>
						<HoverCardContent side="bottom">
							<div>Download a JSON of all validations in the database.</div>
						</HoverCardContent>
					</HoverCard>
				</div>
				<div class="flex gap-4">
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-center justify-center">
							<Button variant="secondary" :disabled="initialLoading" @click.prevent
								@mousedown="clearErrors()">
								<ClearIcon width="24px" />
							</Button>
						</HoverCardTrigger>
						<HoverCardContent side="bottom">
							<div>Download a JSON of all validations in the database.</div>
						</HoverCardContent>
					</HoverCard>
					<HoverCard :openDelay="100" :closeDelay="0">
						<HoverCardTrigger as-child class="flex items-center justify-center">
							<Button variant="secondary" :disabled="initialLoading" @click.prevent
								@mousedown="downloadAllSessionValidations()">
								<StatusIcon :status="'waiting'" size="18"/>
								<ClockIcon width="24px" />
								<DownloadIcon width="22px" />
							</Button>
						</HoverCardTrigger>
						<HoverCardContent side="bottom">
							<div>Download a JSON of all validations in the database.</div>
						</HoverCardContent>
					</HoverCard>
				</div>

			</div> -->
			<div class="border rounded-md mt-4">
				<Table class="overflow-hidden">
					<TableCaption class="pb-4" v-if="initialLoading">
						<StatusIcon :size="20" :status="'active'"></StatusIcon>
					</TableCaption>
					<TableCaption class="pb-4" v-else-if="combinedViews.length === 0">
						Make your first validation.
					</TableCaption>
					<TableHeader>
						<TableRow class="hover:bg-transparent text-left">
							<TableHead class="w-8 h-10">
								Result
							</TableHead>
							<TableHead class="w-[512px] h-10">
								Statement
							</TableHead>
							<TableHead class="w-96 h-10 flex items-center justify-start">
								Validation website URL
								<Toggle v-model:pressed="shortenURLs" class="ml-4 p-1 h-6">
									<Minimize2 :size="20" />
								</Toggle>
							</TableHead>
							<TableHead class="text-left h-10">
								Model
							</TableHead>
							<TableHead class="text-center h-10">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						<template v-for="(  v, idx  ) in shownCombinedViews  " :key="idx">
							<TableRow class="text-left">
								<TableCell class=" h-10 py-0 flex justify-center items-center relative">
									<HoverCard :openDelay="100" :closeDelay="0">
										<HoverCardTrigger class="flex items-center justify-center absolute">
											<StatusIcon class="w-6 h-6" :size="24"
												:status="v.status !== 'completed' ? v.status : v.result.verdict">
											</StatusIcon>
										</HoverCardTrigger>
										<HoverCardContent side="left">
											<span v-if="v.status === 'active'">Your query is being validated.</span>
											<span v-else-if="v.status === 'failed'">There was an error validating your
												query.</span>
											<span v-else-if="v.status === 'waiting'">Your query is queued for
												validation.
												Queue position: {{ v.queueOrder + 1 || null }}</span>
											<span v-else-if="v.status === 'completed'">
												<span v-if="v.result.verdict === true">The statement <b>has
														been confirmed to be true</b> according to the given
													source.</span>
												<span v-if="v.result.verdict === false">The statement <b>was
														confirmed to be false</b> according to the given source.</span>
												<span v-if="v.result.verdict === null">The given source <b>was deemed to be
													insufficient</b> to prove or disprove the statement.</span>
											</span>
										</HoverCardContent>
									</HoverCard>
									<div class="absolute text-[8px] top-2 font-bold text-black -z-30">
										{{ (v.queueOrder + 1) || null }}
									</div>
								</TableCell>
								<TableCell class="w-[512px] h-10 py-0">
									<Badge v-for="part in v.statement"
										class="mr-1 pt-1 bg-primary text-background hover:bg-white hover:text-black">
										{{ part }}
									</Badge>
								</TableCell>
								<TableCell class="py-0 w-96">
									<Button variant="link" class="p-0">
										<a :href="v.resourceURL" class="max-w-full text-ellipsis">
											{{ shortenURLs ? v.resourceURL.split("://")[1].split("/")[0] :
												v.resourceURL }}
										</a>
									</Button>
								</TableCell>
								<TableCell class="py-0 h-10">
									<span class="flex items-center">
										{{
											v.modelOptions.id
										}}
										<HoverCard :openDelay="100" :closeDelay="0">
											<HoverCardTrigger as-child class="flex items-center justify-center">
												<Info class="ml-1 text-muted-foreground" :size="14"></Info>
											</HoverCardTrigger>
											<HoverCardContent class="w-96" side="bottom">
												<div>
													<pre class="inline-block w-96">{{ 
														{
															...models.find(model => model.id === v.modelOptions.id),
															name: undefined,
															model: undefined,
															digest: undefined,
															modified_at: undefined
														} }}</pre>
												</div>
											</HoverCardContent>
										</HoverCard>
									</span>
								</TableCell>
								<TableCell class="py-0 h-10">
									<span class="flex items-center justify-center">
										<ValidationActions :databaseId="v._id?.toString()" :status="v.status"></ValidationActions>
									</span>
								</TableCell>
							</TableRow>
						</template>
					</TableBody>
				</Table>
			</div>
		</div>


		<Pagination v-show="combinedViews.length > 0" class="bottom-0" v-slot="{ page }" :total="combinedViews.length"
			:sibling-count="1" :itemsPerPage="itemsPerPage" :default-page="1">
			<PaginationList v-slot="{ items }" class="flex items-center gap-1 justify-center pt-6">
				<PaginationFirst @click="currentPage = 0" :disabled="currentPage === 0" />
				<PaginationPrev @click="currentPage--" :disabled="currentPage === 0" />
				<template v-for="(  item, index  ) in items">
					<PaginationListItem v-if="item.type === 'page' && item.value <= totalPages + 1" :key="index"
						:value="item.value" as-child>
						<Button class="w-10 h-10 p-0" :variant="item.value - 1 === currentPage ? 'default' : 'outline'"
							@click="currentPage = item.value - 1">
							{{ item.value }}
						</Button>
					</PaginationListItem>
				</template>
				<PaginationNext @click="currentPage++" :disabled="currentPage + 1 === totalPages" />
				<PaginationLast @click="currentPage = totalPages - 1" :disabled="currentPage + 1 === totalPages" />
			</PaginationList>
		</Pagination>
	</div>
</template>
